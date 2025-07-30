// Types for Uniswap V4 Position Manager
import { DecreaseLiquidityResponse } from './trading-api-types';

export interface PoolKey {
  currency0: string; // Currency address
  currency1: string; // Currency address
  fee: number; // uint24
  tickSpacing: number; // int24
  hooks: string; // IHooks contract address
}

export interface PoolAndPositionInfo {
  poolKey: PoolKey;
  info: string; // PositionInfo as uint256 (hex string)
}

// Parsed position info from the uint256 info field
// Layout: 200 bits poolId | 24 bits tickUpper | 24 bits tickLower | 8 bits hasSubscriber
export interface ParsedPositionInfo {
  hasSubscriber: boolean; // 8 bits - flag if tokenId is subscribed to an address
  tickLower: number; // 24 bits - int24 tickLower of the position
  tickUpper: number; // 24 bits - int24 tickUpper of the position
  poolId: string; // 200 bits - truncated poolId (bytes25)
}

export interface PositionData {
  id: string;
  protocol: 'v3' | 'v4';
  chainId: number;
  poolKey?: PoolKey;
  positionInfo?: ParsedPositionInfo;
  liquidity?: string; // uint128 as string
  decreaseSimulation?: DecreaseLiquidityResponse;
  // Legacy fields for compatibility
  token0?: string;
  token1?: string;
  fee?: number;
  tickLower?: number;
  tickUpper?: number;
}

// Contract addresses for Uniswap V4
export interface V4ContractAddresses {
  PositionManager: string;
  PoolManager: string;
}