"use client";

import React from 'react';

export function PlanCard({ plan, children }: { plan: any; children?: React.ReactNode }) {
  return (
    <div className={`rounded-lg overflow-hidden hover-lift relative ${plan.popular ? 'ring-2 ring-accent' : ''}`} style={{
      border: '1px solid var(--border)',
      background: 'var(--surface)'
    }}>
      {plan.popular && (
        <div className="absolute top-0 right-0 bg-accent text-black px-3 py-1 text-xs font-bold rounded-bl-lg">
          POPULAR
        </div>
      )}
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>

        <div className="mb-4">
          {plan.strikeThroughPrice > 0 && (
            <div className="text-lg text-muted line-through mb-1">
              ${plan.strikeThroughPrice}
            </div>
          )}
          <div className="text-3xl font-bold text-accent">
            ${plan.pricePerMonth}
          </div>
          <div className="text-sm text-muted">
            {plan.lifetime ? 'Once' : 'per month'}
          </div>
        </div>

        {plan.description && (
          <div className="text-sm text-muted mb-6" dangerouslySetInnerHTML={{ __html: plan.description }} />
        )}

        {plan.lifetime && (
          <div className="mb-6">
            <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
              <i className="fas fa-infinity mr-1"></i>
              Lifetime Access
            </div>
          </div>
        )}

        <div className="space-y-2 mb-6 text-sm text-left">
          {plan.productContent?.recurrentResources?.cpuPercent > 0 && (
            <div className="flex justify-between">
              <span>CPU:</span>
              <span className="font-medium">{plan.productContent.recurrentResources.cpuPercent}%</span>
            </div>
          )}
          {plan.productContent?.recurrentResources?.memoryMb > 0 && (
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className="font-medium">{plan.productContent.recurrentResources.memoryMb} MB</span>
            </div>
          )}
          {plan.productContent?.recurrentResources?.diskMb > 0 && (
            <div className="flex justify-between">
              <span>Disk:</span>
              <span className="font-medium">{plan.productContent.recurrentResources.diskMb} MB</span>
            </div>
          )}
          {plan.productContent?.coins > 0 && (
            <div className="flex justify-between">
              <span>Coins:</span>
              <span className="font-medium">{plan.productContent.coins}</span>
            </div>
          )}
          {plan.productContent?.serverLimit > 0 && (
            <div className="flex justify-between">
              <span>Server Limit:</span>
              <span className="font-medium">{plan.productContent.serverLimit}</span>
            </div>
          )}
          {plan.productContent?.additionalAllocations > 0 && (
            <div className="flex justify-between">
              <span>Ports:</span>
              <span className="font-medium">{plan.productContent.additionalAllocations}</span>
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}


