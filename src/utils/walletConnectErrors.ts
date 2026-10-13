export const WALLETCONNECT_ERROR_EVENT = "epoch:walletconnect-error";
export let walletConnectSubscriptionFailed = false;

/** Catch the relay's rejected subscription when WalletConnect rejects this origin. */
export function installWalletConnectErrorHandler(
  target: EventTarget,
  onError: () => void,
): () => void {
  const handleRejection = (event: Event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    if (!message.includes("Connection interrupted while trying to subscribe")) {
      return;
    }
    event.preventDefault();
    walletConnectSubscriptionFailed = true;
    onError();
  };
  target.addEventListener("unhandledrejection", handleRejection);
  return () =>
    target.removeEventListener("unhandledrejection", handleRejection);
}
