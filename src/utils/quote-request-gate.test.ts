import assert from "node:assert/strict";
import test from "node:test";
import * as quoteRequestGate from "./quote-request-gate.ts";

test("drops a quote response after the form begins a newer request", () => {
  const createGate = (
    quoteRequestGate as typeof quoteRequestGate & {
      createQuoteRequestGate?: () => {
        begin(): number;
        complete(requestId: number): boolean;
        invalidate(): boolean;
        isCurrent(requestId: number): boolean;
      };
    }
  ).createQuoteRequestGate;

  assert.equal(typeof createGate, "function");

  const gate = createGate!();
  const first = gate.begin();
  const second = gate.begin();

  assert.equal(gate.isCurrent(first), false);
  assert.equal(gate.isCurrent(second), true);
});

test("reports when invalidation clears an active quote", () => {
  const createGate = (
    quoteRequestGate as typeof quoteRequestGate & {
      createQuoteRequestGate?: () => {
        begin(): number;
        invalidate(): boolean;
        isCurrent(requestId: number): boolean;
      };
    }
  ).createQuoteRequestGate;

  const gate = createGate!();
  const pending = gate.begin();

  assert.equal(gate.invalidate(), true);
  assert.equal(gate.isCurrent(pending), false);
  assert.equal(gate.invalidate(), false);

  const next = gate.begin();
  assert.equal(gate.complete(next), true);
  assert.equal(gate.invalidate(), false);
});
