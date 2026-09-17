"use client";
import { useTranslations } from 'next-intl';
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useState } from 'react';
import { 
  ArrowRight, 
  Coins, 
  Cpu, 
  Database, 
  Download, 
  HardDrive, 
  MemoryStick, 
  Server, 
  ShieldCheck, 
  Loader2,
  Network,
  Flame,
  Package,
  Clock
} from 'lucide-react';
import { Drawer } from "@/components/ui/Drawer";
import { useCurrency } from "@/hooks/useCurrency";

import { useToast } from "@/components/ui/ToastProvider";

/* ==========================================================================
   CHECKOUT SECTION TITLE
========================================================================== */
function CheckoutSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
      {children}
    </h2>
  );
}

/* ==========================================================================
   RESOURCE ROW
========================================================================== */
function ResourceRow({
  resource,
  index,
  total,
}: {
  resource: { label: string; value: string; icon: React.ReactNode };
  index: number;
  total: number;
}) {
  const isLastOdd = index === total - 1 && total % 2 !== 0;

  return (
    <div
      className={`flex items-center justify-between px-4 py-4 ${
        index % 2 === 1 && !isLastOdd ? "sm:border-l sm:border-white/[0.05]" : ""
      } ${index >= 2 ? "border-t border-white/[0.05]" : ""} ${
        index === 1 ? "border-t border-white/[0.05] sm:border-t-0" : ""
      } ${isLastOdd ? "sm:col-span-2" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.025] text-zinc-400">
          {resource.icon}
        </div>
        <span className="text-[10px] text-zinc-500">{resource.label}</span>
      </div>
      <span className="text-[10px] font-semibold text-white">{resource.value}</span>
    </div>
  );
}





interface CouponDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (couponCode: string) => void;
  plan?: any;
  loading?: boolean;
  isPopupProcessing?: boolean;
}

export function CouponDrawer({
  isOpen,
  onClose,
  onConfirm,
  plan,
  loading = false,
  isPopupProcessing = false,
}: CouponDrawerProps) {
  const t = useTranslations('Shop');
  const { currency } = useCurrency();
  const { showError, showSuccess } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const planName = plan?.name || "";
  const planPrice = plan?.pricePerMonth || 0;
  const finalPrice = Math.max(0, planPrice - discountAmount);
  const isLifetime = plan?.lifetime || false;
  const redirectionLink = plan?.redirectionLink;
  const isPopular = plan?.popular || false;

  const res = plan?.productContent?.recurrentResources || {};
  const cpu = res.cpuPercent > 0 ? `${res.cpuPercent}%` : "0%";
  const memory = res.memoryMb > 0 ? `${res.memoryMb} MB` : "0 MB";
  const disk = res.diskMb > 0 ? `${res.diskMb} MB` : "0 MB";
  const servers = plan?.productContent?.serverLimit > 0 ? `${plan.productContent.serverLimit}` : "0";

  const validateCoupon = async () => {
    if (!couponCode) return;
    setValidating(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode, planId: plan?._id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid coupon');
      
      setDiscountAmount(data.discountAmount);
      setAppliedCoupon(couponCode);
      showSuccess("Coupon applied successfully!");
    } catch (e: any) {
      showError(e.message);
      setDiscountAmount(0);
      setAppliedCoupon(null);
    } finally {
      setValidating(false);
    }
  };

  const handleConfirm = () => onConfirm(couponCode);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') validateCoupon();
  };

  const resources = [];
  if (res.cpuPercent > 0) resources.push({ label: "CPU", value: cpu, icon: <Cpu className="h-3.5 w-3.5" /> });
  if (res.memoryMb > 0) resources.push({ label: "Memory", value: memory, icon: <MemoryStick className="h-3.5 w-3.5" /> });
  if (res.diskMb > 0) resources.push({ label: "Disk", value: disk, icon: <HardDrive className="h-3.5 w-3.5" /> });
  if (plan?.productContent?.serverLimit > 0) resources.push({ label: "Servers", value: servers, icon: <Server className="h-3.5 w-3.5" /> });
  if (plan?.productContent?.databases > 0) resources.push({ label: "Databases", value: String(plan.productContent.databases), icon: <Database className="h-3.5 w-3.5" /> });
  if (plan?.productContent?.backups > 0) resources.push({ label: "Backups", value: String(plan.productContent.backups), icon: <Download className="h-3.5 w-3.5" /> });
  if (plan?.productContent?.additionalAllocations > 0) resources.push({ label: "Ports", value: String(plan.productContent.additionalAllocations), icon: <Network className="h-3.5 w-3.5" /> });
  if (plan?.productContent?.coins > 0) resources.push({ label: "Coins", value: String(plan.productContent.coins), icon: <Coins className="h-3.5 w-3.5" /> });

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Checkout"
      subtitle="Complete your plan purchase"
      icon={<Package className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleConfirm()}
            disabled={loading || isPopupProcessing}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              loading || isPopupProcessing
                ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                : "bg-[#FF5722] text-white hover:bg-[#E64D1F] border border-transparent"
            }`}
          >
            {loading || isPopupProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('processing')}
              </>
            ) : (
              <>
                {redirectionLink ? 'Proceed to Checkout' : 'Pay with PayPal'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-9 pb-0 font-sans">
        
        {/* ==========================================================
            LEFT SIDE (PLAN DETAILS & RESOURCES)
        =========================================================== */}
        <div>
          <section>
            <div className="border-b border-white/[0.07]">
              <div className="flex flex-col gap-5 pb-5 sm:flex-row sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/[0.05]">
                  <Coins className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-[14px] font-semibold text-zinc-200">{planName}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {isPopular && (
                      <span className="flex items-center gap-1 rounded border border-[#FF5722]/30 bg-[#FF5722]/10 px-2 py-0.5 text-[9px] font-bold uppercase text-[#FF5722]">
                        <Flame className="h-3 w-3" />
                        POPULAR
                      </span>
                    )}
                    {isLifetime ? (
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-500">
                        LIFETIME
                      </span>
                    ) : (
                      <span className="rounded border border-blue-500/30 bg-blue-500/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase text-blue-500">
                        RECURRING
                      </span>
                    )}
                    {plan?.stock > 0 && (
                      <span className="flex items-center gap-1 rounded border border-orange-500/30 bg-orange-500/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase text-orange-400">
                        <Package className="h-3 w-3" />
                        {plan.stock <= 5 ? `${plan.stock} ${plan.stock === 1 ? 'STOCK' : 'STOCKS'} LEFT` : 'LIMITED STOCK'}
                      </span>
                    )}
                    {plan?.availableUntil && (
                      <span className="flex items-center gap-1 rounded border border-blue-500/30 bg-blue-500/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase text-blue-400">
                        <Clock className="h-3 w-3" />
                        ENDS {new Date(plan.availableUntil).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[10px] text-zinc-600">
                    {isLifetime ? "One-time payment · Lifetime access" : "Recurring subscription"}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-zinc-700">{t('planPrice')}</p>
                  <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-zinc-100">
                    {planPrice.toFixed(2)} {currency}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-9">
            <CheckoutSectionTitle>{t('includedResources')}</CheckoutSectionTitle>
            <div className="mt-4 grid border-y border-white/[0.07] sm:grid-cols-2">
              {resources.map((resource, index) => (
                <ResourceRow key={resource.label} resource={resource} index={index} total={resources.length} />
              ))}
            </div>
          </section>


        </div>

        {/* ==========================================================
            RIGHT SIDE (ORDER SUMMARY & PAYMENT)
        =========================================================== */}
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#555]">{t('orderSummary')}</p>
            <div className="mt-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#666]">{t('plan')}</span>
                <span className="text-[13px] font-semibold text-white">{planName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#666]">{t('price')}</span>
                <span className="text-[13px] font-semibold text-white">{planPrice.toFixed(2)} {currency}</span>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#666]">{t('discount')} ({appliedCoupon})</span>
                  <span className="text-[13px] font-medium text-emerald-500">-{discountAmount.toFixed(2)} {currency}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="coupon" className="text-xs font-medium text-[#888]">{t('couponCode')}</label>
              <span className="text-[10px] text-[#444]">{t('optional')}</span>
            </div>
            <div className={`flex h-11 overflow-hidden rounded-lg border bg-[#161616] ${
              appliedCoupon ? 'border-emerald-500/50' : 'border-[#2A2A2A]'
            }`}>
              <input
                id="coupon"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setAppliedCoupon(null);
                  setDiscountAmount(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={t('enterCouponCode')}
                disabled={loading || validating}
                className="min-w-0 flex-1 bg-transparent px-4 text-[13px] text-white outline-none placeholder:text-[#555] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={validateCoupon}
                disabled={loading || validating || !couponCode || couponCode === appliedCoupon}
                className="flex w-20 items-center justify-center text-[#666] border-l border-[#2A2A2A] transition-colors hover:bg-[#222] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 text-xs font-medium"
              >
                {validating ? <Loader2 size={14} className="animate-spin" /> : appliedCoupon ? t('applied') : t('apply')}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[#2A2A2A] bg-[#161616] p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[0.08em] text-[#555]">{t('total')}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  {finalPrice.toFixed(2)}
                </p>
              </div>
              <span className="mb-1 text-[11px] text-[#555]">{currency}</span>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 text-[#555]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="text-[10px] leading-relaxed">
              {redirectionLink 
                ? "You'll be securely redirected to our checkout page to complete your payment." 
                : "You'll be securely redirected to PayPal to complete your payment. Your payment details are handled by PayPal."}
            </p>
          </div>
        </div>

      </div>
    </Drawer>
  );
}
