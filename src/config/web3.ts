import { mainnetGraph, testnetGraph } from "@epoch-protocol/epoch-intents-sdk";
import { getAddress, isAddress } from "viem";
import { chains as wagmiChains, SUPPORTED_CHAIN_IDS } from "./wagmi";

// Graph shape from epoch-commons-sdk: tokens keyed by symbol, chains keyed by chain name
type GraphChain = { chainId: number; explorer: string };
type GraphTokens = Record<
  string,
  { contractAddress: Record<string, string>; decimals: number }
>;
type EpochGraph = {
  chains: Record<string, GraphChain>;
  tokens: GraphTokens;
};

const MAINNET_CHAIN_IDS = new Set([
  8453, // Base
  10, // Optimism
  137, // Polygon
  42161, // Arbitrum
]);

function getGraphForChain(chainId: number): EpochGraph {
  return MAINNET_CHAIN_IDS.has(chainId)
    ? (mainnetGraph as EpochGraph)
    : (testnetGraph as EpochGraph);
}

function getChainNameByChainId(
  graph: EpochGraph,
  chainId: number,
): string | null {
  for (const [name, chain] of Object.entries(graph.chains)) {
    if (chain.chainId === chainId) return name;
  }
  return null;
}

export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}

function normalizeGraphAddress(address: string): string {
  if (isAddress(address)) {
    return getAddress(address);
  }
  return address;
}

/**
 * Get list of tokens for a chain from the appropriate graph (mainnet or testnet).
 * Returns tokens that have a contract address for the given chain.
 */
export function getTokensForChain(chainId: number): TokenInfo[] {
  const graph = getGraphForChain(chainId);
  const chainName = getChainNameByChainId(graph, chainId);
  if (!chainName) return [];

  const result: TokenInfo[] = [];
  for (const [symbol, token] of Object.entries(graph.tokens)) {
    const rawAddress =
      token.contractAddress[chainName] ?? token.contractAddress["*"];
    if (rawAddress) {
      result.push({
        symbol,
        address: normalizeGraphAddress(rawAddress),
        decimals: token.decimals,
      });
    }
  }
  return result;
}

export interface ChainInfo {
  name: string;
  chainId: number;
  explorer: string;
}

/**
 * Get list of chains from the appropriate graph (mainnet or testnet).
 * Optionally exclude the current chain so it can be used for destination dropdown.
 */
export function getChainsFromGraph(
  chainId: number,
  options?: { excludeCurrentChain?: boolean },
): ChainInfo[] {
  const onTestnet = isTestnetChain(chainId);
  const graph = getGraphForChain(chainId);
  const result: ChainInfo[] = [];
  const includedChainIds = new Set<number>();

  for (const [name, chain] of Object.entries(graph.chains)) {
    if (!SUPPORTED_CHAIN_IDS.has(chain.chainId)) continue;
    if (isTestnetChain(chain.chainId) !== onTestnet) continue;
    if (options?.excludeCurrentChain && chain.chainId === chainId) continue;
    includedChainIds.add(chain.chainId);
    result.push({
      name,
      chainId: chain.chainId,
      explorer: chain.explorer,
    });
  }

  for (const chain of wagmiChains) {
    if (!SUPPORTED_CHAIN_IDS.has(chain.id)) continue;
    if ((chain.testnet ?? false) !== onTestnet) continue;
    if (options?.excludeCurrentChain && chain.id === chainId) continue;
    if (includedChainIds.has(chain.id)) continue;

    result.push({
      name: chain.name,
      chainId: chain.id,
      explorer: chain.blockExplorers?.default?.url ?? "",
    });
  }

  return result;
}

export { mainnetGraph, testnetGraph };

/**
 * Check if a chain is a testnet (not in the mainnet chain IDs list).
 */
export function isTestnetChain(chainId: number): boolean {
  return !MAINNET_CHAIN_IDS.has(chainId);
}
