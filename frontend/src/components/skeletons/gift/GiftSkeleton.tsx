import React from "react";
import { GiftHeaderSkeleton } from "./GiftHeaderSkeleton";
import { GiftRedeemSkeleton } from "./GiftRedeemSkeleton";
import { GiftCodesSkeleton } from "./GiftCodesSkeleton";

export function GiftSkeleton() {
  return (
    <div className="flex flex-col h-full space-y-6">
      <GiftHeaderSkeleton />
      <GiftRedeemSkeleton />
      <GiftCodesSkeleton />
    </div>
  );
}

export default GiftSkeleton;
