"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@/components/Modal';
import Shell from '@/components/Shell';

// Avoid prerendering this page; it's a post-payment client flow
// Mark as dynamic using runtime to avoid server invoking client-only APIs
export const runtime = 'edge';

export default function PlanSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modal = useModal();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const orderId = searchParams.get('token');
        if (!orderId) {
          throw new Error('No order ID found');
        }

        // Capture the PayPal order
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/paypal/capture-order`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ orderId })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to capture payment');
        }

        setSuccess(true);
        await modal.success({ 
          title: 'Payment Successful!', 
          body: 'Your plan has been activated successfully. You can now access your new resources.' 
        });

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (error: any) {
        console.error('Payment capture error:', error);
        await modal.error({ 
          title: 'Payment Error', 
          body: error.message || 'Failed to process payment. Please contact support.' 
        });
        router.push('/shop');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, router, modal]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Processing Payment...</h2>
            <p className="text-[#AAAAAA]">Please wait while we confirm your payment.</p>
          </div>
        </div>
      </Shell>
    );
  }

  if (success) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check text-white text-2xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
            <p className="text-[#AAAAAA] text-lg mb-6">
              Your plan has been activated successfully. You can now access your new resources.
            </p>
            <div className="space-y-4">
              <div className="bg-[#181818] border border-[#303030] rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">What's Next?</h3>
                <ul className="text-[#AAAAAA] text-sm space-y-1">
                  <li>• Your resources have been added to your account</li>
                  <li>• You can now create servers with your new limits</li>
                  <li>• Check your dashboard to see your updated resources</li>
                </ul>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  return null;
}


