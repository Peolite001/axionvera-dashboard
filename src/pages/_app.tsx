import type { AppProps } from "next/app";
import { Toaster } from 'sonner';

import "@/styles/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { VaultProvider } from "@/contexts/VaultContext";
import { useWalletContext } from "@/hooks/useWallet";
import ThemeToggle from "@/components/ThemeToggle";
import { inter, jetbrainsMono } from "@/lib/fonts";

import { useEffect } from "react";
import { initTelemetry } from "@/utils/telemetry";
import { GovernanceProvider } from "@/contexts/GovernanceContext";


function AppInner({ Component, pageProps }: AppProps) {
  useEffect(() => {
    initTelemetry();
  }, []);

  return (
    // Apply CSS-variable font classes to the root so the custom properties
    // (--font-inter, --font-mono) are available globally via Tailwind's
    // fontFamily tokens and any CSS that references them directly.
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <ErrorBoundary>
        <ThemeProvider>
          <WalletProvider>
            <VaultProviderWrapper>
            <Component {...pageProps} />
            <ThemeToggle />
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
          </VaultProviderWrapper>
          </WalletProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
}


function VaultProviderWrapper({ children }: { children: React.ReactNode }) {
  const wallet = useWalletContext();
  return <VaultProvider walletAddress={wallet.publicKey}>{children}</VaultProvider>;
}

export default function App(props: AppProps) {
  return <GovernanceProvider walletAddress={wallet.address}>
  <VaultProviderWrapper>
    <AppInner {...props} />
  </VaultProviderWrapper>
</GovernanceProvider>;
}
