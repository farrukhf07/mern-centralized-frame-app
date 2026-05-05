import { ROLES } from '../constants/roles';

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
};

export const isadmin = (user) => String(user?.role || '').toLowerCase() === ROLES.admin;

export const ismanager = (user) => String(user?.role || '').toLowerCase() === ROLES.manager;

export const isUser = (user) => String(user?.role || '').toLowerCase() === ROLES.USER;

export const hasAppAccess = (user, appId) => {
  if (!appId || !user) return false;
  if (isadmin(user)) return true;
  if (!ismanager(user)) return false;

  const normalizedAppId = normalizeId(appId);
  return (user.excess || []).some((assigned) => normalizeId(assigned) === normalizedAppId);
};

export const canManageAppResources = (user, appId) => isadmin(user) || hasAppAccess(user, appId);
