"use client";
import Shell from '@/components/Shell';
import { useParams, useRouter } from 'next/navigation';
import { EditServerSkeleton } from '@/components/skeletons/server/EditServerSkeleton';
import { useServerEdit } from '@/hooks/useServerEdit';
import { EditServerForm } from '@/components/server/EditServerForm';
import { DeleteConfirmationModal } from '@/components/server/DeleteConfirmationModal';
import { StatusModal } from '@/components/server/StatusModal';
import { ErrorState } from '@/components/server/ErrorState';
import { SuspendedState } from '@/components/server/SuspendedState';

export default function EditServerPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const {
    loading,
    server,
    form,
    remaining,
    exceeds,
    violations,
    error,
    saving,
    deleting,
    showDeleteModal,
    showSuccessModal,
    showErrorModal,
    successMessage,
    errorMessage,
    isFormValid,
    setForm,
    setShowDeleteModal,
    setShowSuccessModal,
    setShowErrorModal,
    handleSave,
    handleDelete,
  } = useServerEdit(id);

  if (loading) {
    return (
      <Shell>
        <EditServerSkeleton />
      </Shell>
    );
  }

  if (error && !server) {
    return (
      <Shell>
        <ErrorState error={error} />
      </Shell>
    );
  }

  if (server?.suspended || server?.status?.toLowerCase() === 'suspended') {
    return (
      <Shell>
        <SuspendedState
          serverId={server._id}
          action={
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-white px-8 py-3 text-base font-semibold hover:bg-gray-100 transition-colors"
            >
              Back to Dashboard
            </button>
          }
        />
      </Shell>
    );
  }

  if (server?.unreachable || server?.status === 'unreachable') {
    return (
      <Shell>
        <div className="p-6">
          <div className="text-center py-16 space-y-6">
            <div className="w-24 h-24 mx-auto bg-[#1a1a1a] rounded-full flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-[#AAAAAA] text-3xl"></i>
            </div>
            <div className="space-y-4 max-w-lg mx-auto text-center">
              <h3 className="text-2xl font-bold text-white">Server Unreachable</h3>
              <p className="text-[#AAAAAA]">This server is unreachable and cannot be edited. Contact admin for assistance.</p>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 text-left">
                <div className="text-[#AAAAAA] text-sm mb-1">Server ID for Support:</div>
                <div className="text-white font-mono text-sm break-all">{server._id}</div>
              </div>
            </div>
            <div>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-white px-8 py-3 text-base font-semibold hover:bg-gray-100 transition-colors"
              >
                Back to Servers
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-server text-white text-lg sm:text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Edit Server
            </h1>
            <p className="text-[#AAAAAA] text-base sm:text-lg">Update server configuration and resources</p>
          </div>
        </header>

        {/* Edit Server Form */}
        <EditServerForm
          form={form}
          remaining={remaining}
          exceeds={exceeds}
          violations={violations}
          error={error}
          saving={saving}
          isFormValid={isFormValid}
          onFormChange={setForm}
          onSubmit={handleSave}
          onDelete={() => setShowDeleteModal(true)}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          serverName={server?.name}
          deleting={deleting}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />

        {/* Success Modal */}
        <StatusModal
          isOpen={showSuccessModal}
          type="success"
          title="Success"
          message={successMessage}
          onClose={() => {
            setShowSuccessModal(false);
            router.push('/dashboard');
          }}
        />

        {/* Error Modal */}
        <StatusModal
          isOpen={showErrorModal}
          type="error"
          title="Error"
          message={errorMessage}
          onClose={() => setShowErrorModal(false)}
        />
      </div>
    </Shell>
  );
}


