import { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

export interface CompactData {
  arbiter: string;
  sponsor: string;
  nonce: string;
  expires: string;
  id: string;
  amount: string;
  token: string;
  lockTag: string;
}

export interface CompactRecord {
  chainId: string;
  hash: string;
  compact: CompactData;
  signature: string;
  createdAt: string;
  witnessData?: {
    tokenIn?: string;
    tokenInAmount?: string;
    tokenOut?: string;
    minTokenOut?: string;
    destinationChainId?: string;
    taskType?: string;
    protocolHashIdentifier?: string;
    recipient?: string;
  };
}

export function useCompacts(address: string | null) {
  const [compacts, setCompacts] = useState<CompactRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompacts = async () => {
    if (!address) {
      setCompacts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(`/compacts?address=${address}`), {
        method: 'GET',
        // headers: {
        //   'Content-Type': 'application/json',
        //   'x-session-id': sessionToken,
        // },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No compacts found is not an error
          setCompacts([]);
          return;
        }
        throw new Error(`Failed to fetch compacts: ${response.statusText}`);
      }

      const data: CompactRecord[] = await response.json();
      setCompacts(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch compacts';
      setError(errorMessage);
      console.error('Error fetching compacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompacts();

    // // Set up polling every 5 seconds
    // const interval = setInterval(() => {
    //   if (sessionToken) {
    //     fetchCompacts();
    //   }
    // }, 10000);

    // return () => clearInterval(interval);
  }, [address]);

  return {
    compacts,
    isLoading,
    error,
    refetch: fetchCompacts,
  };
}
