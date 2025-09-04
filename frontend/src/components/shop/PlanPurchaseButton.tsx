"use client";

import React from 'react';

export function PlanPurchaseButton({ 
  plan, 
  onPurchase, 
  onSuccess 
}: { 
  plan: any; 
  onPurchase: () => void;
  onSuccess?: () => void; 
}) {
  return (
    <button 
      className="btn-white w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" 
      onClick={onPurchase}
    >
      <i className="fas fa-credit-card mr-2"></i>
      {plan.lifetime ? 'Purchase Lifetime' : 'Purchase'}
    </button>
  );
}


