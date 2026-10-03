import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDexRouteExtraData,
  EXTERNAL_PROVIDER_OPTIONS,
  getSodaxDefaultToken,
  getSodaxSelectableTokens,
  getSodaxSuggestedTokens,
  getFixedV4DestinationTokens,
  getDexRouteForOutputToken,
} from "./dex-pools.ts";

const BASE_SEPOLIA_USDC = "0x2BB4FfD7E2c6D432b697554Efd77fA13bdbefd69";
const BASE_SEPOLIA_USDT = "0xc04d2869665Be874881133943523723Be5782720";

test("lists every external solver that can be selected in a signed intent", () => {
  assert.deepEqual(
    EXTERNAL_PROVIDER_OPTIONS.map((option) => option.id),
    ["any", "khalani", "near", "lifi"],
  );
});

test("lists the full live-registry ERC20 snapshot for Base and Robinhood", () => {
  const base = getSodaxSuggestedTokens(8453);
  assert.equal(base.length, 10);
  assert.deepEqual(
    base.map((token) => token.symbol),
    [
      "weETH",
      "USDC",
      "sUSDS",
      "wstETH",
      "cbBTC",
      "VIRTUAL",
      "cbETH",
      "SODA",
      "EURC",
      "MORPHO",
    ],
  );

  const robinhood = getSodaxSuggestedTokens(4663);
  assert.equal(robinhood.length, 28);
  assert.deepEqual(
    robinhood.slice(0, 5).map((token) => token.symbol),
    ["bnUSD", "SODA", "USDG", "SPCX", "NVDA"],
  );
  assert.ok(robinhood.some((token) => token.symbol === "BABA"));
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

test("restricts configured Sodax demo chains to verified selectable tokens", () => {
  const fallback = [
    {
      symbol: "DAI",
      address: "0x0000000000000000000000000000000000000001",
      decimals: 18,
    },
  ];
  const base = getSodaxSelectableTokens(8453, fallback);
  assert.equal(base.length, 10);
  assert.equal(base[0].symbol, "weETH");
  assert.deepEqual(getSodaxSelectableTokens(1, fallback), fallback);
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

const ROBINHOOD_WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";
const ROBINHOOD_PPORT = "0x52090044B98bacBA07693B464E11Cbdf69313351";

test("selecting PPORT on Robinhood chooses the configured LI.FI-backed v4 route", () => {
  assert.deepEqual(getFixedV4DestinationTokens(4663), [
    { symbol: "PPORT", address: ROBINHOOD_PPORT, decimals: 18 },
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
  assert.equal(result.extraData.provider, "lifi");
  assert.equal(
    result.extraDataTypestring,
    "uint256 somethingKey,string provider,string dexPools",
  );
  assert.equal(typeof result.extraData.dexPools, "string");
});

test("rejects a non-LI.FI provider for the configured Robinhood PPORT route", () => {
  assert.throws(
    () =>
      buildDexRouteExtraData({
        route: "robinhood-weth-pport-v4",
        destinationChainId: 4663,
        tokenIn: BASE_SEPOLIA_USDC,
        tokenOut: ROBINHOOD_PPORT,
        provider: "near",
      }),
    /requires provider lifi/,
  );
});
