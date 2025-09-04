import Link from 'next/link';

interface Plan {
  _id: string;
  name: string;
  description?: string;
  strikeThroughPrice: number;
  pricePerMonth: number;
  pricePerYear: number;
  visibility: 'public' | 'unlisted';
  availableAt?: string;
  availableUntil?: string;
  stock: number;
  limitPerCustomer: number;
  category: string;
  redirectionLink?: string;
  billingOptions: {
    renewable: boolean;
    nonRenewable: boolean;
    lifetime: boolean;
  };
  availableBillingCycles: string[];
  productContent: {
    recurrentResources: {
      cpuPercent: number;
      memoryMb: number;
      diskMb: number;
      swapMb: number;
      blockIoProportion: number;
      cpuPinning: string;
    };
    additionalAllocations: number;
    databases: number;
    backups: number;
    coins: number;
    serverLimit: number;
  };
  staffNotes: string;
  totalPurchases: number;
  currentUsers: number;
  popular: boolean;
  sortOrder: number;
}

interface PlansListProps {
  plans: Plan[];
  deleting: string | null;
  onDelete: (planId: string, planName: string) => Promise<void>;
  onToggleEnabled: (plan: Plan) => Promise<void>;
  onMakeUnlisted: (plan: Plan) => Promise<void>;
  onMakePublic: (plan: Plan) => Promise<void>;
}

