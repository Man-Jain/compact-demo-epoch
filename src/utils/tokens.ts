import { getAddress, isAddress } from "viem";
import type { TokenInfo } from "../config/web3";

export function normalizeTokenAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function isEvmTokenAddress(value: string): boolean {
  return isAddress(value);
}

export function toChecksumAddress(value: string): `0x${string}` | undefined {
  if (!isAddress(value)) return undefined;
  return getAddress(value);
}

export function findGraphTokenByAddress(
  tokens: TokenInfo[],
  address: string,
): TokenInfo | undefined {
  if (!address) return undefined;
  const normalized = normalizeTokenAddress(address);
  return tokens.find((t) => normalizeTokenAddress(t.address) === normalized);
}

export function getTokenLabel(
  address: string,
  symbol?: string,
  fallbackSymbol?: string,
): string {
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const resolvedSymbol = symbol ?? fallbackSymbol;
  return resolvedSymbol ? `${resolvedSymbol} (${short})` : short;
}
