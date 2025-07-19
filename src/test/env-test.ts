import { 
  environment, 
  port, 
  dbHost, 
  dbPort, 
  dbUsername, 
  dbName, 
  jwtSecret 
} from '../config/env';

// Test environment configuration
console.log('Environment Configuration Test:');
console.log('NODE_ENV:', environment);
console.log('PORT:', port);
console.log('DB_HOST:', dbHost);
console.log('DB_PORT:', dbPort);
console.log('DB_USERNAME:', dbUsername);
console.log('DB_NAME:', dbName);
console.log('JWT_SECRET:', jwtSecret ? '***SET***' : 'NOT SET');

console.log('✅ Environment configuration loaded successfully'); 