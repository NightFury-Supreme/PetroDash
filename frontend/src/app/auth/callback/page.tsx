'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@/components/Modal';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modal = useModal();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      const discordJoin = searchParams.get('discord_join');
      const discordError = searchParams.get('discord_error');

      if (error) {
        await modal.error({
          title: 'Login Failed',
          body: 'OAuth authentication failed. Please try again.'
        });
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
            console.log('Successfully joined Discord server');
          } else if (discordJoin === 'failed') {
            // Failed to join Discord server, show error
            console.warn('Failed to join Discord server:', discordError);
          }
          
          // Redirect to dashboard
          router.push('/dashboard');
        } catch (error) {
          await modal.error({
            title: 'Login Failed',
            body: 'Failed to complete login. Please try again.'
          });
          router.push('/login');
        }
      } else {
        await modal.error({
          title: 'Login Failed',
          body: 'No authentication token received. Please try again.'
        });
        router.push('/login');
      }
    };

    handleCallback();
  }, [searchParams, router, modal]);

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
