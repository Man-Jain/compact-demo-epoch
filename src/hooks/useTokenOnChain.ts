import { useQuery } from "@tanstack/react-query";
import { isAddress } from "viem";
import { resolveTokenMetadata } from "../utils/resolveTokenMetadata";

type UseTokenOnChainOptions = {
  includeBalance?: boolean;
  walletAddress?: string;
};

export function useTokenOnChain(
  chainId: number | undefined,
  tokenAddress: string | undefined,
  options: UseTokenOnChainOptions = {},
) {
  const { includeBalance = false, walletAddress } = options;
  const hasValidAddress = Boolean(tokenAddress && isAddress(tokenAddress));
  const enabled = Boolean(chainId && hasValidAddress);

  const query = useQuery({
    queryKey: [
      "token-metadata",
      chainId,
      tokenAddress?.toLowerCase(),
      includeBalance,
      walletAddress?.toLowerCase(),
    ],
    queryFn: () =>
      resolveTokenMetadata(chainId!, tokenAddress!, {
        includeBalance,
        walletAddress,
      }),
    enabled,
    staleTime: 60_000,
    retry: 1,
  });

  const data = query.data;
  const hasDecimals =
    data != null &&
    data.resolutionError == null &&
    Number.isFinite(data.decimals);

  return {
    isValid: hasDecimals,
    decimals: hasDecimals ? data!.decimals : undefined,
    symbol: data?.symbol,
    balance: data?.balance,
    checksumAddress: data?.address,
    source: data?.source,
    resolutionError: data?.resolutionError,
    isLoading: query.isLoading || query.isFetching,
    error: query.error,
  };
}
