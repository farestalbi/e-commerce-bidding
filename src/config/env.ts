import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

// Server Configuration
export const environment = process.env.NODE_ENV || "development";
export const port = parseInt(process.env.PORT || "3000");

// Database Configuration
export const dbHost = process.env.DB_HOST || "localhost";
export const dbPort = parseInt(process.env.DB_PORT || "5432");
export const dbUsername = process.env.DB_USERNAME || "postgres";
export const dbPassword = process.env.DB_PASSWORD || "";
export const dbName = process.env.DB_NAME || "ecommerce";

// JWT Configuration
export const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

// OAuth Configuration
export const googleClientId = process.env.GOOGLE_CLIENT_ID;
export const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
export const githubClientId = process.env.GITHUB_CLIENT_ID;
export const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

// Frontend Configuration
export const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

// Firebase Configuration (for later use)
export const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
export const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;
export const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;

// MyFatoorah Configuration (for later use)
export const myFatoorahApiKey = process.env.MYFATOORAH_API_KEY;
export const myFatoorahBaseUrl = process.env.MYFATOORAH_BASE_URL || "https://api.myfatoorah.com"; 