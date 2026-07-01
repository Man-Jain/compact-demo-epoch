import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, optimismSepolia, sepolia } from "viem/chains";
import { getRpcUrlForChain } from "../config/rpc";
import { chains } from "../config/wagmi";

export const LOCAL_SIGNER_CHAINS = [
  baseSepolia,
  sepolia,
  optimismSepolia,
] as const;

export const DEFAULT_LOCAL_CHAIN_ID = baseSepolia.id;

export function normalizePrivateKey(input: string): `0x${string}` | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const hex = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) return null;
  return hex as `0x${string}`;
}

function chainForId(chainId: number) {
  return chains.find((entry) => entry.id === chainId) ?? baseSepolia;
}

function buildLocalClients(chainId: number, privateKey: `0x${string}`) {
  const chain = chainForId(chainId);
  const rpcUrl =
    getRpcUrlForChain(chainId) ?? chain.rpcUrls.default.http[0] ?? "";
  const account = privateKeyToAccount(privateKey);
  const transport = http(rpcUrl);

  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  const publicClient = createPublicClient({
    chain,
    transport,
  });

  return { walletClient, publicClient, address: account.address };
}

interface LocalSignerContextValue {
  isLocalConnected: boolean;
  address?: `0x${string}`;
  walletClient?: WalletClient;
  publicClient?: PublicClient;
  chainId: number;
  connectError: string | null;
  connect: (privateKey: string, chainId: number) => boolean;
  disconnect: () => void;
  setChainId: (chainId: number) => void;
}

const LocalSignerContext = createContext<LocalSignerContextValue | null>(null);

export function LocalSignerProvider({ children }: { children: ReactNode }) {
  const privateKeyRef = useRef<`0x${string}` | null>(null);
  const [chainId, setChainIdState] = useState<number>(DEFAULT_LOCAL_CHAIN_ID);
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [walletClient, setWalletClient] = useState<WalletClient | undefined>();
  const [publicClient, setPublicClient] = useState<PublicClient | undefined>();
  const [connectError, setConnectError] = useState<string | null>(null);

  const applyPrivateKey = useCallback(
    (privateKey: `0x${string}`, nextChainId: number) => {
      const clients = buildLocalClients(nextChainId, privateKey);
      privateKeyRef.current = privateKey;
      setChainIdState(nextChainId);
      setAddress(clients.address);
      setWalletClient(clients.walletClient);
      setPublicClient(clients.publicClient as PublicClient);
      setConnectError(null);
    },
    [],
  );

  const connect = useCallback(
    (privateKeyInput: string, nextChainId: number): boolean => {
      const privateKey = normalizePrivateKey(privateKeyInput);
      if (!privateKey) {
        setConnectError(
          "Enter a valid 32-byte private key (64 hex characters).",
        );
        return false;
      }

      try {
        applyPrivateKey(privateKey, nextChainId);
        return true;
      } catch (err) {
        setConnectError(
          err instanceof Error ? err.message : "Could not create local signer",
        );
        return false;
      }
    },
    [applyPrivateKey],
  );

  const disconnect = useCallback(() => {
    privateKeyRef.current = null;
    setAddress(undefined);
    setWalletClient(undefined);
    setPublicClient(undefined);
    setConnectError(null);
  }, []);

  const setChainId = useCallback(
    (nextChainId: number) => {
      setChainIdState(nextChainId);
      if (privateKeyRef.current) {
        applyPrivateKey(privateKeyRef.current, nextChainId);
      }
    },
    [applyPrivateKey],
  );

  const value = useMemo(
    (): LocalSignerContextValue => ({
      isLocalConnected: Boolean(address && walletClient),
      address,
      walletClient,
      publicClient,
      chainId,
      connectError,
      connect,
      disconnect,
      setChainId,
    }),
    [
      address,
      walletClient,
      publicClient,
      chainId,
      connectError,
      connect,
      disconnect,
      setChainId,
    ],
  );

  return (
    <LocalSignerContext.Provider value={value}>
      {children}
    </LocalSignerContext.Provider>
  );
}

export function useLocalSigner() {
  const context = useContext(LocalSignerContext);
  if (!context) {
    throw new Error("useLocalSigner must be used within LocalSignerProvider");
  }
  return context;
}
