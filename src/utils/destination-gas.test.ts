import assert from "node:assert/strict";
import { test } from "node:test";
import { destinationGasBudget } from "./destination-gas";

const NATIVE = "0x0000000000000000000000000000000000000000";
const USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";

test("reserves enough bridge-delivered ETH for at least three destination calls", () => {
  const result = destinationGasBudget({
    bridgeToken: NATIVE,
    estimatedBridgeAmount: 100_000_000n,
    gasPriceWei: 20n,
    transactionCount: 1,
    walletBalanceWei: 0n,
  });
  assert.equal(result.reserveWei, 54_000_000n);
  assert.equal(result.requiredWalletWei, 0n);
});

test("asks for destination ETH when the bridge delivers an ERC20", () => {
  const result = destinationGasBudget({
    bridgeToken: USDG,
    gasPriceWei: 20n,
    transactionCount: 3,
    walletBalanceWei: 10_000_000n,
  });
  assert.equal(result.reserveWei, 0n);
  assert.equal(result.requiredWalletWei, 44_000_000n);
});

test("rejects an ETH bridge too small to cover the gas reserve", () => {
  assert.throws(
    () =>
      destinationGasBudget({
        bridgeToken: NATIVE,
        estimatedBridgeAmount: 54_000_000n,
        gasPriceWei: 20n,
        transactionCount: 3,
        walletBalanceWei: 0n,
      }),
    /too small/i,
  );
});

test("requires an estimated ETH delivery before reserving bridge proceeds", () => {
  assert.throws(
    () =>
      destinationGasBudget({
        bridgeToken: NATIVE,
        gasPriceWei: 20n,
        transactionCount: 1,
        walletBalanceWei: 0n,
      }),
    /Cannot verify destination gas reserve without an estimated ETH bridge amount/,
  );
});

test("uses existing wallet ETH before reserving bridge proceeds", () => {
  const result = destinationGasBudget({
    bridgeToken: NATIVE,
    estimatedBridgeAmount: 100_000_000n,
    gasPriceWei: 20n,
    transactionCount: 3,
    walletBalanceWei: 14_000_000n,
  });
  assert.equal(result.reserveWei, 40_000_000n);
  assert.equal(
    destinationGasBudget({
      bridgeToken: NATIVE,
      estimatedBridgeAmount: 100_000_000n,
      gasPriceWei: 20n,
      transactionCount: 3,
      walletBalanceWei: 54_000_000n,
    }).reserveWei,
    0n,
  );
});
