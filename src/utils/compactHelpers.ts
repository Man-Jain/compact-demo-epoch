import { type Address } from 'viem';

export type CompactData = {
  arbiter: Address;
  sponsor: Address;
  nonce: bigint;
  expires: bigint;
  id: bigint; // tokenId
  lockTag: bigint;
  token: Address | bigint; // 0 for native, address for ERC20
  amount: bigint;
  mandate?: Record<string, bigint | Address>;
};
