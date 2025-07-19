import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AppDataSource } from './database';
import { User } from '../entities/User';
import { googleClientId, googleClientSecret } from './env';

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: googleClientId || '',
      clientSecret: googleClientSecret || '',
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userRepository = AppDataSource.getRepository(User);
        
        // Check if user already exists with this Google ID
        let user = await userRepository.findOne({
          where: { googleId: profile.id }
        });

        if (!user) {
          // Check if user exists with the same email
          user = await userRepository.findOne({
            where: { email: profile.emails?.[0]?.value }
          });

          if (user) {
            // Update existing user with Google ID
            user.googleId = profile.id;
            user.isEmailVerified = true;
            await userRepository.save(user);
          } else {
            // Create new user
            user = userRepository.create({
              email: profile.emails?.[0]?.value || '',
              firstName: profile.name?.givenName || '',
              lastName: profile.name?.familyName || '',
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value,
              isEmailVerified: true,
              isActive: true
            });
            await userRepository.save(user);
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport; 