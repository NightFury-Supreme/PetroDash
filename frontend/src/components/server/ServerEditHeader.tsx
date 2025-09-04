interface Server {
  _id: string;
  name: string;
  status: string;
  limits: any;
  panelServerId: string;
  createdAt: string;
  updatedAt: string;
}

interface ServerEditHeaderProps {
  server: Server | null;
}

export function ServerEditHeader({ server }: ServerEditHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
        <i className="fas fa-server text-white text-lg sm:text-xl"></i>
      </div>
      <div className="flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Edit Server</h1>
        <p className="text-gray-400">Update server configuration and resources</p>
      </div>
      {server && (
        <div className="flex items-center gap-2 px-3 py-1 bg-[#202020] rounded-full">
          <div className={`w-2 h-2 rounded-full ${server.status === 'running' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          <span className="text-sm text-gray-300 capitalize">{server.status}</span>
        </div>
      )}
    </header>
  );
}

