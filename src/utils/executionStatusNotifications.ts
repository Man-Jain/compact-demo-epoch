import type { TransactionExecutionStatus } from "@epoch-protocol/epoch-intents-sdk";
import { getChainName } from "./chains";

/** Stable id so in-progress execution alerts replace each other */
export const EXECUTION_STATUS_NOTIFICATION_ID = "pending-solve-intent";

type ExecutionNotification = {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  stage?: "initiated" | "submitted" | "confirmed";
  txHash?: string;
  chainId?: number;
  autoHide?: boolean;
};

export function getExecutionStatusNotification(
  status: TransactionExecutionStatus,
): ExecutionNotification | null {
  const txNum = status.transactionIndex + 1;
  const total = status.totalTransactions;
  const label = `Transaction ${txNum}/${total}`;
  const chainName = getChainName(status.chainId);
  const inProgress = {
    txHash: EXECUTION_STATUS_NOTIFICATION_ID,
    chainId: status.chainId,
    autoHide: false as const,
  };

  switch (status.phase) {
    case "starting":
      return {
        type: "info",
        title: "Starting",
        message: `${label}: getting ready…`,
        stage: "initiated",
        ...inProgress,
      };
    case "switching-chain":
      return {
        type: "info",
        title: "Switching chain",
        message: `${label}: switch your wallet to ${chainName} (${status.chainId})`,
        stage: "initiated",
        ...inProgress,
      };
    case "preparing-transaction":
      return {
        type: "info",
        title: "Preparing transaction",
        message: `${label}: checking readiness (attempt ${status.attempt ?? 1})…`,
        stage: "initiated",
        ...inProgress,
      };
    case "waiting-for-transaction":
      return {
        type: "warning",
        title: "Waiting for transaction",
        message: `${label}: not ready yet — retrying in 5s (${Math.ceil((status.remainingMs ?? 0) / 1000)}s left)`,
        stage: "initiated",
        ...inProgress,
      };
    case "sending":
      return {
        type: "info",
        title: "Confirm in wallet",
        message: `${label}: confirm the transaction in your wallet`,
        stage: "submitted",
        ...inProgress,
      };
    case "sent":
      return {
        type: "success",
        title: "Transaction sent",
        message: `${label}: submitted on ${chainName}`,
        stage: "confirmed",
        txHash: status.transactionHash,
        chainId: status.chainId,
        autoHide: false,
      };
    default:
      return null;
  }
}
