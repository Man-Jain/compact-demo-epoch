import { COMPACT_ADDRESS } from '@epoch-protocol/epoch-commons-sdk';
import { sepolia } from 'viem/chains';

// Chain configurations
export const SUPPORTED_CHAINS = {
  [sepolia.id]: {
    name: 'Sepolia',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/',
    compactAddress: COMPACT_ADDRESS as `0x${string}`,
    blockExplorer: 'https://sepolia.etherscan.io',
  },
} as const;

export const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
] as const;

// Helper function to get chain configuration
export function getChainConfig(chainId: number) {
  return SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS];
}

// Helper function to check if chain is supported
export function isSupportedChain(chainId: number): boolean {
  return chainId in SUPPORTED_CHAINS;
}

// Type for deposit function arguments
export type NativeDepositArgs = readonly [`0x${string}`];
export type TokenDepositArgs = readonly [`0x${string}`, `0x${string}`, bigint];

// Type for transfer payload
export interface BasicTransfer {
  allocatorSignature: `0x${string}`;
  nonce: bigint;
  expires: bigint;
  id: bigint;
  amount: bigint;
  recipient: `0x${string}`;
}
