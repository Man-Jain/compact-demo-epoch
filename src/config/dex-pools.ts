import {
  DEX_POOLS_EXTRA_TYPESTRING,
  encodeDexPools,
  EXTERNAL_PROVIDER_EXTRA_TYPESTRING,
  EXTERNAL_QUOTE_PROVIDERS,
  type ExternalQuoteProvider,
  type UniswapV4PoolPreference,
} from "@epoch-protocol/epoch-commons-sdk";
import type { TokenInfo } from "./web3";

export type DexRouteId =
  "automatic-v3" | "base-sepolia-hooked-v4" | "ethereum-mainnet-stablepair-v4";

export type ExternalProviderSelection = "any" | ExternalQuoteProvider;

const EXTERNAL_PROVIDER_LABELS: Record<ExternalQuoteProvider, string> = {
  khalani: "Khalani only",
  near: "NEAR Intents only",
  lifi: "LI.FI only",
  sodax: "Sodax only",
};

/** Providers understood by the external solver's signed `provider` field. */
export const EXTERNAL_PROVIDER_OPTIONS: ReadonlyArray<{
  id: ExternalProviderSelection;
  label: string;
}> = [
  { id: "any", label: "Any enabled provider" },
  ...EXTERNAL_QUOTE_PROVIDERS.map((id) => ({
    id,
    label: EXTERNAL_PROVIDER_LABELS[id],
  })),
];

export const DEX_ROUTE_OPTIONS: ReadonlyArray<{
  id: DexRouteId;
  label: string;
  description: string;
}> = [
  {
    id: "automatic-v3",
    label: "Automatic Uniswap v3 (default)",
    description: "Use normal solver discovery and Uniswap v3 fallback.",
  },
  {
    id: "base-sepolia-hooked-v4",
    label: "Base Sepolia hooked Uniswap v4 pool",
    description:
      "Use the deployed PoolKey on the Base Sepolia destination chain.",
  },
  {
    id: "ethereum-mainnet-stablepair-v4",
    label: "Ethereum mainnet USDC/USDT Uniswap v4",
    description:
      "Test the external bridge plus Uniswap v4 flow against Uniswap's public StablePairHook pool on Ethereum.",
  },
];

const DUMMY_LENDING_CHAIN_IDS = new Set([84532, 11155111, 11155420]);

/** Test tokens deployed at the same deterministic addresses on each dummy chain. */
export const DUMMY_LENDING_TOKENS: readonly TokenInfo[] = [
  {
    symbol: "Test USDC",
    address: "0x2BB4FfD7E2c6D432b697554Efd77fA13bdbefd69",
    decimals: 18,
  },
  {
    symbol: "Test USDT",
    address: "0xc04d2869665Be874881133943523723Be5782720",
    decimals: 18,
  },
];

export function getDexTestTokens(chainId: number): readonly TokenInfo[] {
  return DUMMY_LENDING_CHAIN_IDS.has(chainId) ? DUMMY_LENDING_TOKENS : [];
}

/** Verified live Sodax assets for the Base-to-Robinhood demo route. */
const SODAX_SUGGESTED_TOKENS: Readonly<Record<number, readonly TokenInfo[]>> = {
  8453: [
    {
      symbol: "USDC",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
    },
  ],
  4663: [
    {
      symbol: "USDG",
      address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
      decimals: 6,
    },
  ],
};

export function getSodaxSuggestedTokens(chainId: number): readonly TokenInfo[] {
  return SODAX_SUGGESTED_TOKENS[chainId] ?? [];
}

export function getSodaxDefaultToken(chainId: number): TokenInfo | undefined {
  return getSodaxSuggestedTokens(chainId)[0];
}

const BASE_SEPOLIA_HOOKED_POOL: UniswapV4PoolPreference = {
  protocol: "uniswap-v4",
  chainId: 84532,
  poolKey: {
    currency0: "0x2BB4FfD7E2c6D432b697554Efd77fA13bdbefd69",
    currency1: "0xc04d2869665Be874881133943523723Be5782720",
    fee: 3000,
    tickSpacing: 60,
    hooks: "0xf892b81907d2b466E2bc469fD1097eb9424B40c0",
  },
  hookData:
    "0x70518dc220115fec722d1c344e307ec149ec2f25dc54c87a8908cb22e29867d1",
};

