'use client';

import { useState, useEffect } from 'react';

interface OAuthProvider {
  name: string;
  enabled: boolean;
  clientId: string;
  icon: string;
  color: string;
  bgColor: string;
  hoverColor: string;
}

interface OAuthButtonsProps {
  onError?: (error: string) => void;
}

export function OAuthButtons({ onError }: OAuthButtonsProps) {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOAuthStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/`);
        const data = await response.json();
        
        const availableProviders: OAuthProvider[] = [];
        
        if (data.discord?.enabled) {
          availableProviders.push({
            name: 'Discord',
            enabled: true,
            clientId: data.discord.clientId || '',
            icon: 'fab fa-discord',
            color: '#5865F2',
            bgColor: '#5865F2',
            hoverColor: '#4752C4'
          });
        }
        
        if (data.google?.enabled) {
          availableProviders.push({
            name: 'Google',
            enabled: true,
            clientId: data.google.clientId || '',
            icon: 'fab fa-google',
            color: '#4285F4',
            bgColor: '#4285F4',
            hoverColor: '#3367D6'
          });
        }
        
        setProviders(availableProviders);
      } catch (error) {
        console.error('Failed to fetch OAuth status:', error);
        onError?.('Failed to load login options');
      } finally {
        setLoading(false);
      }
    };

    fetchOAuthStatus();
  }, [onError]);

  const handleOAuthLogin = (provider: string) => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE}/api/oauth/${provider.toLowerCase()}`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-12 bg-[#202020] rounded-lg animate-pulse"></div>
        <div className="h-12 bg-[#202020] rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <button
          key={provider.name}
          onClick={() => handleOAuthLogin(provider.name)}
          className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg flex items-center justify-center gap-3 text-white font-medium hover:bg-[#272727] hover:border-[#404040] transition-all duration-200 group"
          style={{
            '--provider-color': provider.color,
            '--provider-bg': provider.bgColor,
            '--provider-hover': provider.hoverColor
          } as React.CSSProperties}
        >
          <i 
            className={`${provider.icon} text-lg group-hover:scale-110 transition-transform text-white`}
          ></i>
          <span>Continue with {provider.name}</span>
        </button>
      ))}
    </div>
  );
}
