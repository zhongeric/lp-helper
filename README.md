# Uniswap V4 Position Tracker

A Next.js application for tracking and managing Uniswap V4 liquidity positions with RainbowKit wallet integration.

## ⚠️ Disclaimer

**This software is purely for educational and testing purposes.** No guarantees are made about the accuracy of information displayed. **Never sign or submit any transaction that you do not fully understand.** Use at your own risk.

## Features

- 🔗 **Wallet Connection**: Connect Ethereum wallets using RainbowKit
- 📊 **Position Tracking**: Fetch and display V4 position details including:
  - Pool information (tokens, fees, tick ranges)
  - Position liquidity amounts
  - NFT metadata and images
- 🔄 **Liquidity Management**: Simulate and execute liquidity removal transactions
- 🌐 **Multi-Chain Support**: Supports Ethereum Mainnet, Base, and Unichain
- 🎨 **Modern UI**: Clean, responsive interface with dark mode support

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Wallet Integration**: RainbowKit + wagmi
- **Blockchain Interaction**: ethers.js for RPC calls
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety throughout

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wallet-connect-app
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure RPC URLs in `.env.local`:
```env
# RPC URLs for supported chains
NEXT_PUBLIC_MAINNET_RPC_URL=your_mainnet_rpc_url
NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc_url
NEXT_PUBLIC_UNICHAIN_RPC_URL=your_unichain_rpc_url

# Trading API (required for transaction simulation)
UNISWAP_API_KEY=your_uniswap_api_key
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and select your preferred wallet
2. **Select Protocol**: Choose V4 (V3 support coming soon)
3. **Enter Position ID**: Input your NFT position ID
4. **Choose Chain**: Select the blockchain where your position exists
5. **Set Liquidity %**: Choose how much liquidity to remove (25%, 50%, 75%, 100%)
6. **Fetch Position**: Click "Fetch Position Details" to load data
7. **Review Transaction**: Examine the generated transaction details
8. **Submit**: Click "Remove X% Liquidity" to send the transaction to your wallet

## Architecture

### Key Components

- **PositionForm**: Main UI component handling form input and position display
- **RPC Layer**: Handles blockchain interactions and contract calls
- **Trading API**: Server-side proxy for Uniswap's Trading API
- **Type Definitions**: Comprehensive TypeScript interfaces

### Smart Contract Integration

The app interacts with Uniswap V4 contracts:
- **Position Manager**: For position data and NFT metadata
- **Pool Manager**: For pool state information

### Supported Chains

| Chain | Chain ID | RPC Endpoint |
|-------|----------|--------------|
| Ethereum Mainnet | 1 | Configurable |
| Base | 8453 | Configurable |
| Unichain | 130 | Configurable |

## API Routes

### `/api/trading/decrease-liquidity`

Server-side proxy for Uniswap Trading API to bypass CORS restrictions.

**Method**: POST  
**Body**: DecreaseLiquidityRequest  
**Response**: Transaction simulation data

## Security Considerations

- ✅ Environment variables for sensitive data
- ✅ Input validation on all user inputs
- ✅ Read-only operations by default
- ✅ Clear transaction preview before signing
- ✅ Educational disclaimers prominently displayed

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   └── page.tsx           # Main page
├── components/            # React components
│   └── PositionForm.tsx   # Main form component
├── lib/                   # Utility libraries
│   ├── chains.ts          # Chain configurations
│   ├── rpc.ts             # RPC functions
│   ├── types.ts           # TypeScript definitions
│   └── trading-api.ts     # Trading API client
└── providers/             # React providers
    └── RainbowKitProvider.tsx
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Uniswap Labs](https://uniswap.org) for the V4 protocol and Trading API
- [RainbowKit](https://rainbowkit.com) for wallet connection infrastructure
- [wagmi](https://wagmi.sh) for React hooks for Ethereum
