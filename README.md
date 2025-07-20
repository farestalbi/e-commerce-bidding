# E-Commerce API

A Node.js/TypeScript API for an e-commerce platform with auction functionality.

## Setup and Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd e-commerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your-password
   DB_NAME=ecommerce
   
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   SESSION_SECRET=your-super-secret-session-key
   
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   API_URL=http://localhost:3000
   
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY=your-firebase-private-key
   FIREBASE_CLIENT_EMAIL=your-firebase-client-email
   
   MYFATOORAH_API_KEY=your-myfatoorah-api-key
   MYFATOORAH_BASE_URL=https://api.myfatoorah.com
   
   AUCTION_CHECK_INTERVAl=5
   ```

4. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE ecommerce;
   ```

5. **Run database migrations**
   ```bash
   npm run typeorm migration:run
   ```

## How to Run the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The API will be running at `http://localhost:3000`

## API Documentation

You can view the complete API documentation by visiting:

**http://localhost:3000/api-docs**

This interactive documentation includes:
- All available endpoints
- Request/response examples
- Authentication requirements
- Error responses

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run typeorm` - Run TypeORM commands

## Features

- User authentication with JWT
- Google OAuth integration
- Product management (fixed price and auctions)
- Bidding system
- Order management
- Payment integration (MyFatoorah)
- Push notifications (Firebase)
- Admin dashboard
- Rate limiting and security

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── entities/        # Database entities
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
├── utils/           # Utility functions
└── index.ts         # Main entry point
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```