import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDexRouteExtraData,
  EXTERNAL_PROVIDER_OPTIONS,
} from "./dex-pools.ts";

const BASE_SEPOLIA_USDC = "0x2BB4FfD7E2c6D432b697554Efd77fA13bdbefd69";
const BASE_SEPOLIA_USDT = "0xc04d2869665Be874881133943523723Be5782720";

test("lists every external solver that can be selected in a signed intent", () => {
  assert.deepEqual(
    EXTERNAL_PROVIDER_OPTIONS.map((option) => option.id),
    ["any", "khalani", "near", "lifi", "sodax"],
  );
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
