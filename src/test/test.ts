import { User } from '../entities/User';
import { asyncHandler } from '../utils/asyncHandler';

// Simple test to verify imports work
console.log('User entity imported successfully');
console.log('asyncHandler utility imported successfully');

export const testFunction = asyncHandler(async (req: any, res: any) => {
  res.json({ message: 'Test successful' });
}); 