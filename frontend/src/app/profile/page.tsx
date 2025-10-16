"use client";
import Shell from '@/components/Shell';
import { useProfile } from '@/hooks/useProfile';
import { useAuthSettings } from '@/hooks/useAuthSettings';
import ProfileSkeleton from '@/components/skeletons/profile/ProfileSkeleton';
import { useState } from 'react';
import { useModal } from '@/components/Modal';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { form, setForm, loading, saving, error, success, saveProfile, updateEmail, updatePassword, updateProfilePicture } = useProfile();
  const { settings: authSettings } = useAuthSettings();
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
              {form.profilePicture ? (
                <img 
                  src={form.profilePicture} 
                  alt={form.username || 'User'} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#404040]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'w-14 h-14 rounded-full bg-[#202020] flex items-center justify-center text-white text-xl font-bold';
                    fallback.textContent = (form.firstName || form.username || 'U').charAt(0).toUpperCase();
                    e.currentTarget.parentElement?.appendChild(fallback);
                  }}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#202020] flex items-center justify-center text-white text-xl font-bold">
                  {(form.firstName || form.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{`${form.firstName || ''} ${form.lastName || ''}`.trim() || form.username || 'User'}</h2>
                </div>
                <div className="text-sm text-[#AAAAAA]">{form.email || 'No email set'}</div>
                {form.loginMethod === 'email' && (
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-md border flex items-center gap-1 ${
                      form.emailVerified 
                        ? 'border-green-500/30 bg-green-500/10 text-green-400' 
                        : 'border-red-500/30 bg-red-500/10 text-red-400'
                    }`}>
                      <i className={`fas ${form.emailVerified ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                      {form.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                    </span>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {form.coins !== undefined && (
                    <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-white/5">
                      <i className="fas fa-coins mr-1"></i>{form.coins} coins
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-white/5 flex items-center gap-1 text-white">
                    {form.loginMethod === 'discord' ? (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    ) : form.loginMethod === 'google' ? (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    ) : (
                      <i className="fas fa-envelope"></i>
                    )}
                    {form.loginMethod === 'discord' ? 'Discord' : form.loginMethod === 'google' ? 'Google' : 'Email'}
                  </span>
                  {form.loginMethod === 'discord' && (form as any)?.oauthProviders?.discord?.id && (
                    <span className="px-2 py-1 rounded-md border border-[var(--border)] bg-white/5">
                      <i className="fas fa-id-badge mr-1"></i>ID: {(form as any).oauthProviders.discord.id}
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

          {/* Discord Server Join Section */}
          {form.loginMethod === 'discord' && (
            <div className="bg-gradient-to-r from-[#5865F2] to-[#4752C4] rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <i className="fab fa-discord text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Join Our Discord Server</h3>
                  <p className="text-white/80 text-sm">Connect with the community and get support</p>
                </div>
              </div>
              <button
                onClick={() => {
                  alert('Discord server auto-join is handled during login. If you need to rejoin, please contact an administrator.');
                }}
                className="bg-white text-[#5865F2] px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
              >
                <i className="fab fa-discord mr-2"></i>
                Join Discord Server
              </button>
            </div>
          )}

          {/* Profile Picture Section - Only for Email Users */}
          {form.loginMethod === 'email' && (
            <div className="rounded-xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {form.profilePicture ? (
                    <img 
                      src={form.profilePicture} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-2 border-[#404040]"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'w-24 h-24 rounded-full bg-[#202020] flex items-center justify-center text-white text-3xl font-bold';
                        fallback.textContent = (form.firstName || form.username || 'U').charAt(0).toUpperCase();
                        e.currentTarget.parentElement?.appendChild(fallback);
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#202020] flex items-center justify-center text-white text-3xl font-bold">
                      {(form.firstName || form.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">Profile Picture</h3>
                  <p className="text-sm text-[#AAAAAA] mb-4">
                    Set a profile picture URL. Must be a valid image link (JPG, PNG, GIF, WEBP, or SVG).
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Enter image URL"
                      value={form.profilePicture}
                      onChange={(e) => setForm({ ...form, profilePicture: e.target.value })}
                      className="input flex-1"
                    />
                    <button
                      onClick={async () => {
                        try {
                          await updateProfilePicture(form.profilePicture);
                        } catch (e) {
                          // Error already handled by updateProfilePicture
                        }
                      }}
                      disabled={saving}
                      className="px-4 py-2 rounded-md bg-white text-black border border-[var(--border)] hover:bg-[#f0f0f0] disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    {form.profilePicture && (
                      <button
                        onClick={async () => {
                          setForm({ ...form, profilePicture: '' });
                          await updateProfilePicture('');
                        }}
                        disabled={saving}
                        className="px-4 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    {form.loginMethod === 'email' && !form.emailVerified && (
                      <div className="mt-2">
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('auth_token');
                              if (!token) return;
                              const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/verify/resend`, {
                                method: 'POST',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}` 
                                },
                                body: JSON.stringify({ email: form.email }) // Fix: Include email in request body
                              });
                              if (res.ok) {
                                alert('Verification email sent! Please check your inbox.');
                              } else {
                                const data = await res.json();
                                const errorMessage = data.details 
                                  ? `${data.error}: ${data.details}` 
                                  : data.error || 'Failed to send verification email';
                                alert(errorMessage);
                              }
                            } catch (error) {
                              alert('Failed to send verification email');
                            }
                          }}
                          className="text-xs px-3 py-1 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                          <i className="fas fa-paper-plane mr-1"></i>
                          Resend Verification Email
                        </button>
                      </div>
                    )}
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
                    <input type="email" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white placeholder-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent" placeholder="your@email.com" />
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


