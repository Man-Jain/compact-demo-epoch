/** Stable ID shared by all lifecycle updates for one solve submission. */
export const EXECUTION_STATUS_NOTIFICATION_ID = "pending-solve-intent";

export type SolveCompletionNotification = {
  type: "success";
  title: string;
  message: string;
  stage: "confirmed";
  txHash: string;
  autoHide: true;
};

export function createSolveCompletionNotification({
  gaslessUsed,
}: {
  gaslessUsed?: boolean;
}): SolveCompletionNotification {
  return {
    type: "success",
    title: "Deposit + Register + Allocation",
    message: gaslessUsed
      ? "Gasless deposit submitted, compact registered, and allocation created"
      : "Deposit submitted, compact registered, and allocation created",
    stage: "confirmed",
    txHash: EXECUTION_STATUS_NOTIFICATION_ID,
    autoHide: true,
  };
}
