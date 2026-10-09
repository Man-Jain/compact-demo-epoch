import assert from "node:assert/strict";
import test from "node:test";
import {
  createSolveCompletionNotification,
  EXECUTION_STATUS_NOTIFICATION_ID,
} from "./solveCompletionNotification";
import { getExecutionStatusNotification } from "./executionStatusNotifications";

test("marks a completed solve as the terminal replacement for its pending notification", () => {
  const notification = createSolveCompletionNotification({
    gaslessUsed: false,
  });

  assert.equal(notification.stage, "confirmed");
  assert.equal(notification.txHash, EXECUTION_STATUS_NOTIFICATION_ID);
  assert.equal(notification.autoHide, true);
  assert.equal(notification.title, "Deposit + Register + Allocation");
});

test("explains that wallet batching is paid and chain-local", () => {
  const batching = getExecutionStatusNotification({
    phase: "batching",
    transactionIndex: 0,
    totalTransactions: 5,
    chainId: 8453,
  });
  assert.equal(batching?.title, "Preparing wallet batch");
  assert.match(batching?.message ?? "", /user-paid/i);

  const confirmed = getExecutionStatusNotification({
    phase: "wallet-batch-confirmed",
    transactionIndex: 3,
    totalTransactions: 5,
    chainId: 4663,
    transactionHash: "0x1234",
  });
  assert.equal(confirmed?.title, "Wallet batch confirmed");
  assert.match(confirmed?.message ?? "", /Robinhood/i);
});

test("explains that Epoch pays only Robinhood destination gas", () => {
  const waiting = getExecutionStatusNotification({
    phase: "waiting-for-sponsored-destination",
    transactionIndex: 2,
    totalTransactions: 3,
    chainId: 4663,
  });
  assert.match(waiting?.message ?? "", /Epoch pays the destination gas/);
  const confirmed = getExecutionStatusNotification({
    phase: "sponsored-destination-confirmed",
    transactionIndex: 2,
    totalTransactions: 3,
    chainId: 4663,
    transactionHash: "0x1234",
  });
  assert.equal(confirmed?.title, "Sponsored swap confirmed");
});
