import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import type { TokenInfo } from "../config/web3";
import { WalletWithdrawDialog } from "./WalletWithdrawDialog";
import { useNotification } from "../hooks/useNotification";
import {
  ALLOCATOR_ADDRESS,
  EpochIntentSDK,
} from "@epoch-protocol/epoch-intents-sdk";
import type { ForcedWithdrawalStatus } from "./WalletWithdrawDialog";

interface UserBalancesListProps {
  tokens: TokenInfo[];
}

export type CompactBalanceRow = {
  depositId: string;
  symbol: string;
  balance: string;
  decimals: number;
  withdrawStatus: ForcedWithdrawalStatus;
};

const WITHDRAW_STATUS_LABEL: Record<ForcedWithdrawalStatus, string> = {
  Disabled: "—",
  Pending: "Pending",
  Enabled: "Ready",
};

export function UserBalancesList({ tokens }: UserBalancesListProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { showNotification } = useNotification();

  const [balanceRows, setBalanceRows] = useState<CompactBalanceRow[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const loadBalances = useCallback(async () => {
    if (!isConnected || !address || !walletClient || tokens.length === 0) {
      setBalanceRows([]);
      return;
    }

    try {
      setIsLoadingBalances(true);
      const sdk = new EpochIntentSDK({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
        walletClient,
      });

      const tokenInputs = tokens.map((token) => ({
        address: token.address as `0x${string}`,
        symbol: token.symbol,
        decimals: token.decimals,
      }));

      const results = await sdk.getDepositedBalances(address, tokenInputs);
      setBalanceRows(results);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load balances";
      showNotification({
        type: "error",
        title: "Load balances failed",
        message,
        chainId,
        autoHide: true,
      });
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address, chainId, isConnected, showNotification, tokens, walletClient]);

  useEffect(() => {
    void loadBalances();
  }, [loadBalances]);

  const [withdrawRow, setWithdrawRow] = useState<CompactBalanceRow | null>(
    null,
  );
  const [disablingDepositId, setDisablingDepositId] = useState<string | null>(
    null,
  );

  const canDisable = (row: CompactBalanceRow) =>
    (row.withdrawStatus === "Pending" || row.withdrawStatus === "Enabled") &&
    disablingDepositId !== row.depositId;

  const handleDisableForcedWithdrawal = async (row: CompactBalanceRow) => {
    if (!walletClient) {
      showNotification({
        type: "error",
        title: "Wallet not ready",
        message: "Please connect your wallet",
        chainId,
        autoHide: true,
      });
      return;
    }
    setDisablingDepositId(row.depositId);
    try {
      const sdk = new EpochIntentSDK({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
        walletClient,
      });
      const result = await sdk.disableForcedWithdrawal(row.depositId);
      showNotification({
        type: "success",
        title: "Forced withdrawal disabled",
        message: "You can use this deposit for intents again.",
        txHash: result.transactionHash,
        chainId,
        autoHide: true,
      });
      await loadBalances();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Disable failed";
      if (!message.toLowerCase().includes("user rejected")) {
        showNotification({
          type: "error",
          title: "Disable failed",
          message,
          chainId,
          autoHide: true,
        });
      }
    } finally {
      setDisablingDepositId(null);
    }
  };

  if (!isConnected || !address) return null;

  return (
    <div className="p-6 bg-[#0a0a0a] rounded-lg border border-gray-800 space-y-6">
      <h2 className="text-xl font-bold text-white">User Balances</h2>
      <p className="text-sm text-gray-400">
        Balances from The Compact (balanceOf). Token IDs from allocator{" "}
        <code className="text-gray-500">{ALLOCATOR_ADDRESS.slice(0, 10)}…</code>{" "}
        and SDK helpers (createLockTag, getTokenId, getAllocatorId). Withdraw
        via SDK.
      </p>

      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50">
              <th className="px-4 py-3 text-gray-400 font-medium">Token</th>
              <th className="px-4 py-3 text-gray-400 font-medium">Balance</th>
              <th className="px-4 py-3 text-gray-400 font-medium">
                Withdraw status
              </th>
              <th className="px-4 py-3 text-gray-400 font-medium w-28">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoadingBalances && balanceRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-gray-500">
                  Loading Compact balances…
                </td>
              </tr>
            )}
            {!isLoadingBalances && balanceRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-gray-500">
                  No Compact balances for this allocator
                </td>
              </tr>
            )}
            {balanceRows.map((row) => (
              <tr
                key={row.depositId}
                className="border-b border-gray-800 hover:bg-gray-800/30"
              >
                <td className="px-4 py-3 text-gray-200">{row.symbol}</td>
                <td className="px-4 py-3 text-white font-mono">
                  {parseFloat(row.balance).toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}{" "}
                  {row.symbol}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {WITHDRAW_STATUS_LABEL[row.withdrawStatus]}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWithdrawRow(row)}
                      className="px-3 py-1.5 text-sm bg-[#00ff00] text-gray-900 rounded-lg font-medium hover:bg-[#00dd00] transition-colors"
                    >
                      Withdraw
                    </button>
                    {canDisable(row) && (
                      <button
                        type="button"
                        onClick={() => handleDisableForcedWithdrawal(row)}
                        disabled={disablingDepositId === row.depositId}
                        className="px-3 py-1.5 text-sm bg-gray-600 text-gray-200 rounded-lg font-medium hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {disablingDepositId === row.depositId
                          ? "Disabling..."
                          : "Disable"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {withdrawRow && (
        <WalletWithdrawDialog
          isOpen={!!withdrawRow}
          onClose={() => setWithdrawRow(null)}
          symbol={withdrawRow.symbol}
          decimals={withdrawRow.decimals}
          maxBalance={withdrawRow.balance}
          depositId={withdrawRow.depositId}
          withdrawStatus={withdrawRow.withdrawStatus}
          onSuccess={() => setWithdrawRow(null)}
        />
      )}
    </div>
  );
}
