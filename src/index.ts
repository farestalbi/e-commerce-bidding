import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import { AppDataSource } from './config/database';
import { port, environment, sessionSecret } from './config/env';
import routes from './routes';
import { ApiError } from './utils/ApiError';
import passport from './config/passport';
import { AppInitializer } from './services/appInitializer';
import swaggerUi from 'swagger-ui-express';
import { specs, swaggerUiOptions } from './config/swagger';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: environment === 'production' }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'E-commerce API is running',
    timestamp: new Date().toISOString(),
    environment: environment
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  // Handle custom ApiError classes
  if (err instanceof ApiError) {
    return ApiError.handle(err, res);
  }
  
  // Handle other errors
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: environment === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database and start server
AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected successfully');
    
    // Initialize application services (including auction scheduler)
    await AppInitializer.initialize();
    
    app.listen(port, () => {
      console.log(`Server is running on port ${port} in ${environment} mode`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await AppInitializer.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await AppInitializer.shutdown();
  process.exit(0);
}); 