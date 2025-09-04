interface DeleteConfirmationModalProps {
  isOpen: boolean;
  serverName?: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  serverName,
  deleting,
  onClose,
  onConfirm
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#202020] border border-[#303030] rounded-xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center gap-3">
          <i className="fas fa-exclamation-triangle text-red-400 text-xl"></i>
          <h3 className="text-lg font-semibold text-white">Delete Server</h3>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <i className="fas fa-exclamation-triangle text-red-400 text-xl"></i>
          <div>
            <div className="text-red-400 font-semibold">Warning</div>
            <div className="text-gray-300 text-sm">This action cannot be undone.</div>
          </div>
        </div>
        
        <p className="text-gray-300">
          Are you sure you want to delete <span className="font-semibold text-white">{serverName}</span>? 
          This will permanently remove the server and all its data.
        </p>
        
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Deleting...
              </>
            ) : (
              'Delete Server'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

