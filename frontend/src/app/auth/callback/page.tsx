'use client';

import { useEffect, Suspense } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
    const { showError } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      const discordJoin = searchParams.get('discord_join');


      if (error) {
        showError('OAuth authentication failed. Please try again.');
        router.push('/login');
        return;
      }

      if (token) {
        try {
          // Store the token
          localStorage.setItem('auth_token', token);
          
          // Handle Discord join result
          if (discordJoin === 'success') {
            // Successfully joined Discord server
                      } else if (discordJoin === 'failed') {
            // Failed to join Discord server, show error
                      }
          
          // Redirect to dashboard
          router.push('/dashboard');
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (error) {
          showError('Failed to complete login. Please try again.');
          router.push('/login');
        }
      } else {
        showError('No authentication token received. Please try again.');
        router.push('/login');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  const discordJoin = searchParams.get('discord_join');
  
  return (
    <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#202020] rounded-xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Completing Login...</h2>
        <p className="text-[#AAAAAA]">
          {discordJoin ? 'Setting up your account and joining Discord server...' : 'Please wait while we finish setting up your account.'}
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#202020] rounded-xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Loading...</h2>
          <p className="text-[#AAAAAA]">Please wait...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
