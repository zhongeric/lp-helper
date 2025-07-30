import { ethers } from 'ethers';
import { PositionData, PoolAndPositionInfo, ParsedPositionInfo, V4ContractAddresses } from './types';
import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core';
import { tradingApiClient } from './trading-api';
import { DecreaseLiquidityRequest } from './trading-api-types';

const RPC_URLS: Record<number, string> = {
  1: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || '', // Mainnet
  8453: process.env.NEXT_PUBLIC_BASE_RPC_URL || '', // Base
  130: process.env.NEXT_PUBLIC_UNICHAIN_RPC_URL || '', // Unichain
};

// Uniswap V4 contract addresses
const V4_CONTRACT_ADDRESSES: Record<number, V4ContractAddresses> = {
  1: { // Mainnet
    PositionManager: CHAIN_TO_ADDRESSES_MAP[1].v4PositionManagerAddress!, 
    PoolManager: CHAIN_TO_ADDRESSES_MAP[1].v4PoolManagerAddress!,
  },
  8453: { // Base
    PositionManager: CHAIN_TO_ADDRESSES_MAP[8453].v4PositionManagerAddress!,
    PoolManager: CHAIN_TO_ADDRESSES_MAP[8453].v4PoolManagerAddress!,
  },
  130: { // Unichain
    PositionManager: CHAIN_TO_ADDRESSES_MAP[130].v4PositionManagerAddress!,
    PoolManager: CHAIN_TO_ADDRESSES_MAP[130].v4PoolManagerAddress!,
  },
};

export function getRpcUrl(chainId: number): string {
  const url = RPC_URLS[chainId];
  if (!url) {
    throw new Error(`RPC URL not configured for chain ID: ${chainId}`);
  }
  if (url.includes('YOUR_')) {
    throw new Error(`Please configure RPC URL for chain ID: ${chainId} in .env.local`);
  }
  return url;
}

