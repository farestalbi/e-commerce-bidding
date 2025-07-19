# E-commerce Backend API

A robust e-commerce backend built with Node.js, Express, TypeScript, TypeORM, and PostgreSQL. Supports both fixed-price sales and auction-style bidding.

## Features

- **User Authentication**: Email/password registration and login with JWT tokens
- **Google OAuth**: Social login with Google
- **User Management**: Profile management and social login support
- **Product Management**: Support for both fixed-price and auction products (coming soon)
- **Bidding System**: Real-time auction bidding with validation (coming soon)
- **Payment Integration**: MyFatoorah payment gateway integration (coming soon)
- **Notifications**: Firebase Cloud Messaging for push notifications (coming soon)

## Tech Stack

- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **OAuth**: Passport.js with Google OAuth 2.0
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, rate limiting

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn
- Google OAuth 2.0 credentials

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
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
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your-password
   DB_NAME=ecommerce
   JWT_SECRET=your-super-secret-jwt-key
   
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Frontend URL for OAuth callback
   FRONTEND_URL=http://localhost:3000
   ```

4. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE ecommerce;
   ```

5. **Set up Google OAuth 2.0**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)
   - Copy Client ID and Client Secret to your `.env` file

6. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

## API Documentation

### Authentication Endpoints

**Note**: All users are created with `role: "user"` by default. Admin users must be manually updated in the database to have `role: "admin"`.

#### Register User

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isEmailVerified": false,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isEmailVerified": false,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

#### Google OAuth Login
```http
GET /api/auth/google
```

This will redirect to Google OAuth consent screen. After successful authentication, user will be redirected to:
```
FRONTEND_URL/auth/callback?token=JWT_TOKEN&user=USER_DATA
```

#### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isEmailVerified": false,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Update User Profile
```http
PUT /api/auth/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "avatar": "https://example.com/avatar.jpg",
      "role": "user",
      "isEmailVerified": false,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Product Management Endpoints

**Note**: Product creation, update, and deletion require admin role. The API uses flexible role-based authorization that supports single or multiple role requirements.

#### Get All Products
```http
GET /api/products?page=1&limit=10&type=fixed_price&status=active&category=electronics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "iPhone 15",
        "description": "Latest iPhone model",
        "type": "fixed_price",
        "status": "active",
        "price": 999.99,
        "stockQuantity": 10,
        "category": "electronics",
        "viewCount": 150,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### Get Product by ID
```http
GET /api/products/{id}
```

#### Create Product (Admin Only)
```http
POST /api/products
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "iPhone 15",
  "description": "Latest iPhone model",
  "type": "fixed_price",
  "price": 999.99,
  "stockQuantity": 10,
  "category": "electronics",
  "imageUrl": "https://example.com/iphone.jpg"
}
```

#### Update Product (Admin Only)
```http
PUT /api/products/{id}
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "price": 1099.99
}
```

#### Delete Product (Admin Only)
```http
DELETE /api/products/{id}
Authorization: Bearer <admin-jwt-token>
```

### Bidding Endpoints

#### Place Bid
```http
POST /api/bids/product/{productId}
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "amount": 150.00
}
```

#### Get Bid History
```http
GET /api/bids/product/{productId}
```

#### Get User Bids
```http
GET /api/bids/user
Authorization: Bearer <jwt-token>
```

#### Cancel Bid
```http
DELETE /api/bids/{bidId}
Authorization: Bearer <jwt-token>
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "E-commerce API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## Authorization System

The API uses a flexible role-based authorization system that supports both single and multiple role requirements:

### Usage Examples:

```typescript
// Admin only
authorization(UserRole.ADMIN)

// User only  
authorization(UserRole.USER)

// Either Admin or User
authorization(UserRole.ADMIN, UserRole.USER)

// Multiple roles (future expansion)
authorization(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
```

### Available Roles:
- `USER` - Regular authenticated users
- `ADMIN` - Administrative users with full access

### Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (invalid token)
- `404` - Not Found
- `500` - Internal Server Error

## Development

### Project Structure
```
src/
├── config/
│   ├── database.ts          # Database configuration
│   ├── env.ts               # Environment variables
│   └── passport.ts          # Passport OAuth configuration
├── controllers/
│   └── authController.ts     # Authentication controllers
├── entities/
│   └── User.ts              # User entity
├── middleware/
│   ├── auth.ts              # Authentication middleware
│   └── validation.ts        # Joi validation middleware
├── routes/
│   ├── index.ts             # Main routes index
│   └── auth/
│       ├── index.ts         # Auth routes
│       └── authSchema.ts    # Joi validation schemas
├── utils/
│   ├── ApiError.ts          # Custom error classes
│   ├── ApiResponse.ts       # Response utilities
│   └── asyncHandler.ts      # Async error handler utility
└── index.ts                 # Main application file
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Google OAuth 2.0 integration
- CORS protection
- Helmet security headers
- Input validation and sanitization
- **Flexible Role-Based Authorization** - Support for single or multiple role requirements
- Rate limiting (coming soon)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC 