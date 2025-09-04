"use client";
import Shell from '@/components/Shell';
import { useParams, useRouter } from 'next/navigation';
import { EditServerSkeleton } from '@/components/skeletons/server/EditServerSkeleton';
import { useServerEdit } from '@/hooks/useServerEdit';
import { EditServerForm } from '@/components/server/EditServerForm';
import { DeleteConfirmationModal } from '@/components/server/DeleteConfirmationModal';
import { StatusModal } from '@/components/server/StatusModal';
import { ErrorState } from '@/components/server/ErrorState';
import { SuspendedServerState } from '@/components/server/SuspendedServerState';

export default function EditServerPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const {
    // State
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
    
    // Computed values
    isFormValid,
    
    // Actions
    setForm,
    setShowDeleteModal,
    setShowSuccessModal,
    setShowErrorModal,
    handleSave,
    handleDelete,
  } = useServerEdit(id);

  // Show skeleton while loading
  if (loading) {
    return (
      <Shell>
        <EditServerSkeleton />
      </Shell>
    );
  }

  // Show error state
  if (error && !server) {
    return (
      <Shell>
        <ErrorState error={error} />
      </Shell>
    );
  }

  // Check if server is suspended
  if (server?.status?.toLowerCase() === 'suspended') {
    return (
      <Shell>
        <SuspendedServerState />
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
            // Redirect to dashboard after success
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


