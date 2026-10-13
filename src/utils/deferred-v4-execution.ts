type DeferredV4Quote = {
  transactions?: unknown;
  externalExecution?: {
    provider?: unknown;
    destinationSwap?: {
      chainId?: unknown;
      executionTransactions?: unknown;
    };
  };
};

/** Same-chain quotes execute their swap immediately; cross-chain quotes need the deferred leg. */
export function requireV4QuoteExecution(
  quote: DeferredV4Quote,
  sourceChainId: number,
  destinationChainId: number,
): DeferredV4Execution | undefined {
  if (
    sourceChainId === destinationChainId &&
    !quote.externalExecution?.destinationSwap
  ) {
    if (!Array.isArray(quote.transactions) || quote.transactions.length === 0) {
      throw new Error(
        "The same-chain swap quote did not include executable transactions.",
      );
    }
    return undefined;
  }
  return requireDeferredV4Execution(quote);
}

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
  console.log("destinationSwap", destinationSwap);
  console.log("transactions", transactions);
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
