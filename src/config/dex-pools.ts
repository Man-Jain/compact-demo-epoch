import {
  DEX_POOLS_EXTRA_TYPESTRING,
  encodeDexPools,
  EXTERNAL_QUOTE_PROVIDERS,
  type ExternalQuoteProvider,
  type UniswapV4PoolPreference,
} from "@epoch-protocol/epoch-commons-sdk";
import type { TokenInfo } from "./web3";

export type DexRouteId =
  | "automatic-v3"
  | "base-sepolia-hooked-v4"
  | "ethereum-mainnet-stablepair-v4"
  | "robinhood-weth-pport-v4"
  | "robinhood-ai-usdg-v4"
  | "robinhood-eth-toro-v4"
  | "tesoro-staging-eth-toro-v4";

export type ExternalProviderSelection = "any" | ExternalQuoteProvider;

const EXTERNAL_PROVIDER_LABELS: Record<ExternalQuoteProvider, string> = {
  khalani: "Khalani only",
  near: "NEAR Intents only",
  lifi: "LI.FI only",
};

/** Providers that can be selected before the SDK signs the intent. */
export const EXTERNAL_PROVIDER_OPTIONS: ReadonlyArray<{
  id: ExternalProviderSelection;
  label: string;
}> = [
  { id: "any", label: "LI.FI (SDK default)" },
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
  {
    id: "robinhood-weth-pport-v4",
    label: "Robinhood WETH/PPORT Uniswap v4",
    description:
      "LI.FI bridges into Robinhood WETH, then the selected v4 PoolKey swaps WETH to PPORT.",
  },
  {
    id: "robinhood-ai-usdg-v4",
    label: "Robinhood AI/USDG Uniswap v4 (FablesRamp)",
    description:
      "LI.FI bridges into Robinhood USDG, then the selected FablesRamp v4 PoolKey swaps USDG to AI.",
  },
  {
    id: "robinhood-eth-toro-v4",
    label: "Robinhood ETH/TORO Uniswap v4 (Tesoro hook)",
    description:
      "LI.FI bridges into native ETH on Robinhood, then the selected hooked v4 pool swaps ETH to TORO.",
  },
  {
    id: "tesoro-staging-eth-toro-v4",
    label: "Tesoro Staging ETH/TORO Uniswap v4",
    description:
      "Direct staging-chain test of the native ETH/TORO pool and Tesoro fee hook. No bridge.",
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
const ROBINHOOD_WETH_PPORT_POOL: UniswapV4PoolPreference = {
  protocol: "uniswap-v4",
  chainId: 4663,
  poolKey: {
    currency0: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
    currency1: "0x52090044B98bacBA07693B464E11Cbdf69313351",
    fee: 3000,
    tickSpacing: 60,
    hooks: "0x32f5a629b9B829963C4D885d0d1eDaaAB8d48a80",
  },
  hookData: "0x",
};

/**
 * Public Robinhood v4 AI/USDG FablesRamp pool. The PoolKey was verified from
 * the PoolManager Initialize event for pool id
 * 0x592e3fb7ea947506b36481025abc15baada8e1839a50fded46ecf08b3182fa96.
 */
const ROBINHOOD_AI_USDG_POOL: UniswapV4PoolPreference = {
  protocol: "uniswap-v4",
  chainId: 4663,
  poolKey: {
    currency0: "0x2E8c31162b855A2ffa90F6F8634643Ad6F111e18",
    currency1: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    fee: 0x800000,
    tickSpacing: 60,
    hooks: "0x08E52564Bad99E05a694B4809F397eDCA417A080",
  },
  hookData: "0x",
};

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

const TESORO_STAGING_ETH_TORO_POOL: UniswapV4PoolPreference = {
  protocol: "uniswap-v4",
  chainId: 466300,
  poolKey: {
    currency0: "0x0000000000000000000000000000000000000000",
    currency1: "0x95B551C94A2457B597e4838457eFFB4731880411",
    fee: 3000,
    tickSpacing: 60,
    hooks: "0xc035dc35566F8dc36331f30d5Ec4108A2eDeD0cC",
  },
  hookData: "0x",
};

const ROBINHOOD_ETH_TORO_POOL: UniswapV4PoolPreference = {
  ...TESORO_STAGING_ETH_TORO_POOL,
  chainId: 4663,
};

type FixedV4RouteId = Exclude<DexRouteId, "automatic-v3">;

type FixedV4Route = {
  destinationChainId: number;
  pool: UniswapV4PoolPreference;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  testingInstructions: string;
  autoSelectForOutput?: boolean;
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
  "robinhood-weth-pport-v4": {
    destinationChainId: 4663,
    pool: ROBINHOOD_WETH_PPORT_POOL,
    tokenIn: {
      symbol: "WETH",
      address: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
      decimals: 18,
    },
    tokenOut: {
      symbol: "PPORT",
      address: "0x52090044B98bacBA07693B464E11Cbdf69313351",
      decimals: 18,
    },
    autoSelectForOutput: true,
    testingInstructions:
      "Select PPORT to sign the Robinhood WETH/PPORT v4 PoolKey. The route is fixed to LI.FI: it bridges your source token into Robinhood WETH before the destination v4 swap.",
  },
  "robinhood-ai-usdg-v4": {
    destinationChainId: 4663,
    pool: ROBINHOOD_AI_USDG_POOL,
    tokenIn: {
      symbol: "USDG",
      address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
      decimals: 6,
    },
    tokenOut: {
      symbol: "AI",
      address: "0x2E8c31162b855A2ffa90F6F8634643Ad6F111e18",
      decimals: 18,
    },
    autoSelectForOutput: true,
    testingInstructions:
      "Select AI to sign the live Robinhood AI/USDG FablesRamp v4 PoolKey. LI.FI bridges the source token into Robinhood USDG, then the destination swap spends USDG for AI. The route was read-only quoted successfully from Base USDC before being added here.",
  },
  "robinhood-eth-toro-v4": {
    destinationChainId: 4663,
    pool: ROBINHOOD_ETH_TORO_POOL,
    tokenIn: {
      symbol: "ETH",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
    },
    tokenOut: {
      symbol: "TORO",
      address: "0x95B551C94A2457B597e4838457eFFB4731880411",
      decimals: 18,
    },
    autoSelectForOutput: true,
    testingInstructions:
      "Select TORO to sign the Robinhood mainnet ETH/TORO Tesoro-hook PoolKey. LI.FI bridges your source asset into native ETH on Robinhood; after bridge settlement, the destination v4 swap spends only the confirmed ETH received. Keep separate ETH on Robinhood for gas.",
  },
  "tesoro-staging-eth-toro-v4": {
    destinationChainId: 466300,
    pool: TESORO_STAGING_ETH_TORO_POOL,
    tokenIn: {
      symbol: "ETH",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
    },
    tokenOut: {
      symbol: "TORO",
      address: "0x95B551C94A2457B597e4838457eFFB4731880411",
      decimals: 18,
    },
    testingInstructions:
      "Direct Tesoro Staging test only. Connect a wallet on chain 466300 with test ETH for both the swap and gas. No LI.FI bridge is available to staging.",
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
    dexPools?: string;
  };
};

function sameAddress(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

export function getDexRouteTestConfig(route: DexRouteId): FixedV4Route | null {
  return route === "automatic-v3" ? null : FIXED_V4_ROUTES[route];
}

/** Destination tokens that select a deliberately configured v4 route. */
export function getFixedV4DestinationTokens(chainId: number): TokenInfo[] {
  return Object.values(FIXED_V4_ROUTES)
    .filter(
      (route) =>
        route.destinationChainId === chainId && route.autoSelectForOutput,
    )
    .map((route) => route.tokenOut);
}

/** Returns the configured route selected by an exact destination token choice. */
export function getDexRouteForOutputToken(
  destinationChainId: number,
  tokenAddress: string,
): DexRouteId | null {
  const match = Object.entries(FIXED_V4_ROUTES).find(
    ([, route]) =>
      route.autoSelectForOutput &&
      route.destinationChainId === destinationChainId &&
      sameAddress(route.tokenOut.address, tokenAddress),
  );
  return (match?.[0] as FixedV4RouteId | undefined) ?? null;
}

export function buildDexRouteExtraData(params: {
  route: DexRouteId;
  destinationChainId: number | undefined;
  tokenIn: string;
  tokenOut: string;
}): DexRouteExtraData {
  const route = getDexRouteTestConfig(params.route);
  if (!route) {
    return DEFAULT_EXTRA_DATA;
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
      DEX_POOLS_EXTRA_TYPESTRING,
    ]
      .filter((entry): entry is string => Boolean(entry))
      .join(","),
    extraData: {
      ...DEFAULT_EXTRA_DATA.extraData,
      dexPools: encodeDexPools([route.pool]),
    },
  };
}
