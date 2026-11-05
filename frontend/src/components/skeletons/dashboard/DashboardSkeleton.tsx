"use client";

import React from "react";
import { DashboardHeaderSkeleton } from "./DashboardHeaderSkeleton";
import { DashboardStatsSkeleton } from "./DashboardStatsSkeleton";
import { DashboardStatusSkeleton } from "./DashboardStatusSkeleton";
import { DashboardServersSkeleton } from "./DashboardServersSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <DashboardHeaderSkeleton />
      <DashboardStatsSkeleton />
      <DashboardStatusSkeleton />
      <DashboardServersSkeleton rows={4} />
    </div>
  );
}

export default DashboardSkeleton;
