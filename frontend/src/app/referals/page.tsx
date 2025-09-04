import Shell from "@/components/Shell";
import { ReferralsCard } from "@/components/referrals/ReferralsCard";

export default function ReferralsPage() {
  return (
    <Shell>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
              <i className="fas fa-user-plus text-white"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Referrals</h1>
              <p className="text-[#AAAAAA]">Share your link to earn coins. New users also get a bonus.</p>
            </div>
          </div>
          <ReferralsCard />
      </div>
    </Shell>
  );
}


