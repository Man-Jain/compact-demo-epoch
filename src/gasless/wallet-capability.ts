import { getAddress, type PublicClient, type WalletClient } from "viem";

/** EIP-7702 delegated-code prefix (implementation address after 0xef0100). */
const EIP7702_DELEGATION_PREFIX = "0xef0100";

/** MetaMask EIP7702StatelessDeleGator — canonical gasless delegate. */
const METAMASK_STATELESS_7702_IMPLEMENTATION: Record<number, `0x${string}`> = {
  11155111: "0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B",
  11155420: "0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B",
  84532: "0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B",
};

const EPOCH_LEGACY_7702_IMPLEMENTATION: Record<number, `0x${string}`> = {
  11155111: "0x7702CCC6b7bba39a3095537330692B363e4D6e8f",
  11155420: "0x7702CCC6b7bba39a3095537330692B363e4D6e8f",
  84532: "0x7702CCC6b7bba39a3095537330692B363e4D6e8f",
};

function isApproved7702Implementation(
  chainId: number,
  delegateAddress: string,
): boolean {
  const delegate = delegateAddress.toLowerCase();
  const metamask =
    METAMASK_STATELESS_7702_IMPLEMENTATION[chainId]?.toLowerCase();
  const legacy = EPOCH_LEGACY_7702_IMPLEMENTATION[chainId]?.toLowerCase();
  return delegate === metamask || delegate === legacy;
}

export const GASLESS_SUPPORTED_CHAIN_IDS: number[] = [
  84532, 11155111, 11155420,
];

export type DelegationState = "none" | "epoch" | "other";

export type WalletAccountType = "local" | "json-rpc" | "unknown";

export type WalletGaslessStatus = {
  delegation: DelegationState;
  delegateAddress?: `0x${string}`;
  is7702Capable: boolean;
  needsSetup: boolean;
  accountType: WalletAccountType;
  canRelayEnable: boolean;
  canRelayDeposit: boolean;
  canWalletEnable: boolean;
};

export function detectWalletAccountType(
  walletClient: WalletClient,
): WalletAccountType {
  const accountType = walletClient.account?.type;
  if (accountType === "local") return "local";
  if (accountType === "json-rpc") return "json-rpc";
  if (typeof walletClient.request === "function") return "json-rpc";
  return "unknown";
}

/** Injected browser wallets (MetaMask, etc.) — never use SIO gasless relay. */
export function isInjectedWallet(walletClient: WalletClient): boolean {
  return detectWalletAccountType(walletClient) === "json-rpc";
}

function canRelayEnable(walletClient: WalletClient): boolean {
  return (
    detectWalletAccountType(walletClient) === "local" &&
    typeof walletClient.signAuthorization === "function"
  );
}

async function readDelegationState(
  publicClient: PublicClient,
  user: `0x${string}`,
  chainId: number,
): Promise<{ state: DelegationState; delegateAddress?: `0x${string}` }> {
  const code = await publicClient.getCode({ address: user });
  if (!code || code === "0x" || !code.startsWith(EIP7702_DELEGATION_PREFIX)) {
    return { state: "none" };
  }

  const delegate = (`0x${code.slice(8, 48)}` as `0x${string}`).toLowerCase();
  if (isApproved7702Implementation(chainId, delegate)) {
    return {
      state: "epoch",
      delegateAddress: getAddress(delegate) as `0x${string}`,
    };
  }
  return {
    state: "other",
    delegateAddress: getAddress(delegate) as `0x${string}`,
  };
}

/**
 * Lightweight gasless probe — mirrors SDK getWalletGaslessStatus.
 * Gasless relay UI is only shown for local signers; injected wallets use standard
 * wallet-paid deposits with EIP-5792 batching when supported.
 */
export async function getWalletGaslessStatus(args: {
  publicClient: PublicClient;
  walletClient: WalletClient;
  chainId: number;
  user: `0x${string}`;
}): Promise<WalletGaslessStatus> {
  const { publicClient, walletClient, chainId, user } = args;
  const chainOk = GASLESS_SUPPORTED_CHAIN_IDS.includes(chainId);
  const accountType = detectWalletAccountType(walletClient);
  const useRelay = accountType === "local";
  const relayEnable = useRelay && canRelayEnable(walletClient);

  const { state, delegateAddress } = await readDelegationState(
    publicClient,
    user,
    chainId,
  );

  const bytecode = await publicClient.getCode({ address: user });
  const isContract =
    bytecode !== undefined &&
    bytecode !== "0x" &&
    !bytecode.startsWith(EIP7702_DELEGATION_PREFIX);

  const relayDeposit = useRelay && state === "epoch";
  const canEnable = relayEnable;

  const is7702Capable =
    useRelay && chainOk && !isContract && (relayDeposit || canEnable);
  const needsSetup =
    useRelay && state !== "epoch" && state !== "other" && canEnable;

  return {
    delegation: state,
    delegateAddress,
    is7702Capable,
    needsSetup,
    accountType,
    canRelayEnable: relayEnable,
    canRelayDeposit: relayDeposit,
    canWalletEnable: false,
  };
}
