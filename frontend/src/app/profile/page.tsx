"use client";
import Shell from '@/components/Shell';
import { useProfile } from '@/hooks/useProfile';
import ProfileSkeleton from '@/components/skeletons/profile/ProfileSkeleton';
import { useState } from 'react';
import { useModal } from '@/components/Modal';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { form, setForm, loading, saving, error, success, saveProfile, updateEmail, updatePassword } = useProfile();
  const modal = useModal();
  const router = useRouter();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [showNameModal, setShowNameModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [draftUsername, setDraftUsername] = useState('');
  const [draftFirstName, setDraftFirstName] = useState('');
  const [draftLastName, setDraftLastName] = useState('');

  const deleteAccount = async () => {
    const confirmed = await modal.confirm({ 
      title: 'Delete Account', 
      body: 'Are you sure you want to permanently delete your account and all servers? This action cannot be undone. All your servers will be deleted from the Pterodactyl panel and your account will be removed from both the dashboard and the panel.',
      confirmText: 'Delete Account',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/profile`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json(); 
      if (!r.ok) throw new Error(d?.error || 'Failed to delete account');
      
      // Show success message with details
      await modal.success({ 
        title: 'Account Deleted', 
        body: d.message || 'Your account and all associated data have been deleted successfully.'
      });
      
      localStorage.removeItem('auth_token');
      router.push('/register');
    } catch (error: any) {
      await modal.error({ 
        title: 'Deletion Failed', 
        body: error.message || 'Failed to delete account. Please try again or contact support.'
      });
    }
  };

  return (
    <Shell>
      {loading ? (
        <ProfileSkeleton />
      ) : (
        <div className="p-6 space-y-6">
          {/* Header */}
          <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fas fa-user text-white text-lg sm:text-2xl"></i>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Profile</h1>
              <p className="text-[#AAAAAA] text-base sm:text-lg">Manage your account information</p>
            </div>
          </header>

          {/* Summary Card */}
          <div className="rounded-2xl p-6 flex items-center justify-between" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#202020] flex items-center justify-center text-white text-xl font-bold">
                {(form.firstName || form.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{`${form.firstName || ''} ${form.lastName || ''}`.trim() || form.username || 'User'}</h2>
                </div>
                <div className="text-sm text-[#AAAAAA]">{form.email || 'No email set'}</div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {form.coins !== undefined && (
                    <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-white/5">
                      <i className="fas fa-coins mr-1"></i>{form.coins} coins
                    </span>
                  )}
                  {form.joinedAt && (
                    <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-white/5">
                      Joined {new Date(form.joinedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2"></div>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-500 text-sm">{success}</div>}

          {/* Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              {/* Personal Information */}
              {/* Compact rows, no borders/dividers; inline pencil icons */}
              <div className="rounded-xl p-5 space-y-5" style={{ background: 'var(--surface)' }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#AAAAAA] uppercase tracking-wide">Username</div>
                    <div className="font-semibold flex items-center gap-2">
                      <span>{form.username || 'Not set'}</span>
                      <button aria-label="Edit username" onClick={() => { setDraftUsername(form.username); setShowUsernameModal(true); }} className="text-[#AAAAAA] hover:text-white text-xs">
                        <i className="fas fa-pen"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#AAAAAA] uppercase tracking-wide">Name</div>
                    <div className="font-semibold flex items-center gap-2">
                      <span>{`${form.firstName || ''} ${form.lastName || ''}`.trim() || 'Not set'}</span>
                      <button aria-label="Edit name" onClick={() => { setDraftFirstName(form.firstName || ''); setDraftLastName(form.lastName || ''); setShowNameModal(true); }} className="text-[#AAAAAA] hover:text-white text-xs">
                        <i className="fas fa-pen"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#AAAAAA] uppercase tracking-wide">Email</div>
                    <div className="font-semibold flex items-center gap-2">
                      <span>{form.email || 'Not set'}</span>
                      <button aria-label="Edit email" onClick={() => { setEmailDraft(form.email); setEmailPassword(''); setShowEmailModal(true); }} className="text-[#AAAAAA] hover:text-white text-xs">
                        <i className="fas fa-pen"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#AAAAAA] uppercase tracking-wide">Password</div>
                    <div className="font-semibold flex items-center gap-2">
                      <span>••••••••</span>
                      <button aria-label="Edit password" onClick={() => { setCurrentPassword(''); setNewPassword(''); setShowPasswordModal(true); }} className="text-[#AAAAAA] hover:text-white text-xs">
                        <i className="fas fa-pen"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security removed duplicate section */}
            </div>

            {/* Side panel: Danger zone */}
            <div className="space-y-6">
              <div className="rounded-xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <h3 className="text-lg font-bold mb-2">Danger Zone</h3>
                <p className="text-sm text-[#AAAAAA] mb-4">Delete your account and all servers. This action cannot be undone.</p>
                <button onClick={deleteAccount} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#ef4444] text-white hover:bg-[#dc2626] transition-colors w-full">Delete Account</button>
              </div>
            </div>
          </div>

          {/* Email Modal (styled like shared delete modal) */}
          {showEmailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/70" onClick={() => setShowEmailModal(false)}></div>
              <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <h3 className="text-lg font-semibold">Change Email</h3>
                  <button className="text-[#AAAAAA] hover:text-white" onClick={() => setShowEmailModal(false)} aria-label="Close">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="px-6 pb-6 grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#CCCCCC] mb-1">New Email</label>
                    <input type="email" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white placeholder-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#CCCCCC] mb-1">Current Password</label>
                    <input type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white placeholder-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent" placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex gap-3 px-6 pb-6">
                  <button onClick={() => setShowEmailModal(false)} className="flex-1 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors">Cancel</button>
                  <button onClick={async () => { await updateEmail(emailDraft, emailPassword); setShowEmailModal(false); }} className="flex-1 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors">Update Email</button>
                </div>
              </div>
            </div>
          )}

          {/* Name Modal */}
          {showNameModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/70" onClick={() => setShowNameModal(false)}></div>
              <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <h3 className="text-lg font-semibold">Edit Name</h3>
                  <button className="text-[#AAAAAA] hover:text-white" onClick={() => setShowNameModal(false)} aria-label="Close">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="px-6 pb-6 grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#CCCCCC] mb-1">First Name</label>
                      <input value={draftFirstName} onChange={(e) => setDraftFirstName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white placeholder-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#CCCCCC] mb-1">Last Name</label>
                      <input value={draftLastName} onChange={(e) => setDraftLastName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white placeholder-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 px-6 pb-6">
                  <button onClick={() => setShowNameModal(false)} className="flex-1 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors">Cancel</button>
                  <button onClick={async () => {
                    setForm({ ...form, firstName: draftFirstName, lastName: draftLastName });
                    await saveProfile();
                    setShowNameModal(false);
                    await modal.success({ title: 'Saved', body: 'Profile updated successfully.' });
                  }} className="flex-1 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors">Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* Username Modal */}
          {showUsernameModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/70" onClick={() => setShowUsernameModal(false)}></div>
              <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <h3 className="text-lg font-semibold">Edit Username</h3>
                  <button className="text-[#AAAAAA] hover:text-white" onClick={() => setShowUsernameModal(false)} aria-label="Close">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="px-6 pb-6 grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#CCCCCC] mb-1">Username</label>
                    <input value={draftUsername} onChange={(e) => setDraftUsername(e.target.value)} className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white placeholder-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent" />
                  </div>
                </div>
                <div className="flex gap-3 px-6 pb-6">
                  <button onClick={() => setShowUsernameModal(false)} className="flex-1 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors">Cancel</button>
                  <button onClick={async () => {
                    setForm({ ...form, username: draftUsername });
                    await saveProfile();
                    setShowUsernameModal(false);
                    await modal.success({ title: 'Saved', body: 'Username updated successfully.' });
                  }} className="flex-1 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors">Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* Password Modal (styled like shared delete modal) */}
          {showPasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/70" onClick={() => setShowPasswordModal(false)}></div>
              <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <h3 className="text-lg font-semibold">Change Password</h3>
                  <button className="text-[#AAAAAA] hover:text-white" onClick={() => setShowPasswordModal(false)} aria-label="Close">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="px-6 pb-6 grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#CCCCCC] mb-1">Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white placeholder-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#CCCCCC] mb-1">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white placeholder-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent" placeholder="Minimum 8 characters, include letters and numbers." />
                  </div>
                </div>
                <div className="flex gap-3 px-6 pb-6">
                  <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors">Cancel</button>
                  <button onClick={async () => { await updatePassword(currentPassword, newPassword); setShowPasswordModal(false); }} className="flex-1 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors">Update Password</button>
                </div>
              </div>
            </div>
          )}

          {/* Delete confirmation now handled with shared Modal component */}
        </div>
      )}
    </Shell>
  );
}


