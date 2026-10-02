import {
  DEX_POOLS_EXTRA_TYPESTRING,
  encodeDexPools,
  type UniswapV4PoolPreference,
} from "@epoch-protocol/epoch-commons-sdk";
import type { TokenInfo } from "./web3";

export type DexRouteId = "automatic-v3" | "base-sepolia-hooked-v4";

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

const DEFAULT_EXTRA_DATA = {
  extraDataTypestring: "uint256 somethingKey",
  extraData: { somethingKey: "123" },
};

function sameAddress(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

export function buildDexRouteExtraData(params: {
  route: DexRouteId;
  destinationChainId: number | undefined;
  tokenIn: string;
  tokenOut: string;
}) {
  if (params.route === "automatic-v3") return DEFAULT_EXTRA_DATA;

  const key = BASE_SEPOLIA_HOOKED_POOL.poolKey;
  const pairMatches =
    (sameAddress(params.tokenIn, key.currency0) &&
      sameAddress(params.tokenOut, key.currency1)) ||
    (sameAddress(params.tokenIn, key.currency1) &&
      sameAddress(params.tokenOut, key.currency0));
  if (
    params.destinationChainId !== BASE_SEPOLIA_HOOKED_POOL.chainId ||
    !pairMatches
  ) {
    throw new Error(
      "The hooked v4 route requires Base Sepolia as the destination and its deployed USDC/USDT pair.",
    );
  }

  return {
    extraDataTypestring: `${DEFAULT_EXTRA_DATA.extraDataTypestring},${DEX_POOLS_EXTRA_TYPESTRING}`,
    extraData: {
      ...DEFAULT_EXTRA_DATA.extraData,
      dexPools: encodeDexPools([BASE_SEPOLIA_HOOKED_POOL]),
    },
  };
}
