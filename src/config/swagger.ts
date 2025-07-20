import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { apiUrl } from "./env";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description:
        "E-Commerce backend API with auction and fixed-price products",
      contact: {
        name: "API Support",
        email: "support@ecommerce.com",
      },
    },
    servers: [
      {
        url: apiUrl,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "User ID",
              example: "user-123",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "user@example.com",
            },
            firstName: {
              type: "string",
              description: "User first name",
              example: "John",
            },
            lastName: {
              type: "string",
              description: "User last name",
              example: "Doe",
            },
            role: {
              type: "string",
              enum: ["USER", "ADMIN"],
              description: "User role",
              example: "USER",
            },
            isEmailVerified: {
              type: "boolean",
              description: "Email verification status",
              example: true,
            },
            isActive: {
              type: "boolean",
              description: "Account active status",
              example: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation date",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              description: "Error message",
              example: "Validation error",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    description: "Field name with error",
                    example: "email",
                  },
                  message: {
                    type: "string",
                    description: "Error message for the field",
                    example: "Email is required",
                  },
                },
              },
            },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Product ID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            name: {
              type: "string",
              description: "Product name",
              example: "iPhone 15 Pro",
            },
            description: {
              type: "string",
              description: "Product description",
              example: "Latest iPhone with advanced features",
            },
            type: {
              type: "string",
              enum: ["fixed_price", "auction"],
              description: "Product type",
              example: "fixed_price",
            },
            price: {
              type: "number",
              description: "Product price (for fixed_price products)",
              example: 999.99,
            },
            stockQuantity: {
              type: "integer",
              description:
                "Available stock quantity (for fixed_price products)",
              example: 10,
            },
            startingPrice: {
              type: "number",
              description: "Starting price for auction products",
              example: 500.0,
            },
            auctionEndTime: {
              type: "string",
              format: "date-time",
              description: "Auction end time",
              example: "2024-12-31T23:59:59.000Z",
            },

            category: {
              type: "string",
              description: "Product category",
              example: "Electronics",
            },
            imageUrl: {
              type: "string",
              format: "uri",
              description: "Product image URL",
              example: "https://example.com/image.jpg",
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "sold", "expired"],
              description: "Product status",
              example: "active",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Product creation date",
              example: "2024-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Product last update date",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Order ID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "User ID who placed the order",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            status: {
              type: "string",
              enum: [
                "pending",
                "confirmed",
                "shipped",
                "delivered",
                "cancelled",
              ],
              description: "Order status",
              example: "pending",
            },
            totalAmount: {
              type: "number",
              description: "Total order amount",
              example: 999.99,
            },
            shippingAddress: {
              type: "string",
              description: "Shipping address",
              example: "123 Main St, City, Country",
            },
            notes: {
              type: "string",
              description: "Order notes",
              example: "Please deliver in the morning",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Order creation date",
              example: "2024-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Order last update date",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        Bid: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Bid ID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "User ID who placed the bid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            productId: {
              type: "string",
              format: "uuid",
              description: "Product ID being bid on",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            amount: {
              type: "number",
              description: "Bid amount",
              example: 550.0,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Bid creation date",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
        AuctionStats: {
          type: "object",
          properties: {
            totalAuctions: {
              type: "integer",
              description: "Total number of auctions",
              example: 150,
            },
            activeAuctions: {
              type: "integer",
              description: "Number of active auctions",
              example: 45,
            },
            totalBids: {
              type: "integer",
              description: "Total number of bids placed",
              example: 1250,
            },
            totalRevenue: {
              type: "number",
              description: "Total revenue from auctions",
              example: 25000.0,
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"],
};

export const specs = swaggerJsdoc(options);
export const swaggerUiOptions = {
  explorer: true,
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "E-Commerce API Documentation",
};
