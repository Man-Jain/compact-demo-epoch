import { useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import { getApiUrl } from '../config/api';

export interface ClaimExecution {
  success: boolean;
  data?: any;
  error?: string;
  transactionHash?: string;
}

export function useExecuteClaim() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const executeClaim = async (
    claimHash: string,
    chainId: string
  ): Promise<ClaimExecution> => {
    setIsLoading(true);
    setError(null);

    const tempTxId = `pending-${Date.now()}`;
    showNotification({
      type: 'info',
      title: 'Executing Claim',
      message: 'Please wait while we execute your claim...',
      stage: 'initiated',
      txHash: tempTxId,
      chainId,
      autoHide: false,
    });

    try {
      const response = await fetch(getApiUrl('/execute-claim'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimHash,
          chainId,
          executionHash:
            '0xe21ddb611bef3c4e0bc8ac1d85202a4739ff55f1382a231a228a451658567f4a',
          claimant: '0xe1afC1092c40d32F72Ad065C93f6D27843458B95',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      const claimExecution = result.data;

      if (claimExecution.success && claimExecution.transactionHash) {
        showNotification({
          type: 'success',
          title: 'Claim Executed',
          message: 'Your claim has been successfully executed',
          stage: 'confirmed',
          txHash: claimExecution.transactionHash,
          chainId,
          autoHide: false,
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Claim Execution Failed',
          message: claimExecution.error || 'Failed to execute claim',
          txHash: tempTxId,
          chainId,
          autoHide: true,
        });
      }

      return claimExecution;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to execute claim';
      setError(errorMessage);

      showNotification({
        type: 'error',
        title: 'Claim Execution Error',
        message: errorMessage,
        txHash: tempTxId,
        chainId,
        autoHide: true,
      });

      console.error('Error executing claim:', err);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    executeClaim,
    isLoading,
    error,
  };
}
