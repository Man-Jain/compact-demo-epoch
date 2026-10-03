export interface QuoteRequestGate {
  begin(): number;
  complete(requestId: number): boolean;
  invalidate(): boolean;
  isCurrent(requestId: number): boolean;
}

/** Prevent an older asynchronous quote from overwriting newer form state. */
export function createQuoteRequestGate(): QuoteRequestGate {
  let latestRequestId = 0;
  let activeRequestId: number | undefined;

  return {
    begin() {
      latestRequestId += 1;
      activeRequestId = latestRequestId;
      return latestRequestId;
    },
    invalidate() {
      const hadActiveRequest = activeRequestId !== undefined;
      latestRequestId += 1;
      activeRequestId = undefined;
      return hadActiveRequest;
    },
    complete(requestId) {
      if (!this.isCurrent(requestId)) return false;
      activeRequestId = undefined;
      return true;
    },
    isCurrent(requestId) {
      return requestId === latestRequestId && requestId === activeRequestId;
    },
  };
}
