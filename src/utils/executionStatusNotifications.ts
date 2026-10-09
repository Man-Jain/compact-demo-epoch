import type { TransactionExecutionStatus } from "@epoch-protocol/epoch-intents-sdk";
import { getChainName } from "./chains";
import { EXECUTION_STATUS_NOTIFICATION_ID } from "./solveCompletionNotification";

export { EXECUTION_STATUS_NOTIFICATION_ID } from "./solveCompletionNotification";

/** Stable id so in-progress execution alerts replace each other */

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
    case "batching":
      return {
        type: "info",
        title: "Preparing wallet batch",
        message: `${label}: asking your wallet for a user-paid atomic batch on ${chainName}. No gas sponsor is used.`,
        stage: "submitted",
        ...inProgress,
      };
    case "wallet-batch-confirmed":
      return {
        type: "success",
        title: "Wallet batch confirmed",
        message: `${label}: the user-paid batch confirmed on ${chainName}.`,
        stage: "confirmed",
        txHash: status.transactionHash,
        chainId: status.chainId,
        autoHide: false,
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
    case "settling":
      return {
        type: "info",
        title: "Waiting for LI.FI bridge",
        message:
          "Your source transaction is confirmed. Waiting for the destination asset before refreshing Uniswap v4 calldata…",
        stage: "confirmed",
        ...inProgress,
      };
    case "refreshing-destination":
      return {
        type: "info",
        title: "Bridge settled",
        message: `${label}: LI.FI delivered the bridge asset. Refreshing the Robinhood Uniswap v4 calls…`,
        stage: "initiated",
        ...inProgress,
      };
    case "preparing-sponsored-destination":
      return {
        type: "info",
        title: "Preparing sponsored swap",
        message:
          "Epoch is verifying the bridged asset and the signed Uniswap v4 pool before paying Robinhood gas.",
        stage: "initiated",
        ...inProgress,
      };
    case "waiting-for-sponsored-destination":
      return {
        type: "info",
        title: "Waiting for Epoch relay",
        message:
          "Confirm the exact swap delegation in your wallet. Epoch pays the destination gas; your bridged asset funds the swap.",
        stage: "submitted",
        ...inProgress,
      };
    case "sponsored-destination-confirmed":
      return {
        type: "success",
        title: "Sponsored swap confirmed",
        message:
          "The Robinhood Uniswap v4 swap confirmed. Epoch paid the destination gas.",
        stage: "confirmed",
        txHash: status.transactionHash,
        chainId: status.chainId,
        autoHide: false,
      };
    default:
      return null;
  }
}
