
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet,polygon,optimism,arbitrum,base } from 'viem/chains';
export const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
