import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';
import BalancePage from './pages/BalancePage.tsx';
import { config } from './config/wagmi';
import { NotificationProvider } from './context/NotificationProvider';
import { ChainConfigProvider } from './contexts/ChainConfigContext';
import { useChainConfig as useChainConfigQuery } from './hooks/useChainConfig';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
});

const customTheme = darkTheme({
  accentColor: '#00ff00',
  accentColorForeground: '#000000',
  borderRadius: 'medium',
  overlayBlur: 'small',
});

// Component to provide chain config context using react-query hook
function ChainConfigWrapper({ children }: { children: React.ReactNode }) {
  const { supportedChains } = useChainConfigQuery();
  return (
    <ChainConfigProvider value={{ supportedChains: supportedChains ?? null }}>
      {children}
    </ChainConfigProvider>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme}>
          <ChainConfigWrapper>
            <NotificationProvider>
              <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col">
                <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <BalancePage />
                </div>
              </div>
            </NotificationProvider>
          </ChainConfigWrapper>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
