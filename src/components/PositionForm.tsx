'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { fetchPositionDetails, PositionData } from '@/lib/rpc';
import { SUPPORTED_CHAINS } from '@/lib/chains';
import { mainnet } from 'wagmi/chains';

type ProtocolVersion = 'v3' | 'v4';

interface FormData {
  protocolVersion: ProtocolVersion;
  positionId: string;
  chainId: number;
}

export default function PositionForm() {
  const { isConnected } = useAccount();
  const connectedChainId = useChainId();
  
  const [formData, setFormData] = useState<FormData>({
    protocolVersion: 'v4',
    positionId: '',
    chainId: mainnet.id,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [error, setError] = useState<string>('');

  const selectedChain = SUPPORTED_CHAINS.find(chain => chain.id === formData.chainId);
  const isChainMismatch = isConnected && connectedChainId !== formData.chainId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!formData.positionId.trim()) {
      setError('Please enter a Position ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setPositionData(null);

    try {
      const data = await fetchPositionDetails(
        formData.positionId,
        formData.protocolVersion,
        formData.chainId
      );
      setPositionData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch position data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Protocol Version */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Protocol Version
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="protocolVersion"
                value="v3"
                checked={formData.protocolVersion === 'v3'}
                onChange={(e) => setFormData(prev => ({ ...prev, protocolVersion: e.target.value as ProtocolVersion }))}
                disabled={true}
                className="mr-2 text-blue-600 disabled:opacity-50"
              />
              <span className="text-gray-500">v3 (Coming Soon)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="protocolVersion"
                value="v4"
                checked={formData.protocolVersion === 'v4'}
                onChange={(e) => setFormData(prev => ({ ...prev, protocolVersion: e.target.value as ProtocolVersion }))}
                className="mr-2 text-blue-600"
              />
              <span className="text-gray-900 dark:text-gray-100">v4</span>
            </label>
          </div>
        </div>

        {/* Position ID */}
        <div>
          <label htmlFor="positionId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position ID (NFT ID)
          </label>
          <input
            id="positionId"
            type="text"
            value={formData.positionId}
            onChange={(e) => setFormData(prev => ({ ...prev, positionId: e.target.value }))}
            placeholder="Enter position ID..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Chain Selection */}
        <div>
          <label htmlFor="chainId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chain
          </label>
          <select
            id="chainId"
            value={formData.chainId}
            onChange={(e) => setFormData(prev => ({ ...prev, chainId: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {SUPPORTED_CHAINS.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chain Mismatch Warning */}
        {isChainMismatch && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Chain Mismatch Warning
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    Your wallet is connected to a different chain. Please switch to {selectedChain?.name} to fetch position data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !isConnected}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Fetching Position...
            </div>
          ) : (
            'Fetch Position Details'
          )}
        </button>
      </form>

      {/* Position Data Display */}
      {positionData && (
        <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Position Details
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Position ID:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{positionData.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Protocol:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{positionData.protocol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Chain:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedChain?.name}</span>
            </div>
            {positionData.token0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Token 0:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{positionData.token0}</span>
              </div>
            )}
            {positionData.token1 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Token 1:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{positionData.token1}</span>
              </div>
            )}
            {positionData.fee && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Fee:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{positionData.fee / 10000}%</span>
              </div>
            )}
            {positionData.liquidity && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Liquidity:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{positionData.liquidity}</span>
              </div>
            )}
            {positionData.tickLower !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tick Lower:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{positionData.tickLower}</span>
              </div>
            )}
            {positionData.tickUpper !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tick Upper:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{positionData.tickUpper}</span>
              </div>
            )}
            {positionData.poolKey?.tickSpacing && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tick Spacing:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{positionData.poolKey.tickSpacing}</span>
              </div>
            )}
            {positionData.positionInfo?.poolId && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pool ID:</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white font-mono break-all">{positionData.positionInfo.poolId}</span>
              </div>
            )}
            {positionData.positionInfo?.hasSubscriber !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Has Subscriber:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {positionData.positionInfo.hasSubscriber ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            {positionData.poolKey?.hooks && positionData.poolKey.hooks !== '0x0000000000000000000000000000000000000000' && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Hooks:</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white font-mono break-all">{positionData.poolKey.hooks}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}