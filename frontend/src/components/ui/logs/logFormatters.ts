import { formatKeyToLabel } from './logHelpers';

export function resolveFieldLabel(
  messages: Record<string, unknown> | undefined,
  rawKey: string
): string {
  const leaf = rawKey.split('.').pop() || rawKey;
  const translateKey = leaf === 'code' ? 'referralCode' : leaf;

  const uiMessages = messages?.UI as Record<string, unknown> | undefined;
  const commonMessages = messages?.Common as Record<string, unknown> | undefined;
  const profileMessages = messages?.Profile as Record<string, unknown> | undefined;

  const uiFieldKey = `field_${translateKey}`;
  if (uiMessages && typeof uiMessages[uiFieldKey] === 'string') {
    return uiMessages[uiFieldKey] as string;
  }
  if (commonMessages && typeof commonMessages[translateKey] === 'string') {
    return commonMessages[translateKey] as string;
  }
  if (uiMessages && typeof uiMessages[translateKey] === 'string') {
    return uiMessages[translateKey] as string;
  }
  if (profileMessages && typeof profileMessages[translateKey] === 'string') {
    return profileMessages[translateKey] as string;
  }

  return formatKeyToLabel(rawKey);
}

export function formatMetaValue(
  key: string,
  strValue: string,
  messages: Record<string, unknown> | undefined
): string {
  const leaf = key.split('.').pop() || key;
  const commonMessages = messages?.Common as Record<string, unknown> | undefined;
  const uiMessages = messages?.UI as Record<string, unknown> | undefined;

  if (leaf === 'loginMethod' || leaf === 'provider' || leaf === 'oauthProvider') {
    const lower = strValue.toLowerCase();
    if (lower === 'email') {
      return (
        (typeof uiMessages?.field_emailMethod === 'string'
          ? (uiMessages.field_emailMethod as string)
          : undefined) ||
        (typeof commonMessages?.email === 'string' ? (commonMessages.email as string) : 'Email')
      );
    }
    if (lower === 'discord') return 'Discord';
    if (lower === 'google') return 'Google';
    if (lower === 'github') return 'GitHub';
  }

  if (leaf === 'role' || leaf === 'targetRole' || leaf === 'adminRole') {
    const lower = strValue.toLowerCase();
    if (lower === 'admin' && typeof commonMessages?.admin === 'string') {
      return commonMessages.admin as string;
    }
    if (lower === 'user' && typeof commonMessages?.user === 'string') {
      return commonMessages.user as string;
    }
    if (lower === 'system' && typeof commonMessages?.system === 'string') {
      return commonMessages.system as string;
    }
  }

  if (leaf === 'status' || leaf === 'targetStatus') {
    const lower = strValue.toLowerCase();
    if (lower === 'queued') {
      return (
        (typeof uiMessages?.statusQueued === 'string' ? (uiMessages.statusQueued as string) : undefined) ||
        (typeof commonMessages?.queued === 'string' ? (commonMessages.queued as string) : undefined) ||
        'Queued'
      );
    }
    if (lower === 'creating') {
      return (
        (typeof commonMessages?.creating === 'string' ? (commonMessages.creating as string) : undefined) ||
        (typeof uiMessages?.statusCreating === 'string' ? (uiMessages.statusCreating as string) : undefined) ||
        'Creating'
      );
    }
    if (lower === 'active' && typeof commonMessages?.active === 'string') {
      return commonMessages.active as string;
    }
  }

  return strValue;
}
