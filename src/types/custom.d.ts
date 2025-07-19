import { Request } from 'express';
import { User } from '../entities/User';

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface OptionalAuthenticatedRequest extends Request {
  user?: User;
} 