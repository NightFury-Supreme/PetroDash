import { GiftSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <GiftSkeleton />
    </div>
  );
}
