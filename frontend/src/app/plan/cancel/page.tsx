"use client";

import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';

export default function PlanCancelPage() {
  const router = useRouter();

  return (
    <Shell>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-times text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Payment Cancelled</h1>
          <p className="text-[#AAAAAA] text-lg mb-6">
            Your payment was cancelled. No charges have been made to your account.
          </p>
          <div className="space-y-4">
            <div className="bg-[#181818] border border-[#303030] rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">What happened?</h3>
              <ul className="text-[#AAAAAA] text-sm space-y-1">
                <li>• Your payment was cancelled before completion</li>
                <li>• No charges have been made to your account</li>
                <li>• You can try purchasing again at any time</li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/shop')}
                className="bg-[#202020] hover:bg-[#272727] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Back to Shop
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}



