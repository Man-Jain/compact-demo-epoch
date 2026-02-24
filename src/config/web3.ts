import { mainnetGraph, testnetGraph } from "@epoch-protocol/epoch-intents-sdk";

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
    const address =
      token.contractAddress[chainName] ?? token.contractAddress["*"];
    if (address) {
      result.push({
        symbol,
        address,
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
  options?: { excludeCurrentChain?: boolean }
): ChainInfo[] {
  const graph = getGraphForChain(chainId);
  const result: ChainInfo[] = [];
  for (const [name, chain] of Object.entries(graph.chains)) {
    if (options?.excludeCurrentChain && chain.chainId === chainId) continue;
    result.push({
      name,
      chainId: chain.chainId,
      explorer: chain.explorer,
    });
  }
  return result;
}

export { mainnetGraph, testnetGraph };
