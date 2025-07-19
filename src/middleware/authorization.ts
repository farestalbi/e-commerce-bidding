import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/ApiError';
import { UserRole } from '../entities/User';
import { AuthenticatedRequest } from '../types/custom';

export const authorization = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        throw new ForbiddenError('Authentication required');
      }

      // Check if user has any of the required roles
      if (!roles.includes(user.role)) {
        throw new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Convenience functions for common role checks
export const requireAdmin = authorization(UserRole.ADMIN);
export const requireUser = authorization(UserRole.USER);
export const requireAnyRole = authorization(UserRole.ADMIN, UserRole.USER); 