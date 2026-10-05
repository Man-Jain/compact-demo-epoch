import assert from "node:assert/strict";
import test from "node:test";
import { externalV4BatchOptions } from "./external-v4-batch-mode";

test("selected v4 routes fall back to paid sequential calls when EIP-5792 is unavailable", () => {
  assert.deepEqual(externalV4BatchOptions(), {
    batchMode: "auto",
    allowSequentialFallback: true,
  });
});
