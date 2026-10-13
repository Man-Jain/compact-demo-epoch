import assert from "node:assert/strict";
import { it } from "node:test";
import { installWalletConnectErrorHandler } from "./walletConnectErrors.ts";

it("handles only WalletConnect subscription rejections and reports them", () => {
  const target = new EventTarget();
  let reported = 0;
  const remove = installWalletConnectErrorHandler(target, () => reported++);
  const walletError = new Event("unhandledrejection", { cancelable: true });
  Object.defineProperty(walletError, "reason", {
    value: new Error("Connection interrupted while trying to subscribe"),
  });
  target.dispatchEvent(walletError);
  assert.equal(walletError.defaultPrevented, true);
  assert.equal(reported, 1);

  const otherError = new Event("unhandledrejection", { cancelable: true });
  Object.defineProperty(otherError, "reason", {
    value: new Error("A different failure"),
  });
  target.dispatchEvent(otherError);
  assert.equal(otherError.defaultPrevented, false);
  assert.equal(reported, 1);

  remove();
  const laterError = new Event("unhandledrejection", { cancelable: true });
  Object.defineProperty(laterError, "reason", {
    value: new Error("Connection interrupted while trying to subscribe"),
  });
  target.dispatchEvent(laterError);
  assert.equal(laterError.defaultPrevented, false);
});
