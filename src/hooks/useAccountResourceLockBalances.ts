import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';

export interface ResourceLockBalance {
  balance: string;
  withdrawalStatus: number;
  withdrawableAt: string;
  lastUpdatedAt: string;
  resourceLock: {
    lockId: string;
    tokenAddress: string;
    allocatorAddress: string;
    resetPeriod: string;
    isMultichain: boolean;
    mintedAt: string;
    totalSupply: string;
    name: string;
    symbol: string;
    decimals: number;
    token: {
      name: string;
      symbol: string;
      decimals: number;
    };
    allocator: {
      allocatorAddress: string;
      registeredAt: string;
    };
  };
}

export interface RegisteredCompactWithClaim {
  claimHash: string;
  timestamp: string;
  typehash: string;
  blockNumber: string;
  claim: {
    claimHash: string;
    allocator: {
      address: string;
    };
    arbiter: string;
    nonce: string;
    timestamp: string;
    blockNumber: string;
    allocatorChainId: {
      chainId: string;
    };
  } | null;
}

export interface AccountData {
  address: string;
  registeredCompacts: {
    items: RegisteredCompactWithClaim[];
    totalCount: number;
  };
  resourceLocks: {
    items: ResourceLockBalance[];
    totalCount: number;
  };
}

export interface UseAccountResourceLockBalancesResult {
  accountData: AccountData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAccountResourceLockBalances(): UseAccountResourceLockBalancesResult {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isFetchingRef = useRef(false);

  const fetchAccountResourceLockBalances =
    useCallback(async (): Promise<void> => {
      if (!isConnected || !address || isFetchingRef.current) return;

      isFetchingRef.current = true;

      // Endpoint not implemented - return empty data immediately
      setIsLoading(false);
      setAccountData({
        address: address,
        registeredCompacts: {
          items: [],
          totalCount: 0,
        },
        resourceLocks: {
          items: [],
          totalCount: 0,
        },
      });
      setError(null);
      isFetchingRef.current = false;
      return;

      // Disabled API call - endpoint is not implemented
      // try {
      //   const url = `/account-resource-lock-balances${chainId ? `?chainId=${chainId}` : ''}&address=${address}`;
      //   const response = await fetch(getApiUrl(url));
      //   if (!response.ok)
      //     throw new Error('Failed to fetch account resource lock balances.');
      //   const result = await response.json();
      //   if (result.error) {
      //     throw new Error(result.error);
      //   }
      //   setAccountData(result.accountData);
      //   setError(null);
      // } catch (err) {
      //   setError(
      //     err instanceof Error
      //       ? err
      //       : new Error('Failed to fetch account resource lock balances')
      //   );
      // } finally {
      //   setIsLoading(false);
      //   isFetchingRef.current = false;
      // }
    }, [isConnected, address, chainId]);

  const refetch = useCallback(() => {
    if (isConnected && address) {
      setIsLoading(true);
      void fetchAccountResourceLockBalances();
    }
  }, [fetchAccountResourceLockBalances, isConnected, address]);

  useEffect(() => {
    // Initial fetch only - endpoint not implemented, so just set empty data
    if (isConnected && address) {
      void fetchAccountResourceLockBalances();
    } else {
      // Reset state when disconnected
      setAccountData(null);
      setError(null);
      setIsLoading(false);
    }

    // Polling disabled - endpoint is not implemented

    // Cleanup on unmount or address change
    return () => {
      isFetchingRef.current = false;
    };
  }, [fetchAccountResourceLockBalances, isConnected, address]);

  return useMemo(
    () => ({
      accountData,
      isLoading,
      error,
      refetch,
    }),
    [accountData, isLoading, error, refetch]
  );
}
