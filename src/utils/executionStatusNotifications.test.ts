import assert from "node:assert/strict";
import test from "node:test";
import {
  createSolveCompletionNotification,
  EXECUTION_STATUS_NOTIFICATION_ID,
} from "./solveCompletionNotification";

test("marks a completed solve as the terminal replacement for its pending notification", () => {
  const notification = createSolveCompletionNotification({
    gaslessUsed: false,
  });

  assert.equal(notification.stage, "confirmed");
  assert.equal(notification.txHash, EXECUTION_STATUS_NOTIFICATION_ID);
  assert.equal(notification.autoHide, true);
  assert.equal(notification.title, "Deposit + Register + Allocation");
});
