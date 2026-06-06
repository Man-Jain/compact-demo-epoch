import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  getAddress,
  http,
  isAddress,
} from "viem";
import { getRpcUrlForChain } from "../config/rpc";
import { getTokensForChain } from "../config/web3";
import { findGraphTokenByAddress } from "./tokens";

export type TokenMetadataSource = "onchain" | "graph";

export type ResolvedTokenMetadata = {
  address: `0x${string}`;
  decimals: number;
  symbol?: string;
  balance?: string;
  source: TokenMetadataSource;
  resolutionError?: string;
};

type ResolveOptions = {
  walletAddress?: string;
  includeBalance?: boolean;
};

async function readErc20Decimals(
  chainId: number,
  tokenAddress: `0x${string}`,
): Promise<number> {
  const rpc = getRpcUrlForChain(chainId);
  if (!rpc) {
    throw new Error(`No RPC configured for chain ${chainId}`);
  }

  const client = createPublicClient({
    transport: http(rpc, { timeout: 15_000 }),
  });

  const decimals = await client.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "decimals",
  });

  return Number(decimals);
}

async function readErc20Symbol(
  chainId: number,
  tokenAddress: `0x${string}`,
): Promise<string | undefined> {
  const rpc = getRpcUrlForChain(chainId);
  if (!rpc) return undefined;

  const client = createPublicClient({
    transport: http(rpc, { timeout: 15_000 }),
  });

  try {
    return (await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "symbol",
    })) as string;
  } catch {
    return undefined;
  }
}

async function readErc20Balance(
  chainId: number,
  tokenAddress: `0x${string}`,
  walletAddress: string,
  decimals: number,
): Promise<string | undefined> {
  const rpc = getRpcUrlForChain(chainId);
  if (!rpc || !isAddress(walletAddress)) return undefined;

  const client = createPublicClient({
    transport: http(rpc, { timeout: 15_000 }),
  });

  try {
    const rawBalance = (await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [getAddress(walletAddress)],
    })) as bigint;
    return formatUnits(rawBalance, decimals);
  } catch {
    return undefined;
  }
}

export async function resolveTokenMetadata(
  chainId: number,
  address: string,
  options: ResolveOptions = {},
): Promise<ResolvedTokenMetadata | null> {
  if (!isAddress(address)) return null;

  const checksum = getAddress(address) as `0x${string}`;
  const graphToken = findGraphTokenByAddress(
    getTokensForChain(chainId),
    checksum,
  );
  const rpc = getRpcUrlForChain(chainId);

  if (!rpc) {
    if (!graphToken) {
      return {
        address: checksum,
        decimals: 0,
        source: "graph",
        resolutionError: `No RPC configured for chain ${chainId}`,
      };
    }
    return {
      address: checksum,
      decimals: graphToken.decimals,
      symbol: graphToken.symbol,
      source: "graph",
    };
  }

  try {
    const decimals = await readErc20Decimals(chainId, checksum);
    const symbol =
      (await readErc20Symbol(chainId, checksum)) ?? graphToken?.symbol;

    let balance: string | undefined;
    if (options.includeBalance && options.walletAddress) {
      balance = await readErc20Balance(
        chainId,
        checksum,
        options.walletAddress,
        decimals,
      );
    }

    return {
      address: checksum,
      decimals,
      symbol,
      balance,
      source: "onchain",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "decimals() contract call failed";

    return {
      address: checksum,
      decimals: 0,
      symbol: graphToken?.symbol,
      source: "onchain",
      resolutionError: message,
    };
  }
}
