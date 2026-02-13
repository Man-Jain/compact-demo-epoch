import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useResourceLocks } from './useResourceLocks';
import { formatUnits } from 'viem';
import { getApiUrl } from '../config/api';

export interface Token {
  tokenAddress: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface ResourceLock {
  resetPeriod: number;
  isMultichain: boolean;
}

export interface Balance {
  chainId: string;
  lockId: string;
  allocatableBalance: string;
  allocatedBalance: string;
  balanceAvailableToAllocate: string;
  withdrawalStatus: number;
  withdrawableAt: string;
  token?: Token;
  resourceLock?: ResourceLock;
  formattedAllocatableBalance?: string;
  formattedAllocatedBalance?: string;
  formattedAvailableBalance?: string;
}

interface UseBalancesResult {
  balances: Balance[];
  error: string | null;
  isLoading: boolean;
}

export function useBalances(): UseBalancesResult {
  const { address, isConnected } = useAccount();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);

  // Get resource lock details from indexer
  const {
    data: resourceLocksData,
    error: resourceLocksError,
    isLoading: resourceLocksLoading,
  } = useResourceLocks();

  const fetchBalances = useCallback(async (): Promise<void> => {
    if (!isConnected || !address || isFetchingRef.current) return;

    isFetchingRef.current = true;

    // Endpoint not implemented - return empty data immediately
    setBalances([]);
    setError(null);
    setIsLoading(false);
    isFetchingRef.current = false;
    return;

    // Disabled API call - endpoint is not implemented
    // try {
    //   const response = await fetch(getApiUrl(`/balances?address=${address}`), {});
    //   if (response.status === 404) {
    //     setBalances([]);
    //     setError(null);
    //     return;
    //   }
    //   if (!response.ok) throw new Error('Failed to fetch balances.');

      //   const data = await response.json();
      //   // ... rest of processing code ...
      //   setError(null);
      // } catch (err) {
      //   if (err instanceof Error && !err.message.includes('404')) {
      //     setError(err.message);
      //   } else {
      //     setBalances([]);
      //     setError(null);
      //   }
      // } finally {
      //   setIsLoading(false);
      //   isFetchingRef.current = false;
      // }
  }, [isConnected, address, resourceLocksData]);

  useEffect(() => {
    // Initial fetch only - polling disabled since /balances endpoint is not implemented
    if (isConnected && address) {
      void fetchBalances();
    } else {
      // Reset state when disconnected
      setBalances([]);
      setError(null);
      setIsLoading(false);
    }

    // Polling disabled - endpoints are not implemented in backend
    // Uncomment below if endpoints are re-enabled:
    // const intervalId = setInterval(() => void fetchBalances(), 30000);

    // Cleanup on unmount or address change
    return () => {
      // clearInterval(intervalId);
      isFetchingRef.current = false;
    };
  }, [fetchBalances, isConnected, address]);

  // Set error from resource locks if present
  useEffect(() => {
    if (resourceLocksError) {
      setError(
        resourceLocksError instanceof Error
          ? resourceLocksError.message
          : 'Failed to fetch resource locks'
      );
    }
  }, [resourceLocksError]);

  // Only show loading state during initial load
  const showLoading = useMemo(
    () => isLoading && resourceLocksLoading,
    [isLoading, resourceLocksLoading]
  );

  return useMemo(
    () => ({
      balances,
      error,
      isLoading: showLoading,
    }),
    [balances, error, showLoading]
  );
}
