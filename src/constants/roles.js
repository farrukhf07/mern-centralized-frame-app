export const ROLES = Object.freeze({
  admin: 'admin',
  manager: 'manager',
  USER: 'user',
});

export const MANAGEABLE_ROLES = [ROLES.manager, ROLES.USER, ROLES.admin];
