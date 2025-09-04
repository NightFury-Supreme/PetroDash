interface StatusModalProps {
  isOpen: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
}

export function StatusModal({
  isOpen,
  type,
  title,
  message,
  onClose
}: StatusModalProps) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const icon = isSuccess ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
  const iconColor = isSuccess ? 'text-green-400' : 'text-red-400';
  const bgColor = isSuccess ? 'bg-green-500/10' : 'bg-red-500/10';
  const borderColor = isSuccess ? 'border-green-500/20' : 'border-red-500/20';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#202020] rounded-xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center gap-3">
          <i className={`${icon} ${iconColor} text-xl`}></i>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        
        <div className={`flex items-center gap-3 p-4 ${bgColor} border ${borderColor} rounded-lg`}>
          <i className={`${icon} ${iconColor} text-xl`}></i>
          <div>
            <div className={`font-semibold ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
              {isSuccess ? 'Success' : 'Error'}
            </div>
            <div className="text-gray-300 text-sm">{message}</div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="bg-[#303030] hover:bg-[#404040] text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isSuccess ? 'Continue' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

