import assert from "node:assert/strict";
import test from "node:test";
import {
  requireDeferredV4Execution,
  requireV4QuoteExecution,
} from "./deferred-v4-execution";

test("accepts an immediate Robinhood same-chain swap without a deferred leg", () => {
  assert.equal(
    requireV4QuoteExecution({ transactions: [{ chainId: 4663 }] }, 4663, 4663),
    undefined,
  );
});

test("rejects an empty same-chain execution plan", () => {
  assert.throws(
    () => requireV4QuoteExecution({ transactions: [] }, 4663, 4663),
    /did not include executable transactions/,
  );
});

test("still rejects a cross-chain quote that contains only source calls", () => {
  assert.throws(
    () =>
      requireV4QuoteExecution(
        { transactions: [{ chainId: 8453 }] },
        8453,
        4663,
      ),
    /did not include deferred destination transactions/,
  );
});

test("returns the deferred destination transaction count for a valid v4 quote", () => {
  assert.deepEqual(
    requireDeferredV4Execution({
      externalExecution: {
        provider: "lifi",
        destinationSwap: {
          chainId: 4663,
          executionTransactions: [
            { target: "0x0000000000000000000000000000000000000001" },
            { target: "0x0000000000000000000000000000000000000002" },
            { target: "0x0000000000000000000000000000000000000003" },
            { target: "0x0000000000000000000000000000000000000004" },
          ],
        },
      },
    }),
    { chainId: 4663, transactionCount: 4 },
  );
});

test("rejects a selected v4 route that has no deferred destination plan", () => {
  assert.throws(
    () => requireDeferredV4Execution({ externalExecution: undefined }),
    /did not include deferred destination transactions/,
  );
});

test("rejects a destination plan without executable calls", () => {
  assert.throws(
    () =>
      requireDeferredV4Execution({
        externalExecution: {
          provider: "lifi",
          destinationSwap: { chainId: 4663, executionTransactions: [] },
        },
      }),
    /did not include deferred destination transactions/,
  );
});
