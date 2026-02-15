import { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

export interface IntentTransactionStatus {
  status: string;
  transactionHash: string;
  chainId: number;
}

interface UseIntentStatusResult {
  statuses: IntentTransactionStatus[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useIntentStatus(
  address: string | undefined,
  nonce: string | undefined,
  enabled: boolean = true,
  autoRefresh: boolean = false,
  refreshInterval: number = 5000 // 5 seconds default
): UseIntentStatusResult {
  const [statuses, setStatuses] = useState<IntentTransactionStatus[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIntentStatus = async () => {
    if (!address || !nonce || !enabled) {
      setStatuses(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        getApiUrl(`/intentStatus/${address}/${nonce}`),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No status found yet - this is normal for new intents
          setStatuses([]);
          return;
        }
        throw new Error(`Failed to fetch intent status: ${response.statusText}`);
      }

      const data: IntentTransactionStatus[] = await response.json();
      setStatuses(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch intent status';
      setError(errorMessage);
      console.error('Error fetching intent status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntentStatus();

    // Set up auto-refresh if enabled
    if (autoRefresh && enabled) {
      const interval = setInterval(() => {
        fetchIntentStatus();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [address, nonce, enabled, autoRefresh, refreshInterval]);

  return {
    statuses,
    isLoading,
    error,
    refetch: fetchIntentStatus,
  };
}
