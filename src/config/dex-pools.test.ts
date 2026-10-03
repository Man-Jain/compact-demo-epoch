import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDexRouteExtraData,
  EXTERNAL_PROVIDER_OPTIONS,
  getSodaxDefaultToken,
  getSodaxSuggestedTokens,
} from "./dex-pools.ts";

const BASE_SEPOLIA_USDC = "0x2BB4FfD7E2c6D432b697554Efd77fA13bdbefd69";
const BASE_SEPOLIA_USDT = "0xc04d2869665Be874881133943523723Be5782720";

test("lists every external solver that can be selected in a signed intent", () => {
  assert.deepEqual(
    EXTERNAL_PROVIDER_OPTIONS.map((option) => option.id),
    ["any", "khalani", "near", "lifi", "sodax"],
  );
});

test("lists the verified Sodax USDC and USDG token suggestions", () => {
  assert.deepEqual(getSodaxSuggestedTokens(8453), [
    {
      symbol: "USDC",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
    },
  ]);
  assert.deepEqual(getSodaxSuggestedTokens(4663), [
    {
      symbol: "USDG",
      address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
      decimals: 6,
    },
  ]);
  assert.deepEqual(getSodaxSuggestedTokens(1), []);
});

test("uses Base USDC as the known-good default for the Sodax demo", () => {
  assert.deepEqual(getSodaxDefaultToken(8453), {
    symbol: "USDC",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  });
  assert.equal(getSodaxDefaultToken(1), undefined);
});

test("signs a selected external provider without a preferred DEX pool", () => {
  const result = buildDexRouteExtraData({
    route: "automatic-v3",
    destinationChainId: 84532,
    tokenIn: BASE_SEPOLIA_USDC,
    tokenOut: BASE_SEPOLIA_USDT,
    provider: "khalani",
  });

  assert.equal(
    result.extraDataTypestring,
    "uint256 somethingKey,string provider",
  );
  assert.deepEqual(result.extraData, {
    somethingKey: "123",
    provider: "khalani",
  });
});

test("combines a selected provider and hooked v4 PoolKey in one witness", () => {
  const result = buildDexRouteExtraData({
    route: "base-sepolia-hooked-v4",
    destinationChainId: 84532,
    tokenIn: BASE_SEPOLIA_USDC,
    tokenOut: BASE_SEPOLIA_USDT,
    provider: "sodax",
  });

  assert.equal(
    result.extraDataTypestring,
    "uint256 somethingKey,string provider,string dexPools",
  );
  assert.equal(result.extraData.provider, "sodax");
  assert.equal(typeof result.extraData.dexPools, "string");
});

test("allows a different source asset for an external destination v4 swap", () => {
  const result = buildDexRouteExtraData({
    route: "base-sepolia-hooked-v4",
    destinationChainId: 84532,
    tokenIn: "0x7946dd86eE310D0aC16804A37787289Fa5b88A8A",
    tokenOut: BASE_SEPOLIA_USDT,
    provider: "lifi",
  });
  assert.equal(result.extraData.provider, "lifi");
  assert.equal(typeof result.extraData.dexPools, "string");
});

test("rejects a preferred Ethereum pool when the destination is Robinhood", () => {
  assert.throws(
    () =>
      buildDexRouteExtraData({
        route: "ethereum-mainnet-stablepair-v4",
        destinationChainId: 4663,
        tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        tokenOut: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      }),
    /configured destination chain and token pair/,
  );
});
