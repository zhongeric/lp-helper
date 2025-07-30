import { NextRequest, NextResponse } from 'next/server';
import { DecreaseLiquidityRequest, DecreaseLiquidityResponse } from '@/lib/trading-api-types';

const TRADING_API_BASE_URL = 'https://trading-api-labs.interface.gateway.uniswap.org/v1';

// Headers required for Uniswap Trading API
const getApiHeaders = (): HeadersInit => ({
  'accept': '*/*',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  'content-type': 'application/json',
  'origin': 'https://app.uniswap.org',
  'pragma': 'no-cache',
  'priority': 'u=1, i',
  'referer': 'https://app.uniswap.org/',
  'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  // Public facing Uniswap interface API key
  'x-api-key': 'JoyCGj29tT4pymvhaGciK4r1aIPvqW6W53xT1fwo',
  'x-app-version': '',
  'x-request-source': 'uniswap-web',
  'x-uniquote-enabled': 'false',
  'x-viem-provider-enabled': 'false',
});

export async function POST(request: NextRequest) {
  try {
    const body: DecreaseLiquidityRequest = await request.json();
    
    // Validate required fields
    if (!body.tokenId || !body.chainId || !body.walletAddress || !body.positionLiquidity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Make the request to Uniswap Trading API
    const response = await fetch(`${TRADING_API_BASE_URL}/lp/decrease`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Trading API error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Trading API error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const result: DecreaseLiquidityResponse = {
      ...data,
      success: true,
    };

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}