type DeferredV4Quote = {
  externalExecution?: {
    provider?: unknown;
    destinationSwap?: {
      chainId?: unknown;
      executionTransactions?: unknown;
    };
  };
};

export type DeferredV4Execution = {
  chainId: number;
  transactionCount: number;
};

/**
 * A selected v4 route must carry its post-bridge destination calls. Refusing a
 * partial plan prevents a user from approving only the bridge and being left
 * with the intermediate asset on the destination chain.
 */
export function requireDeferredV4Execution(
  quote: DeferredV4Quote,
): DeferredV4Execution {
  const destinationSwap = quote.externalExecution?.destinationSwap;
  const transactions = destinationSwap?.executionTransactions;
  if (
    !destinationSwap ||
    !Number.isSafeInteger(destinationSwap.chainId) ||
    (destinationSwap.chainId as number) < 1 ||
    !Array.isArray(transactions) ||
    transactions.length === 0
  ) {
    throw new Error(
      "Selected Uniswap v4 route did not include deferred destination transactions. Refresh the quote before submitting.",
    );
  }
  return {
    chainId: destinationSwap.chainId as number,
    transactionCount: transactions.length,
  };
}
