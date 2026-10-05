import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDexRouteExtraData,
  EXTERNAL_PROVIDER_OPTIONS,
  getFixedV4DestinationTokens,
  getDexRouteForOutputToken,
  getDexRouteTestConfig,
} from "./dex-pools";

const BASE_SEPOLIA_USDC = "0x2BB4FfD7E2c6D432b697554Efd77fA13bdbefd69";
const BASE_SEPOLIA_USDT = "0xc04d2869665Be874881133943523723Be5782720";
const ROBINHOOD_WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";
const ROBINHOOD_PPORT = "0x52090044B98bacBA07693B464E11Cbdf69313351";
const ROBINHOOD_AI = "0x2E8c31162b855A2ffa90F6F8634643Ad6F111e18";
const ROBINHOOD_TORO = "0x95B551C94A2457B597e4838457eFFB4731880411";

const V4_WITNESS = "uint256 somethingKey,string dexPools";

test("lists every selectable external provider", () => {
  assert.deepEqual(
    EXTERNAL_PROVIDER_OPTIONS.map((option) => option.id),
    ["any", "khalani", "near", "lifi"],
  );
});

test("does not embed a provider in an automatic DEX route", () => {
  const result = buildDexRouteExtraData({
    route: "automatic-v3",
    destinationChainId: 84532,
    tokenIn: BASE_SEPOLIA_USDC,
    tokenOut: BASE_SEPOLIA_USDT,
  });

  assert.equal(result.extraDataTypestring, "uint256 somethingKey");
  assert.deepEqual(result.extraData, { somethingKey: "123" });
});

test("includes only the hooked v4 PoolKey in a route witness", () => {
  const result = buildDexRouteExtraData({
    route: "base-sepolia-hooked-v4",
    destinationChainId: 84532,
    tokenIn: BASE_SEPOLIA_USDC,
    tokenOut: BASE_SEPOLIA_USDT,
  });

  assert.equal(result.extraDataTypestring, V4_WITNESS);
  assert.equal("provider" in result.extraData, false);
  assert.equal(typeof result.extraData.dexPools, "string");
});

test("allows a different source asset for an external destination v4 swap", () => {
  const result = buildDexRouteExtraData({
    route: "base-sepolia-hooked-v4",
    destinationChainId: 84532,
    tokenIn: "0x7946dd86eE310D0aC16804A37787289Fa5b88A8A",
    tokenOut: BASE_SEPOLIA_USDT,
  });
  assert.equal("provider" in result.extraData, false);
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

test("selecting PPORT chooses the LI.FI-backed Robinhood v4 route", () => {
  assert.deepEqual(getFixedV4DestinationTokens(4663), [
    { symbol: "PPORT", address: ROBINHOOD_PPORT, decimals: 18 },
    { symbol: "AI", address: ROBINHOOD_AI, decimals: 18 },
    { symbol: "TORO", address: ROBINHOOD_TORO, decimals: 18 },
  ]);
  assert.equal(
    getDexRouteForOutputToken(4663, ROBINHOOD_PPORT),
    "robinhood-weth-pport-v4",
  );
  assert.equal(getDexRouteForOutputToken(4663, ROBINHOOD_WETH), null);

  const result = buildDexRouteExtraData({
    route: "robinhood-weth-pport-v4",
    destinationChainId: 4663,
    tokenIn: BASE_SEPOLIA_USDC,
    tokenOut: ROBINHOOD_PPORT,
  });
  assert.equal("provider" in result.extraData, false);
  assert.equal(result.extraDataTypestring, V4_WITNESS);
  assert.equal(typeof result.extraData.dexPools, "string");
});

test("selecting TORO signs the mainnet native ETH/TORO PoolKey", () => {
  assert.equal(
    getDexRouteForOutputToken(4663, ROBINHOOD_TORO),
    "robinhood-eth-toro-v4",
  );
  const result = buildDexRouteExtraData({
    route: "robinhood-eth-toro-v4",
    destinationChainId: 4663,
    tokenIn: BASE_SEPOLIA_USDC,
    tokenOut: ROBINHOOD_TORO,
  });
  assert.equal(result.extraDataTypestring, V4_WITNESS);
  const [pool] = JSON.parse(result.extraData.dexPools ?? "[]");
  assert.deepEqual(pool, {
    protocol: "uniswap-v4",
    chainId: 4663,
    poolKey: {
      currency0: "0x0000000000000000000000000000000000000000",
      currency1: ROBINHOOD_TORO.toLowerCase(),
      fee: 3000,
      tickSpacing: 60,
      hooks: "0xc035dc35566f8dc36331f30d5ec4108a2eded0cc",
    },
    hookData: "0x",
  });
});

test("selecting AI signs the verified LI.FI-backed FablesRamp v4 route", () => {
  assert.equal(
    getDexRouteForOutputToken(4663, ROBINHOOD_AI),
    "robinhood-ai-usdg-v4",
  );

  const result = buildDexRouteExtraData({
    route: "robinhood-ai-usdg-v4",
    destinationChainId: 4663,
    tokenIn: BASE_SEPOLIA_USDC,
    tokenOut: ROBINHOOD_AI,
  });

  assert.equal("provider" in result.extraData, false);
  assert.equal(typeof result.extraData.dexPools, "string");
  const [pool] = JSON.parse(result.extraData.dexPools ?? "[]");
  assert.deepEqual(pool.poolKey, {
    currency0: ROBINHOOD_AI.toLowerCase(),
    currency1: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168".toLowerCase(),
    fee: 0x800000,
    tickSpacing: 60,
    hooks: "0x08E52564Bad99E05a694B4809F397eDCA417A080".toLowerCase(),
  });
  assert.equal(result.extraDataTypestring, V4_WITNESS);
});

test("Tesoro staging ETH/TORO is an explicit native v4 test route", () => {
  const route = getDexRouteTestConfig("tesoro-staging-eth-toro-v4");
  assert.equal(route?.destinationChainId, 466300);
  assert.equal(
    route?.pool.poolKey.currency0,
    "0x0000000000000000000000000000000000000000",
  );
  assert.equal(route?.tokenOut.symbol, "TORO");
  assert.equal(
    route?.pool.poolKey.hooks.toLowerCase(),
    "0xc035dc35566f8dc36331f30d5ec4108a2eded0cc",
  );
});
