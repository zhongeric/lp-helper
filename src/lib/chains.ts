import { mainnet, base, unichain } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [mainnet, base, unichain] as const;

export const getChainById = (chainId: number) => {
  return SUPPORTED_CHAINS.find(chain => chain.id === chainId);
};