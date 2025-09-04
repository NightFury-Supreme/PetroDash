"use client";

import React, { useState } from 'react';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (couponCode: string) => void;
  planName: string;
  planPrice: number;
  isLifetime: boolean;
  redirectionLink?: string;
  loading?: boolean;
}

export function CouponModal({
  isOpen,
  onClose,
  onConfirm,
  planName,
  planPrice,
  isLifetime,
  redirectionLink,
  loading = false
}: CouponModalProps) {
  const [couponCode, setCouponCode] = useState('');

  const handleConfirm = () => {
    onConfirm(couponCode);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel">
        <div className="modal-header">
          <span className="icon-badge" style={{ transform: 'scale(.9)' }}>
            <i className="fas fa-credit-card text-blue-300"></i>
          </span>
          <h3 className="font-semibold text-sm">
            {isLifetime ? 'Purchase' : 'Subscribe to'} {planName}
          </h3>
        </div>
        
        <div className="modal-body text-sm text-gray-300">
          <div className="space-y-4">
            <p>
              {isLifetime ? 'Purchase' : 'Subscribe to'} <strong className="text-white">{planName}</strong> for{' '}
              <strong className="text-white">
                ${planPrice} {isLifetime ? '(One-time payment)' : '/month'}
              </strong>
            </p>
            
            <p className="text-blue-300 text-xs">
              {redirectionLink 
                ? "You'll be redirected to our secure checkout page" 
                : "You'll be redirected to PayPal to complete your payment"
              }
            </p>
            
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-300">
                Coupon Code (Optional)
              </label>
              <input 
                type="text" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-2 bg-[#202020] border border-[#303030] rounded-lg focus:outline-none focus:border-[#404040] text-white placeholder-[#AAAAAA] transition-colors text-sm" 
                placeholder="Enter coupon code..." 
                disabled={loading}
              />
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button 
            className="btn-ghost" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="btn-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              redirectionLink ? 'Proceed to Checkout' : 'Pay with PayPal'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
