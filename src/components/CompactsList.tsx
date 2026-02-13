import React from 'react';
import { useCompacts, CompactRecord } from '../hooks/useCompacts';
import { useExecuteClaim } from '../hooks/useExecuteClaim';
import {
  formatAddress,
  formatAmount,
  formatTimestamp,
} from '../utils/formatting';
import { useAccount } from 'wagmi';

const CompactsList: React.FC = () => {
  const { address } = useAccount();
  const { compacts, isLoading, error, refetch } = useCompacts(address ?? '');

  if (isLoading) {
    return (
      <div className="p-6 bg-[#0a0a0a] rounded-lg shadow-xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Your Compacts</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff00]"></div>
          <span className="ml-3 text-gray-400">Loading compacts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#0a0a0a] rounded-lg shadow-xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Your Compacts</h2>
        <div className="text-center py-12">
          <div className="text-red-400 mb-2 text-lg">⚠️ Error loading compacts</div>
          <div className="text-gray-400 text-sm mb-6">{error}</div>
          <button
            onClick={refetch}
            className="px-6 py-2 bg-[#00ff00] text-black rounded-lg hover:bg-[#00cc00] transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (compacts.length === 0) {
    return (
      <div className="p-6 bg-[#0a0a0a] rounded-lg shadow-xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Your Compacts</h2>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2 text-lg">📄 No compacts found</div>
          <div className="text-gray-500 text-sm">
            Create your first compact using the allocation form above
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0a0a0a] rounded-lg shadow-xl border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Your Compacts</h2>
        <button
          onClick={refetch}
          className="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {compacts.map((compact) => (
          <CompactCard
            key={`${compact.chainId}-${compact.hash}`}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

interface CompactCardProps {
  compact: CompactRecord;
}

const CompactCard: React.FC<CompactCardProps> = ({ compact }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isClaiming, setIsClaiming] = React.useState(false);
  const [claimError, setClaimError] = React.useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = React.useState(false);
  const { executeClaim } = useExecuteClaim();

  const isExpired =
    new Date(parseInt(compact.compact.expires) * 1000) < new Date();

  const handleClaim = async () => {
    setIsClaiming(true);
    setClaimError(null);
    setClaimSuccess(false);

    try {
      // The signature is stored as an EIP2098 compact signature (64 bytes)
      // We need to convert it to the r, s, v format expected by the backend

      const result = await executeClaim(compact.hash, compact.chainId);
      console.log('result: ', result);

      if (result.success) {
        setClaimSuccess(true);
        // Optionally refresh the compacts list or show success message
      } else {
        setClaimError(result.error || 'Failed to execute claim');
      }
    } catch (error) {
      setClaimError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-5 hover:border-gray-600 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-mono text-gray-300 font-semibold">
              Chain {compact.chainId}
            </span>
            <span
              className={`px-3 py-1 rounded-md text-xs font-semibold ${
                isExpired
                  ? 'bg-red-900/30 text-red-300 border border-red-700/50'
                  : 'bg-green-900/30 text-green-300 border border-green-700/50'
              }`}
            >
              {isExpired ? 'Expired' : 'Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 text-xs">Amount:</span>
              <div className="font-mono text-white font-medium mt-1">
                {formatAmount(compact.compact.amount)}
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Expires:</span>
              <div className="text-white mt-1">
                {formatTimestamp(compact.compact.expires)}
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Arbiter:</span>
              <div className="font-mono text-white mt-1 break-all">
                {formatAddress(compact.compact.arbiter)}
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Sponsor:</span>
              <div className="font-mono text-white mt-1 break-all">
                {formatAddress(compact.compact.sponsor)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:ml-4">
          <button
            onClick={handleClaim}
            disabled={isClaiming || isExpired || claimSuccess}
            className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${
              isClaiming
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : isExpired
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : claimSuccess
                    ? 'bg-green-600 text-white cursor-not-allowed'
                    : 'bg-[#00ff00] text-black hover:bg-[#00dd00]'
            }`}
          >
            {isClaiming ? 'Claiming...' : claimSuccess ? 'Claimed' : 'Claim'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            {isExpanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {claimError && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-sm">
          Error: {claimError}
        </div>
      )}

      {claimSuccess && (
        <div className="mt-2 p-2 bg-green-900/20 border border-green-500/30 rounded text-green-300 text-sm">
          ✅ Claim executed successfully!
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Hash:</span>
              <div className="mt-1 font-mono text-xs text-gray-300 break-all">
                {compact.hash}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Nonce:</span>
              <div className="mt-1 font-mono text-xs text-gray-300 break-all">
                {compact.compact.nonce}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Lock ID:</span>
              <div className="mt-1 font-mono text-xs text-gray-300 break-all">
                {compact.compact.id}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <div className="mt-1 text-xs text-gray-300">
                {formatTimestamp(compact.createdAt)}
              </div>
            </div>

            {compact.witnessData && (
              <>
                {compact.witnessData.tokenIn && (
                  <div>
                    <span className="text-gray-500">Token In:</span>
                    <div className="mt-1 font-mono text-xs text-gray-300 break-all">
                      {formatAddress(compact.witnessData.tokenIn)}
                    </div>
                  </div>
                )}
                {compact.witnessData.tokenInAmount && (
                  <div>
                    <span className="text-gray-500">Token In Amount:</span>
                    <div className="mt-1 font-mono text-xs text-gray-300">
                      {formatAmount(compact.witnessData.tokenInAmount)}
                    </div>
                  </div>
                )}
                {compact.witnessData.tokenOut && (
                  <div>
                    <span className="text-gray-500">Token Out:</span>
                    <div className="mt-1 font-mono text-xs text-gray-300 break-all">
                      {formatAddress(compact.witnessData.tokenOut)}
                    </div>
                  </div>
                )}
                {compact.witnessData.minTokenOut && (
                  <div>
                    <span className="text-gray-500">Min Token Out:</span>
                    <div className="mt-1 font-mono text-xs text-gray-300">
                      {formatAmount(compact.witnessData.minTokenOut)}
                    </div>
                  </div>
                )}
                {compact.witnessData.destinationChainId && (
                  <div>
                    <span className="text-gray-500">Destination Chain ID:</span>
                    <div className="mt-1 font-mono text-xs text-gray-300">
                      {compact.witnessData.destinationChainId}
                    </div>
                  </div>
                )}
                {compact.witnessData.protocolHashIdentifier && (
                  <div>
                    <span className="text-gray-500">
                      Protocol Hash Identifier:
                    </span>
                    <div className="mt-1 font-mono text-xs text-gray-300 break-all">
                      {compact.witnessData.protocolHashIdentifier}
                    </div>
                  </div>
                )}
                {compact.witnessData.recipient && (
                  <div>
                    <span className="text-gray-500">Recipient:</span>
                    <div className="mt-1 font-mono text-xs text-gray-300 break-all">
                      {compact.witnessData.recipient}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactsList;