export async function makeRpcCall(
  chainId: number,
  method: string,
  params: any[] = []
): Promise<any> {
  const rpcUrl = getRpcUrl(chainId);
  
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC call failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`);
  }

  return data.result;
}

export async function fetchPositionDetails(
  positionId: string,
  protocolVersion: 'v3' | 'v4',
  chainId: number
): Promise<PositionData> {
  try {
    // TODO: Implement the actual contract calls based on protocol version
    // This is a placeholder for the RPC implementation
    
    if (protocolVersion === 'v4') {
      return await fetchV4PositionDetails(positionId, chainId);
    } else {
      return await fetchV3PositionDetails(positionId, chainId);
    }
  } catch (error) {
    console.error('Error fetching position details:', error);
    throw error;
  }
}

async function fetchV4PositionDetails(
  positionId: string,
  chainId: number
): Promise<PositionData> {
  const contractAddresses = V4_CONTRACT_ADDRESSES[chainId];
  if (!contractAddresses) {
    throw new Error(`V4 contracts not supported on chain ${chainId}`);
  }

  const positionManagerAddress = contractAddresses.PositionManager;
  if (!positionManagerAddress || positionManagerAddress === '0x') {
    throw new Error(`V4 Position Manager address not configured for chain ${chainId}`);
  }

  try {
    // Make both RPC calls in parallel for better performance
    const [poolAndPositionInfo, liquidity] = await Promise.all([
      getPoolAndPositionInfo(positionId, chainId, positionManagerAddress),
      getPositionLiquidity(positionId, chainId, positionManagerAddress)
    ]);
    
    // Parse the position info
    const parsedPositionInfo = parsePositionInfo(poolAndPositionInfo.info);
    
    return {
      id: positionId,
      protocol: 'v4',
      chainId,
      poolKey: poolAndPositionInfo.poolKey,
      positionInfo: parsedPositionInfo,
      liquidity,
      // Map to legacy fields for compatibility
      token0: poolAndPositionInfo.poolKey.currency0,
      token1: poolAndPositionInfo.poolKey.currency1,
      fee: poolAndPositionInfo.poolKey.fee,
      tickLower: parsedPositionInfo.tickLower,
      tickUpper: parsedPositionInfo.tickUpper,
    };
  } catch (error) {
    console.error(`Error fetching V4 position ${positionId} on chain ${chainId}:`, error);
    throw error;
  }
}

// ABI for V4 Position Manager functions
const V4_POSITION_MANAGER_ABI = [
  {
    "name": "getPoolAndPositionInfo",
    "outputs": [
      {
        "components": [
          {"internalType": "Currency", "name": "currency0", "type": "address"},
          {"internalType": "Currency", "name": "currency1", "type": "address"},
          {"internalType": "uint24", "name": "fee", "type": "uint24"},
          {"internalType": "int24", "name": "tickSpacing", "type": "int24"},
          {"internalType": "contract IHooks", "name": "hooks", "type": "address"}
        ],
        "internalType": "struct PoolKey",
        "name": "poolKey",
        "type": "tuple"
      },
      {"internalType": "PositionInfo", "name": "info", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function",
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}]
  },
  {
    "name": "getPositionLiquidity",
    "outputs": [{"internalType": "uint128", "name": "liquidity", "type": "uint128"}],
    "stateMutability": "view",
    "type": "function",
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}]
  }
];

async function getPoolAndPositionInfo(
  positionId: string,
  chainId: number,
  positionManagerAddress: string
): Promise<PoolAndPositionInfo> {
  // Create contract interface
  const contractInterface = new ethers.Interface(V4_POSITION_MANAGER_ABI);
  
  // Encode the function call data
  const callData = contractInterface.encodeFunctionData('getPoolAndPositionInfo', [positionId]);
  
  // Make the eth_call
  const result = await makeRpcCall(chainId, 'eth_call', [
    {
      to: positionManagerAddress,
      data: callData,
    },
    'latest'
  ]);
  
  // Decode the result
  const decodedResult = contractInterface.decodeFunctionResult('getPoolAndPositionInfo', result);
  
  return {
    poolKey: {
      currency0: decodedResult.poolKey.currency0,
      currency1: decodedResult.poolKey.currency1,
      fee: Number(decodedResult.poolKey.fee),
      tickSpacing: Number(decodedResult.poolKey.tickSpacing),
      hooks: decodedResult.poolKey.hooks,
    },
    info: decodedResult.info.toString(),
  };
}

async function getPositionLiquidity(
  positionId: string,
  chainId: number,
  positionManagerAddress: string
): Promise<string> {
  // Create contract interface
  const contractInterface = new ethers.Interface(V4_POSITION_MANAGER_ABI);
  
  // Encode the function call data
  const callData = contractInterface.encodeFunctionData('getPositionLiquidity', [positionId]);
  
  // Make the eth_call
  const result = await makeRpcCall(chainId, 'eth_call', [
    {
      to: positionManagerAddress,
      data: callData,
    },
    'latest'
  ]);
  
  // Decode the result
  const decodedResult = contractInterface.decodeFunctionResult('getPositionLiquidity', result);
  
  // Return liquidity as string to preserve precision
  return decodedResult.liquidity.toString();
}

function parsePositionInfo(infoHex: string): ParsedPositionInfo {
  // Convert hex string to BigInt for bit manipulation
  const info = BigInt(infoHex);
  
  /**
   * V4 PositionInfo bit layout (from least significant bit):
   * Layout: 200 bits poolId | 24 bits tickUpper | 24 bits tickLower | 8 bits hasSubscriber
   * 
   * Fields from LSB to MSB:
   * - hasSubscriber: 8 bits (bits 0-7)
   * - tickLower: 24 bits (bits 8-31) - int24
   * - tickUpper: 24 bits (bits 32-55) - int24
   * - poolId: 200 bits (bits 56-255) - bytes25 (truncated bytes32)
   */
  
  // Extract hasSubscriber (8 bits, LSB)
  const hasSubscriber = (info & 0xFFn) !== 0n;
  
  // Extract tickLower (24 bits, bits 8-31)
  const tickLowerRaw = (info >> 8n) & 0xFFFFFFn; // 24 bits mask
  // Convert from unsigned to signed int24 (two's complement)
  const tickLower = tickLowerRaw >= (1n << 23n) 
    ? Number(tickLowerRaw - (1n << 24n)) 
    : Number(tickLowerRaw);
  
  // Extract tickUpper (24 bits, bits 32-55)
  const tickUpperRaw = (info >> 32n) & 0xFFFFFFn; // 24 bits mask
  // Convert from unsigned to signed int24 (two's complement)
  const tickUpper = tickUpperRaw >= (1n << 23n) 
    ? Number(tickUpperRaw - (1n << 24n)) 
    : Number(tickUpperRaw);
  
  // Extract poolId (200 bits, bits 56-255)
  const poolId = (info >> 56n) & ((1n << 200n) - 1n);
  // Convert to hex string and pad to 50 characters (25 bytes * 2)
  const poolIdHex = '0x' + poolId.toString(16).padStart(50, '0');
  
  return {
    hasSubscriber,
    tickLower,
    tickUpper,
    poolId: poolIdHex,
  };
}

async function fetchV3PositionDetails(
  positionId: string,
  chainId: number
): Promise<PositionData> {
  // TODO: Implement V3-specific contract calls
  // Similar to V4 but with V3 contract addresses and methods
  
  console.log(`Fetching V3 position ${positionId} on chain ${chainId}`);
  
  // Placeholder implementation
  const mockData: PositionData = {
    id: positionId,
    protocol: 'v3',
    chainId,
  };
  
  return mockData;
}

// Helper function to get V4 contract addresses
export function getV4ContractAddress(
  chainId: number,
  contractType: keyof V4ContractAddresses
): string {
  const contractAddresses = V4_CONTRACT_ADDRESSES[chainId];
  if (!contractAddresses) {
    throw new Error(`V4 contracts not supported on chain ${chainId}`);
  }

  const address = contractAddresses[contractType];
  if (!address || address === '0x') {
    throw new Error(`V4 ${contractType} address not configured for chain ${chainId}`);
  }

  return address;
}

// Helper function to create Trading API request from position data
function createDecreaseLiquidityRequest(
  positionData: PositionData,
  walletAddress: string,
  liquidityPercentageToDecrease: number = 100
): DecreaseLiquidityRequest {
  if (!positionData.poolKey || !positionData.positionInfo || !positionData.liquidity) {
    throw new Error('Insufficient position data for Trading API request');
  }

  return {
    simulateTransaction: true,
    protocol: 'V4',
    tokenId: parseInt(positionData.id),
    chainId: positionData.chainId,
    walletAddress,
    liquidityPercentageToDecrease,
    positionLiquidity: positionData.liquidity,
    position: {
      tickLower: positionData.positionInfo.tickLower,
      tickUpper: positionData.positionInfo.tickUpper,
      pool: {
        token0: positionData.poolKey.currency0,
        token1: positionData.poolKey.currency1,
        fee: positionData.poolKey.fee,
        tickSpacing: positionData.poolKey.tickSpacing,
        hooks: positionData.poolKey.hooks,
      },
    },
  };
}

// Enhanced position fetching with Trading API integration
export async function fetchPositionDetailsWithSimulation(
  positionId: string,
  protocolVersion: 'v3' | 'v4',
  chainId: number,
  walletAddress?: string,
  liquidityPercentage: number = 100
): Promise<PositionData> {
  // First, fetch the basic position data
  const positionData = await fetchPositionDetails(positionId, protocolVersion, chainId);
  
  // If wallet address is provided and it's V4, fetch decrease liquidity simulation
  if (walletAddress && protocolVersion === 'v4' && positionData.poolKey && positionData.positionInfo && positionData.liquidity) {
    try {
      console.log('Attempting Trading API call with:', {
        positionId,
        walletAddress,
        liquidityPercentage,
        chainId
      });
      
      const tradingApiRequest = createDecreaseLiquidityRequest(positionData, walletAddress, liquidityPercentage);
      const simulation = await tradingApiClient.decreaseLiquidity(tradingApiRequest);
      
      console.log('Trading API response:', simulation);
      positionData.decreaseSimulation = simulation;
    } catch (error) {
      console.error('Error fetching decrease liquidity simulation:', error);
      // Don't fail the entire request if Trading API fails
      positionData.decreaseSimulation = {
        success: false,
        error: error instanceof Error ? error.message : 'Trading API simulation failed',
        requestId: '',
        decrease: {} as any,
        poolLiquidity: '',
        currentTick: 0,
        sqrtRatioX96: '',
        gasFee: '',
      };
    }
  }
  
  return positionData;
}