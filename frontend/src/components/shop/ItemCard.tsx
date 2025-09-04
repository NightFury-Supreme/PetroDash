"use client";

import React from 'react';

export function ItemCard({ item, quantity, onChangeQuantity, onBuy, isBuying, iconFor, clampQuantity }: {
  item: any;
  quantity: number;
  onChangeQuantity: (next: number) => void;
  onBuy: () => void;
  isBuying: boolean;
  iconFor: (name?: string) => string;
  clampQuantity: (it: any, next: number) => number;
}) {
  return (
    <div className="rounded-lg overflow-hidden hover-lift" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="p-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2">
          <span className="icon-badge"><i className={`fas ${iconFor(item.name)}`}></i></span>
          <div className="font-semibold">{item.name}</div>
        </div>
        <div className="text-xs text-muted">{item.unit}</div>
      </div>
      <div className="p-4">
        <div className="text-sm text-muted mb-2">{item.description}</div>
        <div className="text-xs text-muted mb-4">+{item.amountPerUnit} {item.unit} per unit</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="btn-ghost text-xs" onClick={() => onChangeQuantity(clampQuantity(item, quantity - 1))}>-</button>
            <div className="px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}>{quantity}</div>
            <button className="btn-ghost text-xs" onClick={() => onChangeQuantity(clampQuantity(item, quantity + 1))}>+</button>
          </div>
          <button disabled={isBuying || item.enabled === false} onClick={onBuy} className="btn-white">
            <i className="fas fa-coins mr-2"></i>
            Buy · {(Number(item.pricePerUnit || 0) * quantity)} coins
          </button>
        </div>
        {item.maxPerPurchase ? (
          <div className="text-[11px] text-muted mt-2">Max per purchase: {item.maxPerPurchase}</div>
        ) : null}
      </div>
    </div>
  );
}


