import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useChainId,
  useWalletClient,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useNotification } from "../hooks/useNotification";
import { useAllocatorAPI } from "../hooks/useAllocatorAPI";
import { useERC20 } from "../hooks/useERC20";
import { useCompact } from "../hooks/useCompact";
import { useCreateAllocation } from "../hooks/useCreateAllocation";
import { useChainConfig } from "../hooks/use-chain-config";
import { getChainName, getBlockExplorerTxUrl } from "../utils/chains";
import CompactsList from "../components/CompactsList";
import AccountResourceLockBalances from "../components/AccountResourceLockBalances";
import { UserBalancesList } from "../components/UserBalancesList";
import { WalletConnect } from "../components/WalletConnect";
import {
  EpochIntentSDK,
  TaskType,
  type IntentQuoteResult,
  type SolveIntentParams,
} from "@epoch-protocol/epoch-intents-sdk";
import { ERC20_ABI } from "../constants/contracts";
import { getTokensForChain, getChainsFromGraph } from "../config/web3";

interface IntentTransactionStatus {
  status: string;
  transactionHash: string;
  chainId: number;
}

type TokenType = "native" | "erc20";

export default function BalancePage() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { showNotification } = useNotification();
  const { allocatorAddress } = useAllocatorAPI();
  const { supportedChains } = useChainConfig();
  const { isConfirming } = useCompact();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [tokenType, setTokenType] = useState<TokenType>("erc20");
  const [outputTokenAddress, setOutputTokenAddress] = useState("");
  const [depositTokenAddress, setDepositTokenAddress] = useState("");
  const [outputAmount, setOutputAmount] = useState("0");
  const [inputAmount, setInputAmount] = useState("100");
  const [inputAmountDisplay, setInputAmountDisplay] = useState("100");

  // Debounce: display updates immediately, inputAmount syncs after 300ms
  useEffect(() => {
    const t = setTimeout(() => setInputAmount(inputAmountDisplay), 300);
    return () => clearTimeout(t);
  }, [inputAmountDisplay]);

  const [destinationChainId, setDestinationChainId] = useState("");
  const [nonce, setNonce] = useState<string | null>(null);
  const [intentStatus, setIntentStatus] = useState<
    IntentTransactionStatus[] | null
  >(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [quoteResult, setQuoteResult] = useState<IntentQuoteResult | null>(
    null,
  );
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Tokens for current (source) chain; deposit and faucet use this
  const graphTokens = useMemo(() => getTokensForChain(chainId), [chainId]);
  const destinationChains = useMemo(
    () => getChainsFromGraph(chainId, { excludeCurrentChain: true }),
    [chainId],
  );
  // Output token options = tokens on the selected destination chain
  const outputTokenOptions = useMemo(() => {
    if (!destinationChainId) return [];
    const id = parseInt(destinationChainId, 10);
    if (Number.isNaN(id)) return [];
    return getTokensForChain(id);
  }, [destinationChainId]);

  // Sync deposit and faucet token when source chain / graph tokens change
  useEffect(() => {
    if (graphTokens.length === 0) return;
    const first = graphTokens[0];
    const hasDeposit = graphTokens.some(
      (t) => t.address === depositTokenAddress,
    );
    const hasFaucet = graphTokens.some((t) => t.address === faucetToken);
    if (!depositTokenAddress || !hasDeposit)
      setDepositTokenAddress(first.address);
    if (!faucetToken || !hasFaucet) setFaucetToken(first.address);
  }, [chainId, graphTokens]);

  // Sync output token when destination chain (and thus outputTokenOptions) changes
  useEffect(() => {
    if (outputTokenOptions.length === 0) return;
    const hasOutput = outputTokenOptions.some(
      (t) => t.address === outputTokenAddress,
    );
    if (!outputTokenAddress || !hasOutput) {
      setOutputTokenAddress(outputTokenOptions[0].address);
    }
  }, [destinationChainId, outputTokenOptions]);

  useEffect(() => {
    if (destinationChains.length === 0) return;
    const currentInList = destinationChains.some(
      (c) => c.chainId.toString() === destinationChainId,
    );
    if (!destinationChainId || !currentInList) {
      setDestinationChainId(destinationChains[0].chainId.toString());
    }
  }, [chainId, destinationChains]);

  // Faucet state
  const [faucetToken, setFaucetToken] = useState<string>("");
  const [faucetAmount, setFaucetAmount] = useState("100");
  const [isMinting, setIsMinting] = useState(false);

  // Output token lives on destination chain; use graph data, not useERC20 (which reads current chain)
  const selectedOutputToken = outputTokenOptions.find(
    (t) => t.address === outputTokenAddress,
  );

  const {
    isValid: isValidDeposit,
    isLoading: isLoadingDeposit,
    decimals: depositDecimals,
    balance: depositBalance,
    symbol: depositSymbol,
  } = useERC20(
    tokenType === "erc20" && depositTokenAddress
      ? (depositTokenAddress as `0x${string}`)
      : undefined,
  );

  // const { solveWithSolver, isLoading: isLoadingSolveWithSolver } =
  //   useSolveWithSolver();

  // const {
  //   mutate: submitUserIntentMutation,
  //   data: intentResponse,
  //   isPending: isSubmittingUserIntent,
  //   error: submitUserIntentError,
  // } = useSubmitUserIntent();

  const sessionToken = useMemo(
    () =>
      address ? (localStorage.getItem(`session-${address}`) ?? null) : null,
    [address],
  );

  useCreateAllocation(sessionToken ?? "");

  const info = useMemo(() => {
    const chainSpecific = supportedChains?.find(
      (c: any) => c.chainId === chainId.toString(),
    );
    return {
      chainName: getChainName(chainId),
      finalizationText: chainSpecific
        ? `Finalized ${chainSpecific.finalizationThresholdSeconds}s after deposit`
        : undefined,
      allocatorAddress,
    };
  }, [supportedChains, chainId, allocatorAddress]);

  const isReverseQuoteMode = useMemo(
    () =>
      (!inputAmountDisplay ||
        inputAmountDisplay === "0" ||
        isNaN(Number(inputAmountDisplay))) &&
      outputAmount &&
      !isNaN(Number(outputAmount)) &&
      Number(outputAmount) > 0,
    [inputAmountDisplay, outputAmount],
  );

  const isFormValid = useMemo(() => {
    if (!isConnected || !address || !allocatorAddress) return false;
    if (!outputAmount || isNaN(Number(outputAmount))) return false;
    if (isReverseQuoteMode) {
      if (!quoteResult?.tokenIn) return false;
    } else {
      if (!inputAmountDisplay || isNaN(Number(inputAmountDisplay)))
        return false;
    }
    if (tokenType === "erc20") {
      if (!outputTokenAddress || !selectedOutputToken) return false;
      if (!depositTokenAddress || !isValidDeposit || isLoadingDeposit)
        return false;
      try {
        const outputDecimals = selectedOutputToken.decimals;
        if (outputDecimals !== undefined) {
          const parts = outputAmount.split(".");
          if (parts.length > 1 && parts[1].length > outputDecimals)
            return false;
        }
      } catch {
        return false;
      }
    }
    return true;
  }, [
    isConnected,
    address,
    allocatorAddress,
    inputAmountDisplay,
    outputAmount,
    isReverseQuoteMode,
    quoteResult?.tokenIn,
    tokenType,
    outputTokenAddress,
    selectedOutputToken,
    depositTokenAddress,
    isValidDeposit,
    isLoadingDeposit,
  ]);

  const canFetchQuote = useMemo(() => {
    if (!walletClient || !address || !allocatorAddress) return false;
    if (!outputAmount || isNaN(Number(outputAmount))) return false;
    if (Number(outputAmount) <= 0) return false;
    if (!isReverseQuoteMode) {
      if (!inputAmountDisplay || isNaN(Number(inputAmountDisplay)))
        return false;
    }
    if (tokenType === "erc20") {
      if (!outputTokenAddress || !selectedOutputToken) return false;
      if (!depositTokenAddress || !isValidDeposit || isLoadingDeposit)
        return false;
    }
    return true;
  }, [
    walletClient,
    address,
    allocatorAddress,
    inputAmountDisplay,
    outputAmount,
    isReverseQuoteMode,
    tokenType,
    outputTokenAddress,
    selectedOutputToken,
    depositTokenAddress,
    isValidDeposit,
    isLoadingDeposit,
  ]);

  const fetchIntentQuote = async () => {
    if (!canFetchQuote) return;
    setIsLoadingQuote(true);
    setQuoteResult(null);
    try {
      const epochSdk = new EpochIntentSDK({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        walletClient: walletClient as any,
      });

      const { taskTypeString, intentData } = await epochSdk.getTaskData({
        taskType: TaskType.GetTokenOut,
        intentData: {
          isNative: tokenType === "native",
          depositTokenAddress,
          tokenInAmount: isReverseQuoteMode
            ? "0"
            : parseUnits(
                inputAmountDisplay || "0",
                depositDecimals ?? 18,
              ).toString(),
          outputTokenAddress,
          minTokenOut: parseUnits(
            outputAmount || "0",
            selectedOutputToken?.decimals ?? 18,
          ).toString(),
          destinationChainId: destinationChainId,
          protocolHashIdentifier:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          recipient: address as `0x${string}`,
        },
        extraDataTypestring: "uint256 somethingKey",
        extraData: {
          somethingKey: "123",
        },
      });

      const result = await epochSdk.getIntentQuote({
        sponsorAddress: address as `0x${string}`,
        taskTypeString,
        intentData,
        isNative: tokenType === "native",
      });

      setQuoteResult(result);

      showNotification({
        type: "success",
        title: "Quote Retrieved",
        message: isReverseQuoteMode
          ? `Required input: ${result.tokenIn ?? "—"} (raw)`
          : `Expected output: ${result.tokenOut ?? "—"} (raw)`,
        chainId,
        autoHide: true,
      });
    } catch (error) {
      showNotification({
        type: "error",
        title: "Quote Failed",
        message: error instanceof Error ? error.message : "Failed to get quote",
        chainId,
      });
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Auto-fetch quote when debounced input or output amount changes (skip initial mount)
  const isFirstQuoteTrigger = useRef(true);
  useEffect(() => {
    if (isFirstQuoteTrigger.current) {
      isFirstQuoteTrigger.current = false;
      return;
    }
    if (!canFetchQuote || isLoadingQuote || isConfirming) return;
    void fetchIntentQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on inputAmount or outputAmount
  }, [inputAmount, outputAmount]);

  const onSubmit = async () => {
    if (!isFormValid) return;
    try {
      const epochSdk = new EpochIntentSDK({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        walletClient: walletClient as any,
      });

      const effectiveTokenInAmount = isReverseQuoteMode
        ? (quoteResult!.tokenIn ?? "0")
        : parseUnits(
            inputAmountDisplay || "0",
            depositDecimals ?? 18,
          ).toString();

      const { taskTypeString, intentData } = await epochSdk.getTaskData({
        taskType: TaskType.GetTokenOut,
        intentData: {
          isNative: tokenType === "native",
          depositTokenAddress,
          tokenInAmount: effectiveTokenInAmount,
          outputTokenAddress,
          minTokenOut: parseUnits(
            outputAmount || "0",
            selectedOutputToken?.decimals ?? 18,
          ).toString(),
          destinationChainId: destinationChainId,
          protocolHashIdentifier:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          recipient: address as `0x${string}`,
        },
        extraDataTypestring: "uint256 somethingKey",
        extraData: {
          somethingKey: "123",
        },
      });

      console.log("taskTypeString: ", taskTypeString);
      console.log("intentData: ", intentData);

      const params: SolveIntentParams = {
        isNative: false,
        sponsorAddress: address as `0x${string}`,
        taskTypeString,
        intentData,
        ...(quoteResult ? { quoteResult } : {}),
      };
      const data = await epochSdk.solveIntent(params);
      console.log("data: ", data);

      // Store the nonce from the allocationResponse
      if (data?.allocationResponse?.nonce) {
        setNonce(data.allocationResponse.nonce);
      }

      showNotification({
        type: "success",
        title: "Deposit + Register + Allocation",
        message:
          "Deposit submitted, compact registered, and allocation created",
        chainId,
        autoHide: true,
      });
    } catch (error) {
      showNotification({
        type: "error",
        title: "Action Failed",
        message: error instanceof Error ? error.message : "Failed to submit",
        chainId,
      });
    }
  };

  const checkIntentStatus = async () => {
    if (!nonce || !address) return;

    setIsLoadingStatus(true);
    try {
      const epochSdk = new EpochIntentSDK({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        walletClient: walletClient as any,
      });

      const status = await epochSdk.getIntentStatus(address, nonce);
      setIntentStatus(status);

      showNotification({
        type: "success",
        title: "Status Updated",
        message: "Intent status retrieved successfully",
        chainId,
        autoHide: true,
      });
    } catch (error) {
      showNotification({
        type: "error",
        title: "Status Check Failed",
        message:
          error instanceof Error ? error.message : "Failed to check status",
        chainId,
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const mintTokens = async () => {
    if (!address || !faucetToken || !faucetAmount) return;

    const selectedToken = graphTokens.find((t) => t.address === faucetToken);
    if (!selectedToken) return;

    setIsMinting(true);
    const tempTxId = `pending-mint-${Date.now()}`;

    showNotification({
      type: "info",
      title: "Minting Tokens",
      message: `Minting ${faucetAmount} ${selectedToken.symbol}...`,
      stage: "initiated",
      txHash: tempTxId,
      chainId,
      autoHide: false,
    });

    try {
      const amount = parseUnits(faucetAmount, selectedToken.decimals);

      const hash = await writeContractAsync({
        address: faucetToken as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "mint",
        args: [address, amount],
      });

      showNotification({
        type: "success",
        title: "Mint Submitted",
        message: "Waiting for confirmation...",
        stage: "submitted",
        txHash: hash,
        chainId,
        autoHide: true,
      });

      if (publicClient) {
        void publicClient
          .waitForTransactionReceipt({ hash })
          .then((receipt) => {
            if (receipt.status === "success") {
              showNotification({
                type: "success",
                title: "Tokens Minted",
                message: `Successfully minted ${faucetAmount} ${selectedToken.symbol}`,
                stage: "confirmed",
                txHash: hash,
                chainId,
                autoHide: false,
              });
            } else {
              showNotification({
                type: "error",
                title: "Mint Failed",
                message: "Transaction reverted",
                txHash: hash,
                chainId,
              });
            }
          });
      }
    } catch (error) {
      showNotification({
        type: "error",
        title: "Mint Failed",
        message:
          error instanceof Error ? error.message : "Failed to mint tokens",
        chainId,
      });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-bold text-white">Balance</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage deposits and allocations.
          </p>
        </div>
        <div className="flex-shrink-0">
          <WalletConnect hasSession={!!sessionToken} />
        </div>
      </div>

      {!isConnected || !address ? (
        <div className="p-12 bg-[#0a0a0a] rounded-lg border border-gray-800 text-center">
          <div className="max-w-md mx-auto grid">
            <p className="text-gray-300 text-lg mb-2">
              Please connect your wallet to continue
            </p>
            <p className="text-gray-500 text-sm">
              Use the button in the top right corner to connect
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Balances: wallet list + locked balances with initiate/withdraw */}
          <UserBalancesList tokens={graphTokens} />

          {/* Top Row: Deposit Form and Your Compacts side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deposit Form */}
            <div className="p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Chain</div>
                  <div className="text-gray-200">{info.chainName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Allocator</div>
                  <div className="text-gray-200 break-all">
                    {info.allocatorAddress}
                  </div>
                </div>
                {info.finalizationText && (
                  <div className="col-span-2 text-xs text-gray-500">
                    {info.finalizationText}
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setTokenType("native")}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    tokenType === "native"
                      ? "bg-[#00ff00] text-gray-900"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Native
                </button>
                <button
                  type="button"
                  onClick={() => setTokenType("erc20")}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    tokenType === "erc20"
                      ? "bg-[#00ff00] text-gray-900"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  ERC20
                </button>
              </div>

              {tokenType === "erc20" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Output Token
                  </label>
                  <select
                    value={outputTokenAddress}
                    onChange={(e) => setOutputTokenAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#00ff00]"
                  >
                    {outputTokenOptions.map((token) => (
                      <option key={token.address} value={token.address}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-xs text-gray-400 font-mono">
                    {outputTokenAddress}
                  </div>
                </div>
              )}

              {tokenType === "erc20" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Input Token Address
                  </label>
                  <select
                    value={depositTokenAddress}
                    onChange={(e) => setDepositTokenAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#00ff00]"
                  >
                    {graphTokens.map((token) => (
                      <option key={token.address} value={token.address}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-xs text-gray-400 font-mono">
                    {depositTokenAddress}
                  </div>
                  {depositBalance && depositSymbol && (
                    <div className="mt-1 text-xs text-gray-400">
                      Balance:{" "}
                      {parseFloat(depositBalance).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}{" "}
                      {depositSymbol}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Destination Chain
                </label>
                <select
                  value={destinationChainId}
                  onChange={(e) => setDestinationChainId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#00ff00]"
                >
                  {destinationChains.map((chain) => (
                    <option
                      key={chain.chainId}
                      value={chain.chainId.toString()}
                    >
                      {chain.name} ({chain.chainId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Minimum Output Amount
                  </label>
                  <input
                    type="text"
                    value={outputAmount}
                    onChange={(e) => setOutputAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#00ff00]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Input Amount{" "}
                    {isReverseQuoteMode && (
                      <span className="text-gray-500 font-normal">
                        (0 = reverse quote)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={inputAmountDisplay}
                    onChange={(e) => setInputAmountDisplay(e.target.value)}
                    placeholder={
                      isReverseQuoteMode ? "0 for reverse quote" : "0.0"
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#00ff00]"
                  />
                </div>
              </div>

              {quoteResult && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-2">
                  <div className="text-sm font-medium text-gray-300">
                    Quote Result
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">
                        {isReverseQuoteMode
                          ? "Required Input (tokenIn):"
                          : "tokenIn:"}
                      </span>{" "}
                      <span className="text-gray-200 font-mono">
                        {quoteResult.tokenIn
                          ? formatUnits(
                              BigInt(quoteResult.tokenIn),
                              depositDecimals ?? 18,
                            )
                          : "—"}
                      </span>
                      {quoteResult.tokenIn && depositSymbol && (
                        <span className="text-gray-500 ml-1">
                          {depositSymbol}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">tokenOut:</span>{" "}
                      <span className="text-gray-200 font-mono">
                        {quoteResult.tokenOut ?? "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        resourceLockRequired:
                      </span>{" "}
                      <span className="text-gray-200">
                        {String(quoteResult.resourceLockRequired ?? false)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isReverseQuoteMode
                      ? "tokenIn is the required input for your desired output. Submit to deposit this amount."
                      : "Use tokenOut to tweak Input Amount for expected output."}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fetchIntentQuote}
                  disabled={!canFetchQuote || isLoadingQuote || isConfirming}
                  className="flex-1 py-2 px-4 bg-gray-700 text-gray-200 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingQuote ? "Loading Quote..." : "Get Quote"}
                </button>
                <button
                  onClick={onSubmit}
                  disabled={!isFormValid || isConfirming}
                  className="flex-1 py-2 px-4 bg-[#00ff00] text-gray-900 rounded-lg font-medium hover:bg-[#00dd00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConfirming ? "Submitting..." : "Deposit + Submit Intent"}
                </button>
              </div>
            </div>
            <div>
              <AccountResourceLockBalances />
            </div>
            {/* Your Compacts */}
          </div>

          {/* Token Faucet Section */}
          <div className="p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">
                Token Faucet
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Mint test tokens to your connected wallet
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Token
                </label>
                <select
                  value={faucetToken}
                  onChange={(e) => setFaucetToken(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#00ff00]"
                >
                  {graphTokens.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-xs text-gray-400 font-mono">
                  {faucetToken}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="text"
                  value={faucetAmount}
                  onChange={(e) => setFaucetAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#00ff00]"
                />
              </div>
            </div>

            <button
              onClick={mintTokens}
              disabled={
                isMinting ||
                !address ||
                !faucetAmount ||
                isNaN(Number(faucetAmount))
              }
              className="w-full py-2 px-4 bg-[#00ff00] text-gray-900 rounded-lg font-medium hover:bg-[#00dd00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMinting ? "Minting..." : "Mint Tokens"}
            </button>
          </div>

          {/* Admin Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Admin Section</h2>
            <div>
              <CompactsList />
            </div>
          </div>

          {/* Intent Status Section */}
          {nonce && (
            <div className="p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-100">
                  Intent Status
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Check the status of your intent transaction
                </p>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Nonce</div>
                  <div className="text-gray-200 break-all font-mono text-sm">
                    {nonce}
                  </div>
                </div>

                <button
                  onClick={checkIntentStatus}
                  disabled={isLoadingStatus}
                  className="w-full py-2 px-4 bg-[#00ff00] text-gray-900 rounded-lg font-medium hover:bg-[#00dd00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingStatus ? "Checking..." : "Check Intent Status"}
                </button>
              </div>

              {intentStatus && intentStatus.length > 0 && (
                <div className="space-y-3 mt-4">
                  <div className="text-sm font-medium text-gray-300">
                    Transaction Status:
                  </div>
                  {intentStatus.map((tx, index) => {
                    const explorerUrl = getBlockExplorerTxUrl(
                      tx.chainId,
                      tx.transactionHash,
                    );
                    return (
                      <div
                        key={index}
                        className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">Status</div>
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              tx.status === "success"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {tx.status}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Transaction Hash
                          </div>
                          <div className="text-gray-200 break-all font-mono text-sm">
                            {explorerUrl ? (
                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00ff00] hover:text-[#00dd00] underline transition-colors"
                              >
                                {tx.transactionHash}
                              </a>
                            ) : (
                              tx.transactionHash
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Chain ID
                          </div>
                          <div className="text-gray-200">{tx.chainId}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {intentStatus && intentStatus.length === 0 && (
                <div className="text-sm text-gray-400 mt-4">
                  No transactions found for this intent.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
