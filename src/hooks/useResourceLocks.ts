import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { getApiUrl } from '../config/api';

export interface Token {
  tokenAddress: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface ResourceLock {
  lockId: string;
  allocatorAddress: string;
  tokenAddress: string;
  resetPeriod: string;
  isMultichain: boolean;
  mintedAt: string;
  totalSupply: string;
  name: string;
  symbol: string;
  decimals: number;
  token: Token;
  allocator: {
    allocatorAddress: string;
    registeredAt: string;
  };
}

export interface ResourceLockBalance {
  chainId: string;
  balance: string;
  withdrawalStatus: number;
  withdrawableAt: string;
  resourceLock: ResourceLock;
}

interface UseResourceLocksResult {
  data: {
    resourceLocks: {
      items: ResourceLockBalance[];
    };
  };
  isLoading: boolean;
  error: Error | null;
}

export function useResourceLocks(): UseResourceLocksResult {
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<{
    resourceLocks: {
      items: ResourceLockBalance[];
    };
  }>({ resourceLocks: { items: [] } });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isFetchingRef = useRef(false);

  const fetchResourceLocks = useCallback(async (): Promise<void> => {
    if (!isConnected || !address || isFetchingRef.current) return;

    isFetchingRef.current = true;

    // Endpoint not implemented - return empty data immediately
    setData({ resourceLocks: { items: [] } });
    setError(null);
    setIsLoading(false);
    isFetchingRef.current = false;
    return;

    // Disabled API call - endpoint is not implemented
    // try {
    //   const response = await fetch(getApiUrl(`/resource-locks?address=${address}`), {});
    //   if (response.status === 404) {
    //     setData({ resourceLocks: { items: [] } });
    //     setError(null);
    //     return;
    //   }
    //   if (!response.ok) throw new Error('Failed to fetch resource locks.');
    //   const result = await response.json();
    //   if (result.error) {
    //     throw new Error(result.error);
    //   }
    //   const transformedData = {
    //     resourceLocks: {
    //       items: result.resourceLocks || [],
    //     },
    //   };
    //   setData(transformedData);
    //   setError(null);
    // } catch (err) {
    //   if (err instanceof Error && !err.message.includes('404')) {
    //     setError(
    //       err instanceof Error ? err : new Error('Failed to fetch resource locks')
    //     );
    //   } else {
    //     setData({ resourceLocks: { items: [] } });
    //     setError(null);
    //   }
    // } finally {
    //   setIsLoading(false);
    //   isFetchingRef.current = false;
    // }
  }, [isConnected, address]);

  useEffect(() => {
    // Initial fetch only - polling disabled since /resource-locks endpoint is not implemented
    if (isConnected && address) {
      void fetchResourceLocks();
    } else {
      // Reset state when disconnected
      setData({ resourceLocks: { items: [] } });
      setError(null);
      setIsLoading(false);
    }

    // Polling disabled - endpoints are not implemented in backend
    // Uncomment below if endpoints are re-enabled:
    // const intervalId = setInterval(() => void fetchResourceLocks(), 30000);

    // Cleanup on unmount or address change
    return () => {
      // clearInterval(intervalId);
      isFetchingRef.current = false;
    };
  }, [fetchResourceLocks, isConnected, address]);

  return useMemo(
    () => ({
      data,
      isLoading,
      error,
    }),
    [data, isLoading, error]
  );
}
