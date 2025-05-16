"use client";

import { config } from "@/config/wagmiConfig";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import '@rainbow-me/rainbowkit/styles.css';

export default function Providers({ children }: { children: ReactNode }) {
     const queryClient = new QueryClient();
  return(
    <>
    <WagmiProvider config={config}>
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme()}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </SessionProvider>
    </WagmiProvider>
    </>

  )
}
