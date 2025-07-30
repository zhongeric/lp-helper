import { DecreaseLiquidityRequest, DecreaseLiquidityResponse } from './trading-api-types';

export class TradingApiClient {
  async decreaseLiquidity(request: DecreaseLiquidityRequest): Promise<DecreaseLiquidityResponse> {
    try {
      // Call our Next.js API route instead of the external API directly
      const response = await fetch('/api/trading/decrease-liquidity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling decrease liquidity API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Export a default instance
export const tradingApiClient = new TradingApiClient();