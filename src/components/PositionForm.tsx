'use client';

import React, { useState } from 'react';
import { useAccount, useChainId, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { fetchPositionDetailsWithSimulation, PositionData } from '@/lib/rpc';
import { SUPPORTED_CHAINS } from '@/lib/chains';
import { mainnet } from 'wagmi/chains';

type ProtocolVersion = 'v3' | 'v4';

interface FormData {
  protocolVersion: ProtocolVersion;
  positionId: string;
  chainId: number;
  liquidityPercentage: number;
}

export default function PositionForm() {
  const { isConnected, address } = useAccount();
  const connectedChainId = useChainId();
  
  const [formData, setFormData] = useState<FormData>({
    protocolVersion: 'v4',
    positionId: '',
    chainId: mainnet.id, // Will be updated by useEffect
    liquidityPercentage: 100,
  });
  
  // Update chain selection when wallet connects
  React.useEffect(() => {
    if (connectedChainId && SUPPORTED_CHAINS.some(chain => chain.id === connectedChainId)) {
      setFormData(prev => ({ ...prev, chainId: connectedChainId }));
    }
  }, [connectedChainId]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [error, setError] = useState<string>('');
  
  // Transaction handling
  const { sendTransaction, data: txHash, isPending: isTxPending, error: txError } = useSendTransaction();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const selectedChain = SUPPORTED_CHAINS.find(chain => chain.id === formData.chainId);
  const isChainMismatch = isConnected && connectedChainId !== formData.chainId;

  const handleSendTransaction = () => {
    const transaction = positionData?.decreaseSimulation?.decrease;
    if (!transaction || !isConnected) return;

    if (!transaction.data || !transaction.to) {
      setError('Invalid transaction data');
      return;
    }

    try {
      sendTransaction({
        to: transaction.to as `0x${string}`,
        data: transaction.data as `0x${string}`,
        value: transaction.value ? BigInt(transaction.value) : undefined,
        gas: transaction.gasLimit ? BigInt(transaction.gasLimit) : undefined,
        gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice) : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send transaction');
    }
  };

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
      const data = await fetchPositionDetailsWithSimulation(
        formData.positionId,
        formData.protocolVersion,
        formData.chainId,
        address, // Pass wallet address for Trading API simulation
        formData.liquidityPercentage // Pass liquidity percentage
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

        {/* Liquidity Percentage Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Liquidity to Remove
          </label>
          <div className="space-y-3">
            {/* Quick percentage tabs */}
            <div className="flex space-x-2">
              {[25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, liquidityPercentage: percentage }))}
                  className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                    formData.liquidityPercentage === percentage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {percentage}%
                </button>
              ))}
            </div>
            
            {/* Custom percentage input */}
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="100"
                value={formData.liquidityPercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, liquidityPercentage: parseInt(e.target.value) }))}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.liquidityPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, liquidityPercentage: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) }))}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
              </div>
            </div>
          </div>
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

      {/* Debug Info - Remove in production */}
      {positionData && (
        <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Debug Info:</h4>
          <div className="text-xs space-y-1">
            <div>Has simulation: {positionData.decreaseSimulation ? 'Yes' : 'No'}</div>
            <div>Wallet connected: {isConnected ? 'Yes' : 'No'}</div>
            <div>Wallet address: {address || 'None'}</div>
            <div>Protocol: {positionData.protocol}</div>
            <div>Has poolKey: {positionData.poolKey ? 'Yes' : 'No'}</div>
            <div>Has positionInfo: {positionData.positionInfo ? 'Yes' : 'No'}</div>
            <div>Has liquidity: {positionData.liquidity ? 'Yes' : 'No'}</div>
            {positionData.decreaseSimulation && (
              <div>Simulation success: {positionData.decreaseSimulation.success ? 'Yes' : 'No'}</div>
            )}
          </div>
        </div>
      )}

      {/* Trading API Simulation Results */}
      {positionData?.decreaseSimulation && (
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {formData.liquidityPercentage}% Liquidity Removal Simulation
          </h3>
          
          {positionData.decreaseSimulation.success ? (
            <div>
              {/* Pool Information */}
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Pool Information:</h4>
                <div className="bg-white dark:bg-gray-800 rounded p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pool Liquidity:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{positionData.decreaseSimulation.poolLiquidity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current Tick:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{positionData.decreaseSimulation.currentTick}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sqrt Ratio X96:</span>
                    <span className="text-xs font-mono text-gray-900 dark:text-white break-all">{positionData.decreaseSimulation.sqrtRatioX96}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gas Fee:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{positionData.decreaseSimulation.gasFee} wei</span>
                  </div>
                </div>
              </div>
              
              {positionData.decreaseSimulation.decrease && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Transaction Details:</h4>
                  <div className="bg-white dark:bg-gray-800 rounded p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">To:</span>
                      <span className="text-xs font-mono text-gray-900 dark:text-white break-all">
                        {positionData.decreaseSimulation.decrease.to}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">From:</span>
                      <span className="text-xs font-mono text-gray-900 dark:text-white break-all">
                        {positionData.decreaseSimulation.decrease.from}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gas Limit:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {positionData.decreaseSimulation.decrease.gasLimit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gas Price:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {positionData.decreaseSimulation.decrease.gasPrice} wei
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Value:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {positionData.decreaseSimulation.decrease.value} wei
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Chain ID:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {positionData.decreaseSimulation.decrease.chainId}
                      </span>
                    </div>
                  </div>

                  {/* Calldata Display */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Transaction Calldata:</h4>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded p-3">
                      <div className="text-xs font-mono text-gray-900 dark:text-white break-all max-h-32 overflow-y-auto">
                        {positionData.decreaseSimulation.decrease.data}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(positionData.decreaseSimulation!.decrease.data)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  </div>

                  {/* Transaction Submission */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={handleSendTransaction}
                      disabled={!isConnected || isChainMismatch || isTxPending || isTxLoading}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed"
                    >
                      {isTxPending || isTxLoading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {isTxPending ? 'Sending Transaction...' : 'Waiting for Confirmation...'}
                        </div>
                      ) : (
                        `Remove ${formData.liquidityPercentage}% Liquidity`
                      )}
                    </button>
                    
                    {!isConnected && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                        Connect your wallet to send transaction
                      </p>
                    )}
                    {isChainMismatch && (
                      <p className="text-xs text-red-500 mt-2 text-center">
                        Switch to {selectedChain?.name} to send transaction
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="text-sm text-red-700 dark:text-red-300">
                <strong>Simulation Error:</strong> {positionData.decreaseSimulation.error}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction Status */}
      {(txHash || txError || isTxSuccess) && (
        <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Transaction Status
          </h3>
          
          {txError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
              <div className="text-sm text-red-700 dark:text-red-300">
                <strong>Transaction Error:</strong> {txError.message}
              </div>
            </div>
          )}
          
          {txHash && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Transaction Hash:</span>
                <span className="text-xs font-mono text-gray-900 dark:text-white break-all">
                  {txHash}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`text-sm font-medium ${
                  isTxSuccess 
                    ? 'text-green-600 dark:text-green-400' 
                    : isTxLoading 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {isTxSuccess ? 'Confirmed' : isTxLoading ? 'Pending...' : 'Submitted'}
                </span>
              </div>
              
              {selectedChain && (
                <div className="mt-4">
                  <a
                    href={`${selectedChain.blockExplorers?.default?.url}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View on Block Explorer
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}