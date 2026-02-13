import { ConnectButton } from '@rainbow-me/rainbowkit';

interface WalletConnectProps {
  hasSession: boolean;
}

export function WalletConnect({ hasSession }: WalletConnectProps) {
  return (
    <ConnectButton
      showBalance={hasSession}
      accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
      chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }}
    />
  );
}
