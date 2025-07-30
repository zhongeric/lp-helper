'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import PositionForm from '@/components/PositionForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Uniswap Position Tracker
            </h1>
            <ConnectButton />
          </div>
          <PositionForm />
        </div>
      </div>
    </div>
  );
}
