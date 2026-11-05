import { adminUsersApi } from '@/utils/api/adminUsers';
import type { Dispatch, SetStateAction } from 'react';
import type { UserFormData, UserResources, UserBanData, UserReferralData } from './types';

interface MutationDeps {
  id: string;
  getAuthToken: () => string;
  loadUser: (refPage?: number, forceInitial?: boolean) => Promise<void>;
  loadActivity: (page?: number) => Promise<void>;
  referralPage: number;
  activityPage: number;
  setUserForm: Dispatch<SetStateAction<UserFormData>>;
  setResources: Dispatch<SetStateAction<UserResources>>;
  setBan: Dispatch<SetStateAction<UserBanData | null>>;
  setReferral: Dispatch<SetStateAction<UserReferralData | null>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
}

export function useAdminUserMutations(deps: MutationDeps) {
  const {
    id,
    getAuthToken,
    loadUser,
    loadActivity,
    referralPage,
    activityPage,
    setUserForm,
    setResources,
    setBan,
    setReferral,
    setSaving,
  } = deps;

  const updateUser = async (payload: Record<string, unknown>) => {
    const token = getAuthToken();
    const { res, data: resData } = await adminUsersApi.updateUser(id, payload, token);
    if (!res.ok) {
      const firstError = resData.details?.fieldErrors
        ? String(Object.values(resData.details.fieldErrors).flat()[0])
        : resData.error || resData.code || 'ERR_UPDATE_USER_FAILED';
      throw new Error(firstError);
    }
    setUserForm((prev) => ({ ...prev, ...payload }));
    return resData;
  };

  const updateRole = async (newRole: string) => {
    const token = getAuthToken();
    const { res, data: resData } = await adminUsersApi.updateUser(id, { role: newRole }, token);
    if (!res.ok) throw new Error(resData?.error || resData?.code || 'ERR_UPDATE_ROLE_FAILED');
    setUserForm((prev) => ({ ...prev, role: newRole }));
    return resData;
  };

  const updateResources = async (newResources: Record<string, number>) => {
    const token = getAuthToken();
    const { res, data: resData } = await adminUsersApi.updateUser(id, { resources: newResources }, token);
    if (!res.ok) throw new Error(resData?.error || resData?.code || 'ERR_UPDATE_RESOURCES_FAILED');
    setResources(newResources);
    await loadUser(referralPage, false);
    return resData;
  };

  const checkUsername = async (username: string) => {
    const token = getAuthToken();
    return adminUsersApi.checkUsername(username, token);
  };

  const banUser = async (payload: { isBanned: boolean; reason?: string; durationMinutes?: number; until?: string | null }) => {
    const token = getAuthToken();
    const r = await adminUsersApi.banUser(id, payload, token);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(d.error || d.code || 'ERR_BAN_USER_FAILED');
    }
    if (d?.ban) {
      setBan(d.ban);
    } else {
      setBan({ isBanned: true, reason: payload.reason || '', until: payload.until || null });
    }
    await Promise.all([
      loadUser(referralPage, false),
      loadActivity(activityPage),
    ]);
  };

  const unbanUser = async () => {
    const token = getAuthToken();
    const r = await adminUsersApi.banUser(id, { isBanned: false }, token);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || d.code || 'ERR_UNBAN_USER_FAILED');
    }
    setBan({ isBanned: false, reason: '', until: null });
    await Promise.all([
      loadUser(referralPage, false),
      loadActivity(activityPage),
    ]);
  };

  const addPlan = async (planId: string, months = 1) => {
    const token = getAuthToken();
    const { res, data: resData } = await adminUsersApi.addPlan(id, { planId, months }, token);
    if (!res.ok) throw new Error(resData?.error || resData?.code || 'ERR_ADD_PLAN_FAILED');
    await loadUser(referralPage, false);
    return resData;
  };

  const removePlan = async (planId: string) => {
    const token = getAuthToken();
    const r = await adminUsersApi.removePlan(id, planId, token);
    if (!r.ok) throw new Error('ERR_REMOVE_PLAN_FAILED');
    await loadUser(referralPage, false);
  };

  const removePlanInstance = async (instanceId: string) => {
    const token = getAuthToken();
    const r = await adminUsersApi.removePlanInstance(id, instanceId, token);
    if (!r.ok) throw new Error('ERR_REMOVE_PLAN_INSTANCE_FAILED');
    await loadUser(referralPage, false);
  };

  const deleteServer = async (serverId: string) => {
    const token = getAuthToken();
    const { res, data: resData } = await adminUsersApi.deleteServer(serverId, token);
    if (!res.ok) throw new Error(resData?.error || resData?.code || 'ERR_DELETE_SERVER_FAILED');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('servers:update'));
    }
    await loadUser(referralPage, false);
  };

  const saveReferralCode = async (newCode: string) => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const { res: r, data: d } = await adminUsersApi.updateReferralCode(id, newCode, token);
      if (!r.ok) throw new Error(d?.error || d?.code || 'ERR_SAVE_REFERRAL_CODE_FAILED');
      const updatedCode = d?.user?.referralCode || newCode;
      setReferral((prev) => (prev ? { ...prev, code: updatedCode } : null));
      setUserForm((prev) => ({ ...prev, referralCode: updatedCode }));
      await loadUser(referralPage, false);
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ERR_SAVE_REFERRAL_CODE_FAILED';
      return { success: false, error: msg };
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    try {
      const token = getAuthToken();
      const { res: r, data: d } = await adminUsersApi.deleteUser(id, token);
      if (!r.ok) throw new Error(d?.error || d?.code || 'ERR_DELETE_USER_FAILED');
      return { success: true, message: d?.code || 'SUCCESS_USER_DELETED' };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ERR_DELETE_USER_FAILED';
      return { success: false, error: msg };
    }
  };

  return {
    updateUser,
    updateRole,
    updateResources,
    checkUsername,
    banUser,
    unbanUser,
    addPlan,
    removePlan,
    removePlanInstance,
    deleteServer,
    saveReferralCode,
    deleteUser,
  };
}
