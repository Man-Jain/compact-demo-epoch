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

/**
 * Snapshot of the live Sodax ERC-20 registries for Base and Robinhood.
 * Native ETH stays in the demo's existing Native-asset flow rather than this
 * ERC-20 address list. Refresh this list from Sodax when their registry changes.
 */
const SODAX_SUGGESTED_TOKENS: Readonly<Record<number, readonly TokenInfo[]>> = {
  "4663": [
    {
      symbol: "bnUSD",
      address: "0x3cd95C469be0EDFD12Bd4F3a4436B132B7908DF4",
      decimals: 18,
    },
    {
      symbol: "SODA",
      address: "0xA256dd181C3f6E5eC68C6869f5D50a712d47212e",
      decimals: 18,
    },
    {
      symbol: "USDG",
      address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
      decimals: 6,
    },
    {
      symbol: "SPCX",
      address: "0x4a0E65A3EcceC6dBe60AE065F2e7bb85Fae35eEa",
      decimals: 18,
    },
    {
      symbol: "NVDA",
      address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
      decimals: 18,
    },
    {
      symbol: "GME",
      address: "0x1b0E319c6A659F002271B69dB8A7df2F911c153E",
      decimals: 18,
    },
    {
      symbol: "MSTR",
      address: "0xec262a75e413fAfD0dF80480274532C79D42da09",
      decimals: 18,
    },
    {
      symbol: "AAPL",
      address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
      decimals: 18,
    },
    {
      symbol: "TSLA",
      address: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d",
      decimals: 18,
    },
    {
      symbol: "MU",
      address: "0xfF080c8ce2E5feadaCa0Da81314Ae59D232d4afD",
      decimals: 18,
    },
    {
      symbol: "SNDK",
      address: "0xB90A19fF0Af67f7779afF50A882A9CfF42446400",
      decimals: 18,
    },
    {
      symbol: "SPY",
      address: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C",
      decimals: 18,
    },
    {
      symbol: "QQQ",
      address: "0xD5f3879160bc7c32ebb4dC785F8a4F505888de68",
      decimals: 18,
    },
    {
      symbol: "SGOV",
      address: "0x92FD66527192E3e61d4DDd13322Aa222DE86F9B5",
      decimals: 18,
    },
    {
      symbol: "USO",
      address: "0xa30FA36Db767ad9eD3f7a60fC79526fB4d56D344",
      decimals: 18,
    },
    {
      symbol: "SLV",
      address: "0x411eFb0E7f985935DAec3D4C3ebaEa0d0AD7D89f",
      decimals: 18,
    },
    {
      symbol: "GOOGL",
      address: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3",
      decimals: 18,
    },
    {
      symbol: "AMZN",
      address: "0x12f190a9F9d7D37a250758b26824B97CE941bF54",
      decimals: 18,
    },
    {
      symbol: "MSFT",
      address: "0xe93237C50D904957Cf27E7B1133b510C669c2e74",
      decimals: 18,
    },
    {
      symbol: "META",
      address: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35",
      decimals: 18,
    },
    {
      symbol: "CRCL",
      address: "0xdF0992E440dD0be65BD8439b609d6D4366bf1CB5",
      decimals: 18,
    },
    {
      symbol: "COIN",
      address: "0x6330D8C3178a418788dF01a47479c0ce7CCF450b",
      decimals: 18,
    },
    {
      symbol: "PLTR",
      address: "0x894E1EC2D74FFE5AEF8Dc8A9e84686acCB964F2A",
      decimals: 18,
    },
    {
      symbol: "TSM",
      address: "0x58FfE4a942d3885bAa22D7520691F611EF09e7AA",
      decimals: 18,
    },
    {
      symbol: "AMD",
      address: "0x86923f96303D656E4aa86D9d42D1e57ad2023fdC",
      decimals: 18,
    },
    {
      symbol: "INTC",
      address: "0xc72b96e0E48ecd4DC75E1e45396e26300BC39681",
      decimals: 18,
    },
    {
      symbol: "BABA",
      address: "0xad25Ac6C84D497db898fa1E8387bf6Af3532a1c4",
      decimals: 18,
    },
    {
      symbol: "PONS",
      address: "0x39dBED3a2bd333467115dE45665cC57F813C4571",
      decimals: 18,
    },
  ],
  "8453": [
    {
      symbol: "weETH",
      address: "0x04c0599ae5a44757c0af6f9ec3b93da8976c150a",
      decimals: 18,
    },
    {
      symbol: "USDC",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
    },
    {
      symbol: "sUSDS",
      address: "0x5875eEE11Cf8398102FdAd704C9E96607675467a",
      decimals: 18,
    },
    {
      symbol: "wstETH",
      address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452",
      decimals: 18,
    },
    {
      symbol: "cbBTC",
      address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      decimals: 8,
    },
    {
      symbol: "VIRTUAL",
      address: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b",
      decimals: 18,
    },
    {
      symbol: "cbETH",
      address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
      decimals: 18,
    },
    {
      symbol: "SODA",
      address: "0xdc5B4b00F98347E95b9F94911213DAB4C687e1e3",
      decimals: 18,
    },
    {
      symbol: "EURC",
      address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
      decimals: 6,
    },
    {
      symbol: "MORPHO",
      address: "0xBAa5CC21fd487B8Fcc2F632f3F4E8D37262a0842",
      decimals: 18,
    },
  ],
};

export function getSodaxSuggestedTokens(chainId: number): readonly TokenInfo[] {
  return SODAX_SUGGESTED_TOKENS[chainId] ?? [];
}

export function getSodaxDefaultToken(chainId: number): TokenInfo | undefined {
  const preferredSymbol: Readonly<Record<number, string>> = {
    8453: "USDC",
    4663: "USDG",
  };
  const tokens = getSodaxSuggestedTokens(chainId);
  return (
    tokens.find((token) => token.symbol === preferredSymbol[chainId]) ??
    tokens[0]
  );
}

/**
 * On configured demo chains, selecting Sodax must not expose arbitrary graph
 * assets: Sodax rejects unsupported assets before it can quote a route.
 */
export function getSodaxSelectableTokens(
  chainId: number,
  fallback: readonly TokenInfo[],
): TokenInfo[] {
  const verified = getSodaxSuggestedTokens(chainId);
  return verified.length > 0 ? [...verified] : [...fallback];
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
