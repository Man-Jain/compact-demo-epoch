import assert from "node:assert/strict";
import test from "node:test";
import * as quoteRequestGate from "./quote-request-gate.ts";

test("drops a quote response after the form begins a newer request", () => {
  const createGate = (
    quoteRequestGate as typeof quoteRequestGate & {
      createQuoteRequestGate?: () => {
        begin(): number;
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
