import Link from 'next/link';

type Server = {
  _id: string;
  name: string;
  status: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  egg: {
    _id: string;
    name: string;
  };
  location: {
    _id: string;
    name: string;
  };
  limits: {
    diskMb: number;
    memoryMb: number;
    cpuPercent: number;
    backups: number;
    databases: number;
    allocations: number;
  };
  createdAt: string;
  clientUrl?: string;
};

type ServerCardProps = {
  server: Server;
  showOwner?: boolean;
  showActions?: boolean;
  onDelete?: (serverId: string, serverName: string) => void;
  deleting?: string | null;
  editLink?: string;
  viewOwnerLink?: string;
  className?: string;
};

export default function ServerCard({
  server,
  showOwner = true,
  showActions = true,
  onDelete,
  deleting,
  editLink,
  viewOwnerLink,
  className = ""
}: ServerCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'active':
        return 'bg-green-600 text-white';
      case 'stopped':
      case 'offline':
        return 'bg-red-600 text-white';
      case 'starting':
      case 'creating':
      case 'installing':
        return 'bg-yellow-600 text-white';
      case 'stopping':
      case 'deleting':
        return 'bg-orange-600 text-white';
      case 'suspended':
        return 'bg-red-800 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'active':
        return 'fa-play-circle';
      case 'stopped':
      case 'offline':
      case 'error':
        return 'fa-stop-circle';
      case 'starting':
      case 'creating':
      case 'installing':
        return 'fa-spinner fa-spin';
      case 'stopping':
      case 'deleting':
        return 'fa-pause-circle';
      case 'suspended':
        return 'fa-ban';
      default:
        return 'fa-question-circle';
    }
  };

  // Check if server is suspended
  const isSuspended = server.status.toLowerCase() === 'suspended';

  return (
    <div 
      className={`bg-[#202020] border border-[#303030] rounded-xl overflow-hidden hover:bg-[#272727] transition-all duration-300 ${className}`}
    >

      
      {/* Bottom metadata section */}
      <div className="p-4 space-y-4">
        {/* Server name */}
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-white flex-1 pr-3">{server.name}</h3>
        </div>
        
        {/* Server info grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Location */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#303030] rounded-full flex items-center justify-center">
              <i className="fas fa-map-marker-alt text-[#AAAAAA] text-xs"></i>
            </div>
            <div>
              <div className="text-xs text-[#AAAAAA]">Location</div>
              <div className="text-sm font-medium text-white">{server.location.name}</div>
            </div>
          </div>
          
          {/* Egg */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#303030] rounded-full flex items-center justify-center">
              <i className="fas fa-egg text-[#AAAAAA] text-xs"></i>
            </div>
            <div>
              <div className="text-xs text-[#AAAAAA]">Egg</div>
              <div className="text-sm font-medium text-white">{server.egg.name}</div>
            </div>
          </div>
        </div>
        
        {/* Resource usage - 2x3 grid layout */}
        <div className="space-y-3">
          <div className="text-xs text-[#AAAAAA] font-medium">Resources</div>
          
          {/* 2x3 grid: Left column and Right column */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#303030] rounded-full flex items-center justify-center">
                  <i className="fas fa-microchip text-[#AAAAAA] text-xs"></i>
                </div>
                <div className="text-xs text-[#AAAAAA] w-12">CPU</div>
                <div className="text-sm font-medium text-white">{server.limits.cpuPercent}%</div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#303030] rounded-full flex items-center justify-center">
                  <i className="fas fa-hdd text-[#AAAAAA] text-xs"></i>
                </div>
                <div className="text-xs text-[#AAAAAA] w-12">Disk</div>
                <div className="text-sm font-medium text-white">{server.limits.diskMb} MB</div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#303030] rounded-full flex items-center justify-center">
                  <i className="fas fa-database text-[#AAAAAA] text-xs"></i>
                </div>
                <div className="text-xs text-[#AAAAAA] w-12">DBs</div>
                <div className="text-sm font-medium text-white">{server.limits.databases}</div>
              </div>
            </div>
            
            {/* Right column */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#303030] rounded-full flex items-center justify-center">
                  <i className="fas fa-memory text-[#AAAAAA] text-xs"></i>
                </div>
                <div className="text-xs text-[#AAAAAA] w-12">RAM</div>
                <div className="text-sm font-medium text-white">{server.limits.memoryMb} MB</div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#303030] rounded-full flex items-center justify-center">
                  <i className="fas fa-archive text-[#AAAAAA] text-xs"></i>
                </div>
                <div className="text-xs text-[#AAAAAA] w-12">Backups</div>
                <div className="text-sm font-medium text-white">{server.limits.backups}</div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#303030] rounded-full flex items-center justify-center">
                  <i className="fas fa-plug text-[#AAAAAA] text-xs"></i>
                </div>
                <div className="text-xs text-[#AAAAAA] w-12">Ports</div>
                <div className="text-sm font-medium text-white">{server.limits.allocations}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Created date and Action Buttons - Same line */}
        <div className="flex items-center justify-between pt-2 border-t border-[#303030]">
          {/* Created date - Left side */}
          <div className="text-xs text-[#AAAAAA]">
            <i className="fas fa-calendar mr-1"></i>
            Created: {new Date(server.createdAt).toLocaleDateString()}
          </div>
          
          {/* Action Buttons - Right side */}
          {showActions && (
            <div className="flex items-center gap-2">
              {isSuspended ? (
                <div className="text-center p-2 bg-red-900/20 border border-red-800 rounded-lg">
                  <div className="text-red-400 text-xs font-medium">
                    <i className="fas fa-ban mr-1"></i>
                    Suspended
                  </div>
                </div>
              ) : (
                <>
                  {/* Open in Panel Button */}
                  <button
                    onClick={() => window.open(server.clientUrl, '_blank')}
                    className="bg-[#303030] hover:bg-[#404040] text-white px-2 py-1 text-xs rounded-lg transition-colors"
                    title="Open in Panel"
                  >
                    <i className="fas fa-external-link-alt"></i>
                  </button>
                  
                  {/* Edit Button */}
                  {editLink && (
                    <Link
                      href={editLink}
                      className="bg-[#303030] hover:bg-[#404040] text-white px-2 py-1 text-xs rounded-lg transition-colors"
                      title="Edit Server"
                    >
                      <i className="fas fa-edit"></i>
                    </Link>
                  )}
                  
                  {/* Delete Button */}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(server._id, server.name)}
                      disabled={deleting === server._id}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-2 py-1 text-xs rounded-lg transition-colors"
                      title="Delete Server"
                    >
                      {deleting === server._id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-trash"></i>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
