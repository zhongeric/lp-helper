// Types for Uniswap Trading API

export interface Pool {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

export interface Position {
  tickLower: number;
  tickUpper: number;
  pool: Pool;
}

export interface DecreaseLiquidityRequest {
  simulateTransaction: boolean;
  protocol: 'V4';
  tokenId: number;
  chainId: number;
  walletAddress: string;
  liquidityPercentageToDecrease: number;
  positionLiquidity: string;
  position: Position;
}

export interface DecreaseTransaction {
  data: string;
  value: string;
  to: string;
  from: string;
  gasPrice: string;
  gasLimit: string;
  chainId: number;
}

export interface DecreaseLiquidityResponse {
  requestId: string;
  decrease: DecreaseTransaction;
  poolLiquidity: string;
  currentTick: number;
  sqrtRatioX96: string;
  gasFee: string;
  success: boolean;
  error?: string;
}