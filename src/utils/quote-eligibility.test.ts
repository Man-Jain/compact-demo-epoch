import assert from "node:assert/strict";
import test from "node:test";
import * as eligibility from "./quote-eligibility.ts";

test("allows an ERC-20 quote without a wallet client when the connected form is valid", () => {
  const canRequestQuote = (
    eligibility as typeof eligibility & {
      canRequestQuote?: (input: {
        connected: boolean;
        address?: string;
        allocatorAddress?: string;
        sourceChainId?: number;
        inputAmount: string;
        outputAmount: string;
        tokenType: "erc20" | "native";
        outputResolved: boolean;
        depositResolved: boolean;
        outputDecimals?: number;
        depositDecimals?: number;
        customRoutingValid: boolean;
      }) => boolean;
    }
  ).canRequestQuote;

  assert.equal(typeof canRequestQuote, "function");
  assert.equal(
    canRequestQuote!({
      connected: true,
      address: "0x05013",
      allocatorAddress: "0xallocator",
      sourceChainId: 4663,
      inputAmount: "100",
      outputAmount: "0",
      tokenType: "erc20",
      outputResolved: true,
      depositResolved: true,
      outputDecimals: 18,
      depositDecimals: 18,
      customRoutingValid: true,
    }),
    true,
  );
  assert.equal(
    canRequestQuote!({
      connected: true,
      address: "0x05013",
      allocatorAddress: "0xallocator",
      inputAmount: "100",
      outputAmount: "0",
      tokenType: "erc20",
      outputResolved: true,
      depositResolved: true,
      outputDecimals: 18,
      depositDecimals: 18,
      customRoutingValid: true,
    }),
    false,
  );
});