export function PlansList({
  plans,
  deleting,
  onDelete,
  onToggleEnabled,
  onMakeUnlisted,
  onMakePublic,
}: PlansListProps) {
  if (plans.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-[#202020] rounded-full flex items-center justify-center shadow-lg">
          <i className="fas fa-crown text-white text-3xl"></i>
        </div>
        <h3 className="text-2xl font-bold mb-3 text-white">No plans yet</h3>
        <p className="text-[#AAAAAA] text-lg mb-8">Create your first hosting plan to get started</p>
        <Link 
          href="/admin/plans/new" 
          className="bg-white hover:bg-gray-100 text-black px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center gap-3"
        >
          <i className="fas fa-plus"></i>
          Create First Plan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {plans.map((plan) => (
        <div 
          key={plan._id} 
          className="bg-[#181818] border border-[#303030] rounded-xl p-6 hover:bg-[#202020] transition-colors"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              {/* Plan Header */}
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                {plan.popular && (
                  <span className="bg-[#202020] text-white px-4 py-2 text-sm font-bold rounded-full border border-[#303030]">
                    <i className="fas fa-star mr-2 text-white"></i>
                    POPULAR
                  </span>
                )}
                                 <span className="bg-[#202020] text-white border border-[#303030] px-4 py-2 text-sm font-semibold rounded-full">
                   <i className="fas fa-check-circle mr-2 text-white"></i>
                   Active
                 </span>
                <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                  plan.visibility === 'public' 
                    ? 'bg-[#202020] text-white border border-[#303030]' 
                    : 'bg-[#202020] text-[#AAAAAA] border border-[#303030]'
                }`}>
                  <i className={`fas ${plan.visibility === 'public' ? 'fa-globe' : 'fa-link'} mr-2 text-white`}></i>
                  {plan.visibility === 'public' ? 'Public' : 'Unlisted'}
                </span>
                {plan.currentUsers > 0 && (
                  <span className="bg-[#202020] text-white border border-[#303030] px-4 py-2 text-sm font-semibold rounded-full">
                    <i className="fas fa-users mr-2 text-white"></i>
                    {plan.currentUsers} Active User{plan.currentUsers !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {/* Plan Description */}
              {plan.description && (
                <p className="text-[#AAAAAA] mb-6 text-lg leading-relaxed">{plan.description}</p>
              )}

              {/* Plan Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                 <div className="text-center p-4 bg-[#202020] rounded-xl border border-[#303030]">
                   <div className="text-2xl font-bold text-white mb-1">${plan.pricePerMonth}</div>
                   <div className="text-sm text-[#AAAAAA]">
                     {plan.billingOptions?.lifetime ? 'Once' : 'per month'}
                   </div>
                   {plan.strikeThroughPrice > 0 && (
                     <div className="text-sm text-gray-500 line-through">${plan.strikeThroughPrice}</div>
                   )}
                 </div>
                
                <div className="text-center p-4 bg-[#202020] rounded-xl border border-[#303030]">
                  <div className="text-2xl font-bold text-white mb-1">
                    {plan.stock === -1 ? '❌' : plan.stock === 0 ? '∞' : plan.stock}
                  </div>
                  <div className="text-sm text-[#AAAAAA]">Stock</div>
                </div>
                
                <div className="text-center p-4 bg-[#202020] rounded-xl border border-[#303030]">
                  <div className="text-2xl font-bold text-white mb-1">{plan.totalPurchases}</div>
                  <div className="text-sm text-[#AAAAAA]">Total Purchases</div>
                </div>
                
                <div className="text-center p-4 bg-[#202020] rounded-xl border border-[#303030]">
                  <div className="text-2xl font-bold text-white mb-1">{plan.currentUsers}</div>
                  <div className="text-sm text-[#AAAAAA]">Active Users</div>
                </div>
              </div>

              {/* Resource Details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                  <i className="fas fa-microchip text-white"></i>
                  <span className="text-sm font-medium text-white">CPU: {plan.productContent.recurrentResources.cpuPercent}%</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                  <i className="fas fa-memory text-white"></i>
                  <span className="text-sm font-medium text-white">RAM: {plan.productContent.recurrentResources.memoryMb} MB</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                  <i className="fas fa-hdd text-white"></i>
                  <span className="text-sm font-medium text-white">Disk: {plan.productContent.recurrentResources.diskMb} MB</span>
                </div>
                                 <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                   <i className="fas fa-coins text-white"></i>
                   <span className="text-sm font-medium text-white">Coins: {plan.productContent.coins}</span>
                 </div>
                <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                  <i className="fas fa-server text-white"></i>
                  <span className="text-sm font-medium text-white">Servers: {plan.productContent.serverLimit}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                  <i className="fas fa-database text-white"></i>
                  <span className="text-sm font-medium text-white">DB: {plan.productContent.databases}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                  <i className="fas fa-plug text-white"></i>
                  <span className="text-sm font-medium text-white">Ports: {plan.productContent.additionalAllocations}</span>
                </div>
              </div>

              {/* Billing Cycles */}
              {plan.availableBillingCycles && plan.availableBillingCycles.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-[#AAAAAA] mb-3">Available Billing Cycles:</div>
                  <div className="flex flex-wrap gap-2">
                    {plan.availableBillingCycles.map((cycle) => (
                      <span key={cycle} className="px-3 py-2 bg-[#202020] text-white text-sm rounded-lg font-medium capitalize border border-[#303030]">
                        <i className="fas fa-calendar mr-2 text-white"></i>
                        {cycle}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-[#303030]">
            <div className="flex items-center gap-3">
              {plan.visibility === 'public' ? (
                plan.currentUsers > 0 && (
                  <button
                    onClick={() => onMakeUnlisted(plan)}
                    className="px-4 py-2 rounded-lg font-medium bg-[#202020] text-white hover:bg-[#272727] border border-[#303030] transition-colors"
                    title="Make this plan unlisted to hide it from public view"
                  >
                    <i className="fas fa-eye-slash mr-2 text-white"></i>
                    Make Unlisted
                  </button>
                )
              ) : (
                <button
                  onClick={() => onMakePublic(plan)}
                  className="px-4 py-2 rounded-lg font-medium bg-[#202020] text-white hover:bg-[#272727] border border-[#303030] transition-colors"
                  title="Make this plan public so users can see it"
                >
                  <i className="fas fa-eye mr-2 text-white"></i>
                  Make Public
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/admin/plans/edit/${plan._id}`}
                className="bg-[#202020] hover:bg-[#272727] text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                <i className="fas fa-edit mr-2 text-white"></i>
                Edit
              </Link>
              <button
                onClick={() => onDelete(plan._id, plan.name)}
                disabled={deleting === plan._id || plan.currentUsers > 0}
                className={`px-6 py-2 text-sm font-medium transition-colors rounded-lg ${
                  plan.currentUsers > 0
                    ? 'bg-[#202020] text-[#AAAAAA] cursor-not-allowed border border-[#303030]'
                    : 'bg-[#202020] text-white hover:bg-[#272727] border border-[#303030]'
                }`}
                title={plan.currentUsers > 0 ? `Cannot delete: ${plan.currentUsers} user(s) are using this plan` : 'Delete this plan'}
              >
                {deleting === plan._id ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2 text-white"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash mr-2 text-white"></i>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