/**
 * Official Uniswap StablePairHook pool on Ethereum mainnet. The hook's
 * deployment and initialized USDC/USDT PoolKey are published by Uniswap:
 * https://github.com/Uniswap/v4-hooks-public#stablepairhook
 */
const ETHEREUM_MAINNET_STABLEPAIR_POOL: UniswapV4PoolPreference = {
  protocol: "uniswap-v4",
  chainId: 1,
  poolKey: {
    currency0: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    currency1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    fee: 0x800000,
    tickSpacing: 1,
    hooks: "0x0000113dCf4ADd69999Fad8F20F2b63F979bfcC0",
  },
  hookData: "0x",
};

type FixedV4RouteId = Exclude<DexRouteId, "automatic-v3">;

type FixedV4Route = {
  destinationChainId: number;
  pool: UniswapV4PoolPreference;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  testingInstructions: string;
};

const FIXED_V4_ROUTES: Record<FixedV4RouteId, FixedV4Route> = {
  "base-sepolia-hooked-v4": {
    destinationChainId: 84532,
    pool: BASE_SEPOLIA_HOOKED_POOL,
    tokenIn: DUMMY_LENDING_TOKENS[0]!,
    tokenOut: DUMMY_LENDING_TOKENS[1]!,
    testingInstructions:
      "Cross-chain fixture: switch your source wallet to Sepolia (11155111). The destination is Base Sepolia (84532), using Test USDC to Test USDT.",
  },
  "ethereum-mainnet-stablepair-v4": {
    destinationChainId: 1,
    pool: ETHEREUM_MAINNET_STABLEPAIR_POOL,
    tokenIn: {
      symbol: "USDC",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
    },
    tokenOut: {
      symbol: "USDT",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
    },
    testingInstructions:
      "Mainnet test: switch your wallet to Ethereum (1). This route uses the External — multi-transaction tier; use Get Quote to inspect the external bridge and destination v4 plan before submitting a real intent.",
  },
};

const DEFAULT_EXTRA_DATA = {
  extraDataTypestring: "uint256 somethingKey",
  extraData: { somethingKey: "123" },
};

export type DexRouteExtraData = {
  extraDataTypestring: string;
  extraData: {
    somethingKey: string;
    provider?: ExternalQuoteProvider;
    dexPools?: string;
  };
};

function sameAddress(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

export function getDexRouteTestConfig(route: DexRouteId): FixedV4Route | null {
  return route === "automatic-v3" ? null : FIXED_V4_ROUTES[route];
}

export function buildDexRouteExtraData(params: {
  route: DexRouteId;
  destinationChainId: number | undefined;
  tokenIn: string;
  tokenOut: string;
  provider?: ExternalQuoteProvider;
}): DexRouteExtraData {
  const route = getDexRouteTestConfig(params.route);
  if (!route) {
    return params.provider
      ? {
          extraDataTypestring: `${DEFAULT_EXTRA_DATA.extraDataTypestring},${EXTERNAL_PROVIDER_EXTRA_TYPESTRING}`,
          extraData: {
            ...DEFAULT_EXTRA_DATA.extraData,
            provider: params.provider,
          },
        }
      : DEFAULT_EXTRA_DATA;
  }

  const key = route.pool.poolKey;
  // The external provider bridges the source asset to the destination pool.
  // Only the final output must be a currency in that destination PoolKey.
  const outputMatches =
    sameAddress(params.tokenOut, key.currency0) ||
    sameAddress(params.tokenOut, key.currency1);
  if (
    params.destinationChainId !== route.destinationChainId ||
    !outputMatches
  ) {
    throw new Error(
      "The selected v4 route requires its configured destination chain and token pair.",
    );
  }

  return {
    extraDataTypestring: [
      DEFAULT_EXTRA_DATA.extraDataTypestring,
      params.provider ? EXTERNAL_PROVIDER_EXTRA_TYPESTRING : undefined,
      DEX_POOLS_EXTRA_TYPESTRING,
    ]
      .filter((entry): entry is string => Boolean(entry))
      .join(","),
    extraData: {
      ...DEFAULT_EXTRA_DATA.extraData,
      ...(params.provider ? { provider: params.provider } : {}),
      dexPools: encodeDexPools([route.pool]),
    },
  };
}
