import { Address, Hex } from 'viem';
import { chains } from '../config/wagmi';

/**
 * Get the name of a chain by its ID
 * @param chainId The chain ID as a string or number
 * @returns The chain name from wagmi config, or a fallback if not found
 */
export function getChainName(chainId: string | number): string {
  // Convert chainId to number if it's a string
  const id = typeof chainId === 'string' ? parseInt(chainId) : chainId;

  // Find the chain in wagmi config
  const chain = chains.find((chain) => chain.id === id);

  // Return the chain name if found, otherwise return a generic name
  return chain?.name || `Chain ${chainId}`;
}

/**
 * Get a formatted block explorer transaction URL
 * @param chainId The chain ID as a string or number
 * @param txHash The transaction hash
 * @returns The formatted block explorer URL if available, otherwise null
 */
export function getBlockExplorerTxUrl(
  chainId: string | number,
  txHash: string
): string | null {
  // Convert chainId to number if it's a string
  const id = typeof chainId === 'string' ? parseInt(chainId) : chainId;

  // Find the chain in wagmi config
  const chain = chains.find((chain) => chain.id === id);

  // If chain has a block explorer URL, format the transaction URL
  if (chain?.blockExplorers?.default?.url) {
    return `${chain.blockExplorers.default.url}/tx/${txHash}`;
  }

  return null;
}

/**
 * Helper function to create a lock tag with the given parameters
 * Equivalent to Solidity _createLockTag function
 */
export function createLockTag(
  resetPeriod: bigint, // 0 = OneSecond, 1 = FifteenSeconds, 2 = OneMinute, 3 = TenMinutes, 4 = OneHourAndFiveMinutes, 5 = OneDay, 6 = SevenDaysAndOneHour, 7 = ThirtyDays
  scope: bigint, // 0 = Multichain, 1 = ChainSpecific
  allocatorId: bigint
): bigint {
  return (scope << 95n) | (resetPeriod << 92n) | allocatorId;
}

export function getTokenId(lockTag: bigint, tokenAddress: bigint) {
  return (lockTag << 160n) | tokenAddress;
}

export function getAllocatorId(allocator: Address | bigint) {
  // Calculate compact flag
  // First, count leading zero nibbles in the address
  let leadingZeros = 0;
  let mask = 0xf000000000000000000000000000000000000000n;

  for (let i = 0; i < 40; i++) {
    if ((BigInt(allocator) & mask) !== 0n) {
      break;
    }
    leadingZeros++;
    mask = mask >> 4n;
  }

  // Calculate the compact flag for the address:
  // - 0-3 leading zero nibbles: 0
  // - 4-17 leading zero nibbles: number of leading zeros minus 3
  // - 18+ leading zero nibbles: 15
  let compactFlag = 0n;
  if (leadingZeros >= 18) {
    compactFlag = 15n;
  } else if (leadingZeros >= 4) {
    compactFlag = BigInt(leadingZeros - 3);
  }

  // Extract the last 88 bits of the address
  const last88Bits = BigInt(allocator) & 0xffffffffffffffffffffffn;

  // Combine the compact flag (4 bits) with the last 88 bits
  return (compactFlag << 88n) | last88Bits;
}

export type CompactData = {
  arbiter: Address;
  sponsor: Address;
  nonce: bigint;
  expires: bigint;
  id: bigint;
  lockTag: bigint;
  token: Address | bigint;
  amount: bigint;
  mandate?: {
    tokenOut: Address;
    minTokenOut: bigint;
    chainId: number;
  };
};

export async function getSignedCompact(
  client: any,
  theCompact: Address,
  message: CompactData,
  chainId: number
) {
  // Convert lockTag bigint to bytes12 hex string and token bigint to address
  const messageWithFormattedData = {
    ...message,
    lockTag: `0x${message.lockTag.toString(16).padStart(24, '0')}` as Hex,
    token:
      typeof message.token === 'bigint'
        ? (`0x${message.token.toString(16).padStart(40, '0')}` as Address)
        : message.token,
  };
  console.log('messageWithFormattedData: ', messageWithFormattedData);

  return client.signTypedData({
    domain: {
      name: 'The Compact',
      version: '1',
      chainId: chainId,
      verifyingContract: theCompact,
    },
    types: getTypes(message),
    primaryType: 'Compact',
    message: messageWithFormattedData,
  });
}

function getTypes(message: CompactData) {
  return {
    Compact: [
      { name: 'arbiter', type: 'address' },
      { name: 'sponsor', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'expires', type: 'uint256' },
      { name: 'lockTag', type: 'bytes12' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      ...(message.mandate ? [{ name: 'mandate', type: 'Mandate' }] : []),
    ],
    ...(message.mandate
      ? {
          Mandate: [
            { name: 'tokenOut', type: 'address' },
            { name: 'minTokenOut', type: 'uint256' },
            { name: 'chainId', type: 'uint256' },
          ],
        }
      : {}),
  };
}
