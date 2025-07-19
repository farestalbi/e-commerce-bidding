import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/env';
import { BadTokenError, AccessTokenError } from '../utils/ApiError';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AccessTokenError('Access token is required');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Fetch complete user data from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.userId } });
    
    if (!user) {
      throw new BadTokenError('User not found');
    }

    if (!user.isActive) {
      throw new BadTokenError('User account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (token) {
//     try {
//       const decoded = jwt.verify(token, jwtSecret) as any;
      
//       // Fetch complete user data from database
//       const userRepository = AppDataSource.getRepository(User);
//       const user = await userRepository.findOne({ where: { id: decoded.userId } });
      
//       if (user && user.isActive) {
//         req.user = user;
//       }
//     } catch (error) {
//       // Token is invalid, but we don't block the request
//     }
//   }

//   next();
// }; 