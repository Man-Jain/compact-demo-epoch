import { useState } from "react";
import { parseUnits, isAddress } from "viem";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { useNotification } from "../hooks/useNotification";
import { EpochIntentSDK } from "@epoch-protocol/epoch-intents-sdk";

/** Matches The Compact getForcedWithdrawalStatus enum */
export type ForcedWithdrawalStatus = "Disabled" | "Pending" | "Enabled";

interface WalletWithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  decimals: number;
  maxBalance: string;
  /** Compact deposit id – when set, uses initateDepositWithdrawal and withdrawToken from SDK */
  depositId: string;
  withdrawStatus: ForcedWithdrawalStatus;
  onSuccess?: () => void;
}

export function WalletWithdrawDialog({
  isOpen,
  onClose,
  symbol,
  decimals,
  maxBalance,
  depositId,
  withdrawStatus,
  onSuccess,
}: WalletWithdrawDialogProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { showNotification } = useNotification();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const maxNum = parseFloat(maxBalance);
  const amountNum = amount ? parseFloat(amount) : 0;
  const isValidAmount =
    amountNum > 0 &&
    amountNum <= maxNum &&
    (amount.split(".")[1]?.length ?? 0) <= decimals;
  const isValidRecipient = recipient ? isAddress(recipient) : false;
  const canWithdraw =
    withdrawStatus === "Enabled" &&
    isValidAmount &&
    isValidRecipient &&
    !isSubmitting;
  const canInitiate = withdrawStatus === "Disabled" && !isSubmitting;

  const getSdk = () => {
    if (!walletClient) return null;
    return new EpochIntentSDK({
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
      walletClient: walletClient as any,
    });
  };

  const handleInitiateWithdrawal = async () => {
    if (!address || !canInitiate) return;
    const sdk = getSdk();
    if (!sdk) {
      showNotification({
        type: "error",
        title: "Wallet not ready",
        message: "Please connect your wallet",
        chainId,
        autoHide: true,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await sdk.initateDepositWithdrawal(depositId);
      showNotification({
        type: "success",
        title: "Withdrawal initiated",
        message: "Forced withdrawal enabled. You can complete the withdrawal once it becomes ready.",
        txHash: result.transactionHash,
        chainId,
        autoHide: true,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Initiate withdrawal failed";
      if (!message.toLowerCase().includes("user rejected")) {
        showNotification({
          type: "error",
          title: "Initiate failed",
          message,
          chainId,
          autoHide: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!address || !canWithdraw || !recipient) return;
    const sdk = getSdk();
    if (!sdk) {
      showNotification({
        type: "error",
        title: "Wallet not ready",
        message: "Please connect your wallet",
        chainId,
        autoHide: true,
      });
      return;
    }
    const amountWei = parseUnits(amount, decimals).toString();
    setIsSubmitting(true);
    try {
      const result = await sdk.withdrawToken(depositId, recipient, amountWei);
      showNotification({
        type: "success",
        title: "Withdrawal submitted",
        message: `Sending ${amount} ${symbol} to ${recipient.slice(0, 10)}...`,
        txHash: result.transactionHash,
        chainId,
        autoHide: true,
      });
      setAmount("");
      setRecipient("");
      onSuccess?.();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Withdrawal failed";
      if (!message.toLowerCase().includes("user rejected")) {
        showNotification({
          type: "error",
          title: "Withdrawal failed",
          message,
          chainId,
          autoHide: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount("");
      setRecipient("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-white mb-4">
          Withdraw {symbol} (Compact)
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Deposit ID: {depositId}
        </p>

        {withdrawStatus === "Disabled" && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Initiate a forced withdrawal first. After a short waiting period you will be able to send tokens to a recipient.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInitiateWithdrawal}
                disabled={!canInitiate}
                className="flex-1 py-2 px-4 bg-[#00ff00] text-gray-900 rounded-lg font-medium hover:bg-[#00dd00] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Initiating..." : "Initiate withdrawal"}
              </button>
            </div>
          </div>
        )}

        {withdrawStatus === "Pending" && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Withdrawal is pending. Please wait until it becomes ready, then open this dialog again to complete the withdrawal.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2 px-4 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {withdrawStatus === "Enabled" && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Recipient</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#00ff00]"
                />
                {recipient && !isValidRecipient && (
                  <p className="text-xs text-red-400 mt-1">Invalid address</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#00ff00]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max: {maxBalance} {symbol}
                </p>
                {amount && !isValidAmount && (
                  <p className="text-xs text-red-400 mt-1">
                    Invalid amount (max {maxBalance} {symbol})
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={!canWithdraw}
                className="flex-1 py-2 px-4 bg-[#00ff00] text-gray-900 rounded-lg font-medium hover:bg-[#00dd00] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Withdrawing..." : "Withdraw"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
