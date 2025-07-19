import { UserRole } from '../entities/User';

export const hasRole = (user: any, role: UserRole): boolean => {
  return user && user.role === role;
};

export const hasAnyRole = (user: any, roles: UserRole[]): boolean => {
  return user && roles.includes(user.role);
};

export const isAdmin = (user: any): boolean => {
  return hasRole(user, UserRole.ADMIN);
};

export const isUser = (user: any): boolean => {
  return hasRole(user, UserRole.USER);
};

export const isAnyRole = (user: any): boolean => {
  return hasAnyRole(user, [UserRole.ADMIN, UserRole.USER]);
}; 