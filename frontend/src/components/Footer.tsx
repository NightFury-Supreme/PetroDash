"use client";

import React, { useState, useEffect } from 'react';

interface BrandingInfo {
  siteName: string;
  siteIconUrl: string;
}

export default function Footer() {
  const [branding, setBranding] = useState<BrandingInfo>({ siteName: 'PteroDash', siteIconUrl: '' });
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/branding`, { cache: 'no-store' });
        const data = await res.json();
        if (data?.siteName) {
          setBranding(data);
        }
      } catch (error) {
        // Use default branding if fetch fails
        console.warn('Failed to fetch branding for footer:', error);
      }
    };

    fetchBranding();
  }, []);

  return (
    <footer className="bg-[#0F0F0F] py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-2">
          {/* Copyright */}
          <p className="text-[#bbb] text-sm">
            © {branding.siteName} {currentYear} all rights reserved.
          </p>
          
          {/* Powered by */}
          <p className="text-[#bbb] text-sm">
            Powered by{' '}
            <a 
              href="https://github.com/NightFury-Supreme/PetroDash" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-blue-400 transition-colors duration-200"
            >
              PteroDash
            </a>
          </p>
          
          {/* Made with love */}
          <p className="text-[#bbb] text-sm">
            Made with 💖 & by{' '}
            <a 
              href="https://github.com/NightFury-Supreme/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-blue-400 transition-colors duration-200"
            >
              Night Fury
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
