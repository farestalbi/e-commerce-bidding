import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { User } from '../entities/User';
import { asyncHandler } from '../utils/asyncHandler';
import { jwtSecret, frontendUrl } from '../config/env';
import { 
  BadRequestError, 
  AuthFailureError, 
  NotFoundError 
} from '../utils/ApiError';
import { AppDataSource } from '../config/database';

// Register new user
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  const userRepository = AppDataSource.getRepository(User);

  // Check if user already exists
  const existingUser = await userRepository.findOne({ where: { email } });
  if (existingUser) {
    throw new BadRequestError('User with this email already exists');
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create new user
  const user = userRepository.create({
    email,
    password: hashedPassword,
    firstName,
    lastName
  });

  await userRepository.save(user);

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    jwtSecret,
    { expiresIn: '7d' }
  );

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: userWithoutPassword,
      token
    }
  });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const userRepository = AppDataSource.getRepository(User);

  // Find user by email
  const user = await userRepository.findOne({ where: { email } });
  if (!user) {
    throw new AuthFailureError('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthFailureError('Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password || '');
  if (!isPasswordValid) {
    throw new AuthFailureError('Invalid email or password');
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    jwtSecret,
    { expiresIn: '7d' }
  );

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token
    }
  });
});

// Google OAuth login
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

// Google OAuth callback
export const googleAuthCallback = asyncHandler(async (req: Request, res: Response) => {
  passport.authenticate('google', { session: false }, async (err: any, user: any) => {
    if (err) {
      throw new AuthFailureError('Google authentication failed');
    }

    if (!user) {
      throw new AuthFailureError('Google authentication failed');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userWithoutPassword))}`);
  })(req, res);
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  // User is already attached by auth middleware
  const user = req.user;

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user as any;

  res.json({
    success: true,
    data: {
      user: userWithoutPassword
    }
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, avatar } = req.body;
  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository.findOne({ 
    where: { id: (req.user as any).id } 
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Update user fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (avatar) user.avatar = avatar;

  await userRepository.save(user);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: userWithoutPassword
    }
  });
}); 