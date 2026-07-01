import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";
import {
  DEFAULT_LOCAL_CHAIN_ID,
  LOCAL_SIGNER_CHAINS,
  useLocalSigner,
} from "../context/LocalSignerContext";
import { formatAddress } from "../utils/formatting";

interface WalletConnectProps {
  hasSession: boolean;
}

type WalletTab = "browser" | "local";

export function WalletConnect({ hasSession }: WalletConnectProps) {
  const [tab, setTab] = useState<WalletTab>("browser");
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [localChainId, setLocalChainId] = useState<number>(
    DEFAULT_LOCAL_CHAIN_ID,
  );
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const { isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const local = useLocalSigner();

  useEffect(() => {
    if (wagmiConnected && local.isLocalConnected) {
      local.disconnect();
    }
  }, [wagmiConnected, local.isLocalConnected, local.disconnect]);

  const handleLocalConnect = () => {
    const ok = local.connect(privateKeyInput, localChainId);
    if (ok) {
      wagmiDisconnect();
      setPrivateKeyInput("");
    }
  };

  const handleLocalDisconnect = () => {
    local.disconnect();
    setPrivateKeyInput("");
  };

  if (local.isLocalConnected && local.address) {
    return (
      <div className="flex flex-col items-end gap-2 min-w-[240px]">
        <div className="flex items-center gap-2 rounded-lg border border-[#00ff00]/35 bg-gray-900 px-3 py-2">
          <span className="rounded bg-[#00ff00]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#00ff00]">
            Local signer
          </span>
          <span className="font-mono text-sm text-gray-200">
            {formatAddress(local.address)}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-gray-500">
          <label className="flex items-center gap-2">
            <span>Chain</span>
            <select
              value={local.chainId}
              onChange={(e) => local.setChainId(Number(e.target.value))}
              className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-gray-200"
            >
              {LOCAL_SIGNER_CHAINS.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleLocalDisconnect}
            className="text-gray-400 underline-offset-2 hover:text-gray-200 hover:underline"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-800 bg-[#0a0a0a] p-3">
      <div className="mb-3 flex rounded-lg bg-gray-900 p-1">
        <button
          type="button"
          onClick={() => setTab("browser")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "browser"
              ? "bg-gray-800 text-gray-100"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Browser wallet
        </button>
        <button
          type="button"
          onClick={() => setTab("local")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "local"
              ? "bg-gray-800 text-gray-100"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Local signer
        </button>
      </div>

      {tab === "browser" ? (
        <div className="flex justify-end">
          <ConnectButton
            showBalance={hasSession}
            accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
            chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-gray-500">
            Dev/testnet only. Your private key stays in memory for this session
            and is never stored.
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Chain
            </label>
            <select
              value={localChainId}
              onChange={(e) => setLocalChainId(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-[#00ff00] focus:outline-none"
            >
              {LOCAL_SIGNER_CHAINS.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name} ({chain.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Private key
            </label>
            <div className="relative">
              <input
                type={showPrivateKey ? "text" : "password"}
                value={privateKeyInput}
                onChange={(e) => setPrivateKeyInput(e.target.value)}
                placeholder="0x… or 64 hex chars"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 pr-20 font-mono text-sm text-gray-200 focus:border-[#00ff00] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPrivateKey((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
              >
                {showPrivateKey ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {local.connectError ? (
            <p className="text-xs text-red-400">{local.connectError}</p>
          ) : null}

          <button
            type="button"
            onClick={handleLocalConnect}
            disabled={!privateKeyInput.trim()}
            className="w-full rounded-lg bg-[#00ff00] px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#00dd00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Connect local signer
          </button>
        </div>
      )}
    </div>
  );
}
