/**
 * Use EIP-5792 batching when the connected wallet supports it.  Wallets that
 * do not implement wallet_getCapabilities still execute the same user-paid
 * calls in order, with one wallet confirmation per call.
 */
export function externalV4BatchOptions() {
  return {
    batchMode: "auto" as const,
    allowSequentialFallback: true,
  };
}
