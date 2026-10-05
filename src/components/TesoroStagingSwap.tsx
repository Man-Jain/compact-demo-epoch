import { useState } from "react";
import {
  createPublicClient,
  formatUnits,
  http,
  parseUnits,
  zeroAddress,
  type Hex,
} from "viem";
import { useSwitchChain } from "wagmi";
import { getDexRouteTestConfig } from "../config/dex-pools";
import { tesoroStaging } from "../config/wagmi";
import { useLocalSigner } from "../context/LocalSignerContext";
import { useEffectiveWallet } from "../hooks/useEffectiveWallet";

type SwapCall = { target: Hex; value: string; callData: Hex };
type StagingQuote = {
  chainId: number;
  poolId: Hex;
  amountIn: string;
  amountOut: string;
  minTokenOut: string;
  deadline: number;
  approvalTransactions: SwapCall[];
  swapTransactions: SwapCall[];
};

const EXPECTED_POOL_ID =
  "0xdd62283eaa53784680f7d19760a4305ef7c7e4806b158cc0cef9f4926e8d768d";
const ERC20_BALANCE_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;
const stagingClient = createPublicClient({
  chain: tesoroStaging,
  transport: http(),
});

export function TesoroStagingSwap() {
  const { address, walletClient, chainId, isLocalSigner } =
    useEffectiveWallet();
  const { setChainId: setLocalChainId } = useLocalSigner();
  const { switchChainAsync } = useSwitchChain();
  const [amount, setAmount] = useState("0.000001");
  const [quote, setQuote] = useState<StagingQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const route = getDexRouteTestConfig("tesoro-staging-eth-toro-v4")!;
  const solverUrl =
    import.meta.env.VITE_EXTERNAL_SOLVER_URL ||
    (import.meta.env.DEV ? "http://127.0.0.1:3010" : "");

  async function refreshQuote(): Promise<StagingQuote> {
    if (!address) throw new Error("Connect a wallet to test the pool.");
    if (!solverUrl)
      throw new Error(
        "Set VITE_EXTERNAL_SOLVER_URL to the external solver endpoint for this demo deployment.",
      );
    const amountIn = parseUnits(amount, 18);
    if (amountIn <= 0n) throw new Error("Enter a positive ETH amount.");
    const chain = await stagingClient.getChainId();
    if (chain !== 466300)
      throw new Error("Tesoro RPC returned the wrong chain.");
    const response = await fetch(`${solverUrl.replace(/\/$/, "")}/v4/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinationSwap: {
          protocol: "uniswap-v4",
          chainId: 466300,
          poolKey: route.pool.poolKey,
          hookData: route.pool.hookData,
          tokenIn: zeroAddress,
          tokenOut: route.tokenOut.address,
          amountIn: amountIn.toString(),
          callerMinTokenOut: "0",
          recipient: address,
          refundRecipient: address,
        },
      }),
    });
    if (!response.ok)
      throw new Error(
        `Staging quote failed (HTTP ${response.status}). Check the external solver and Tesoro RPC.`,
      );
    const data = (await response.json()) as { destinationSwap?: StagingQuote };
    const next = data.destinationSwap;
    if (
      !next ||
      next.chainId !== 466300 ||
      next.poolId.toLowerCase() !== EXPECTED_POOL_ID ||
      next.amountIn !== amountIn.toString() ||
      next.approvalTransactions.length !== 0 ||
      next.swapTransactions.length !== 1 ||
      next.swapTransactions[0]?.value !== next.amountIn
    ) {
      throw new Error("The solver returned an invalid native ETH/TORO route.");
    }
    return next;
  }

  async function getQuote() {
    setBusy(true);
    setMessage("");
    setQuote(null);
    try {
      const next = await refreshQuote();
      setQuote(next);
      setMessage("Quote ready. A fresh quote will be used when you execute.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Quote failed.");
    } finally {
      setBusy(false);
    }
  }

  async function execute() {
    setBusy(true);
    setMessage("");
    try {
      if (!address || !walletClient) throw new Error("Connect a wallet first.");
      if (chainId !== 466300)
        throw new Error(
          "Switch your wallet to Tesoro Staging before executing.",
        );
      const fresh = await refreshQuote();
      setQuote(fresh);
      const call = fresh.swapTransactions[0]!;
      const ethBalance = await stagingClient.getBalance({ address });
      if (ethBalance <= BigInt(call.value))
        throw new Error(
          "Fund this wallet with staging ETH for the swap and gas.",
        );
      const before = await stagingClient.readContract({
        address: route.tokenOut.address as Hex,
        abi: ERC20_BALANCE_ABI,
        functionName: "balanceOf",
        args: [address],
      });
      const send = walletClient.sendTransaction as (args: {
        account: Hex;
        chain: typeof tesoroStaging;
        to: Hex;
        data: Hex;
        value: bigint;
      }) => Promise<Hex>;
      const hash = await send({
        account: address,
        chain: tesoroStaging,
        to: call.target,
        data: call.callData,
        value: BigInt(call.value),
      });
      setMessage(`Transaction submitted: ${hash}. Waiting for confirmation…`);
      const receipt = await stagingClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success")
        throw new Error(`Swap reverted: ${hash}`);
      const after = await stagingClient.readContract({
        address: route.tokenOut.address as Hex,
        abi: ERC20_BALANCE_ABI,
        functionName: "balanceOf",
        args: [address],
      });
      const received = after - before;
      if (received < BigInt(fresh.minTokenOut))
        throw new Error(
          `Swap confirmed but received less than the quoted minimum: ${hash}`,
        );
      setMessage(
        `Swap confirmed: received ${formatUnits(received, 18)} TORO. Transaction ${hash}`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Swap failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded border border-[#00ff00]/30 bg-[#00ff00]/5 p-4 text-sm text-gray-200">
      <div className="font-medium text-[#00ff00]">
        Direct ETH → TORO on Tesoro Staging
      </div>
      <p>
        Chain 466300 · Tesoro fee hook · no bridge. The wallet pays gas and
        sends native ETH directly to the v4 router.
      </p>
      <label className="block">
        ETH amount
        <input
          className="mt-1 w-full rounded border border-gray-700 bg-gray-800 p-2"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
            setQuote(null);
          }}
        />
      </label>
      {chainId !== 466300 && (
        <button
          type="button"
          onClick={() => {
            if (isLocalSigner) {
              setLocalChainId(466300);
              return;
            }
            void switchChainAsync({ chainId: 466300 }).catch((error: unknown) =>
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Could not switch chain.",
              ),
            );
          }}
          className="rounded bg-gray-700 px-3 py-2"
        >
          Switch wallet to Tesoro Staging
        </button>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || !address}
          onClick={getQuote}
          className="rounded bg-gray-700 px-3 py-2 disabled:opacity-50"
        >
          Get staging quote
        </button>
        <button
          type="button"
          disabled={busy || !address || !walletClient || chainId !== 466300}
          onClick={execute}
          className="rounded bg-[#00ff00] px-3 py-2 text-gray-900 disabled:opacity-50"
        >
          Execute ETH → TORO
        </button>
      </div>
      {quote && (
        <p>
          Expected: {formatUnits(BigInt(quote.amountOut), 18)} TORO · minimum:{" "}
          {formatUnits(BigInt(quote.minTokenOut), 18)} TORO · approvals: 0 ·
          payable swap:{" "}
          {formatUnits(BigInt(quote.swapTransactions[0]!.value), 18)} ETH
        </p>
      )}
      {message && (
        <p role="status" className="break-all">
          {message}
        </p>
      )}
    </div>
  );
}
