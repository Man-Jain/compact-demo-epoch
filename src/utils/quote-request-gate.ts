export interface QuoteRequestGate {
  begin(): number;
  invalidate(): void;
  isCurrent(requestId: number): boolean;
}

/** Prevent an older asynchronous quote from overwriting newer form state. */
export function createQuoteRequestGate(): QuoteRequestGate {
  let latestRequestId = 0;

  return {
    begin() {
      latestRequestId += 1;
      return latestRequestId;
    },
    invalidate() {
      latestRequestId += 1;
    },
    isCurrent(requestId) {
      return requestId === latestRequestId;
    },
  };
}
