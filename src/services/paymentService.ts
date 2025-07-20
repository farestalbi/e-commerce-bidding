import axios from 'axios';
import { myFatoorahApiKey, myFatoorahBaseUrl } from '../config/env';
import { Order, OrderStatus } from '../entities/Order';
import { BadRequestError, InternalError } from '../utils/ApiError';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  language?: 'EN' | 'AR';
  currency?: 'KWD' | 'USD' | 'EUR' | 'SAR' | 'BHD' | 'AED' | 'QAR' | 'OMR' | 'JOD' | 'EGP';
}

export interface PaymentResponse {
  isSuccess: boolean;
  message: string;
  validationErrors?: any[];
  data: {
    invoiceId: number;
    isDirectPayment: boolean;
    paymentURL: string;
    paymentId: number;
    paymentMethod: string;
  };
}

export interface PaymentStatusResponse {
  isSuccess: boolean;
  message: string;
  data: {
    invoiceId: number;
    invoiceStatus: string;
    invoiceTransactions: any[];
  };
}

export class PaymentService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = myFatoorahApiKey || '';
    this.baseUrl = myFatoorahBaseUrl || 'https://api.myfatoorah.com';
    
    // Ensure base URL doesn't end with slash
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
    
    if (!this.apiKey) {
      console.warn('MyFatoorah API key is not configured. Payments will not work.');
    }
  }

  /**
   * Create payment session with MyFatoorah
   */
  async createPaymentSession(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('Payment service configuration:', {
        apiKey: this.apiKey ? 'Configured' : 'Not configured',
        baseUrl: this.baseUrl,
        isConfigured: this.isConfigured()
      });

      if (!this.apiKey) {
        throw new BadRequestError('Payment service is not configured - MYFATOORAH_API_KEY is missing');
      }

      const payload = {
        InvoiceAmount: paymentRequest.amount,
        CurrencyIso: paymentRequest.currency || 'USD',
        CustomerName: paymentRequest.customerName,
        CustomerEmail: paymentRequest.customerEmail,
        CustomerPhone: paymentRequest.customerPhone,
        Language: paymentRequest.language || 'EN',
        CustomerReference: paymentRequest.orderId,
        CustomerCivilId: '',
        UserDefinedField: paymentRequest.orderId,
        ExpireDate: '',
        CustomerAddress: {
          Block: '',
          Street: '',
          HouseBuildingNo: '',
          Address: paymentRequest.customerAddress || '',
        },
        InvoiceItems: [
          {
            ItemName: `Order ${paymentRequest.orderId}`,
            Quantity: 1,
            UnitPrice: paymentRequest.amount,
          },
        ],
      };

      console.log('Payment request payload:', JSON.stringify(payload, null, 2));
      const paymentUrl = `${this.baseUrl}/v2/InitiatePayment`;
      console.log('Making request to:', paymentUrl);
      console.log('Base URL:', this.baseUrl);
      console.log('Full URL:', paymentUrl);

      const response = await axios.post(
        paymentUrl,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('MyFatoorah response status:', response.status);
      console.log('MyFatoorah response data:', JSON.stringify(response.data, null, 2));

      const data = response.data;

      if (!data.IsSuccess) {
        console.error('MyFatoorah error response:', data);
        throw new BadRequestError(data.Message || 'Payment session creation failed');
      }

      return {
        isSuccess: true,
        message: 'Payment session created successfully',
        data: {
          invoiceId: data.Data.InvoiceId,
          isDirectPayment: data.Data.IsDirectPayment,
          paymentURL: data.Data.PaymentURL,
          paymentId: data.Data.PaymentId,
          paymentMethod: data.Data.PaymentMethod,
        },
      };

    } catch (error) {
      console.error('Payment session creation error:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
          }
        });
        
        if (error.response?.status === 401) {
          throw new BadRequestError('Invalid MyFatoorah API key');
        } else if (error.response?.status === 400) {
          throw new BadRequestError(`MyFatoorah validation error: ${error.response.data?.Message || 'Invalid request'}`);
        } else if (error.response?.status === 404) {
          throw new BadRequestError('MyFatoorah API endpoint not found. Please check the API URL configuration.');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new BadRequestError('Unable to connect to MyFatoorah service');
        } else if (error.code === 'ETIMEDOUT') {
          throw new BadRequestError('MyFatoorah service timeout');
        }
      }
      
      if (error instanceof BadRequestError) {
        throw error;
      }
      
      throw new InternalError(`Failed to create payment session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payment status from MyFatoorah
   */
  async getPaymentStatus(invoiceId: number): Promise<PaymentStatusResponse> {
    try {
      if (!this.apiKey) {
        throw new BadRequestError('Payment service is not configured');
      }

      const response = await axios.get(
        `${this.baseUrl}/v2/getPaymentStatus`,
        {
          params: { Key: invoiceId, KeyType: 'InvoiceId' },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const data = response.data;

      if (!data.IsSuccess) {
        throw new BadRequestError(data.Message || 'Failed to get payment status');
      }

      return {
        isSuccess: true,
        message: 'Payment status retrieved successfully',
        data: {
          invoiceId: data.Data.InvoiceId,
          invoiceStatus: data.Data.InvoiceStatus,
          invoiceTransactions: data.Data.InvoiceTransactions || [],
        },
      };

    } catch (error) {
      console.error('Payment status check error:', error);
      
      if (error instanceof BadRequestError) {
        throw error;
      }
      
      throw new InternalError('Failed to get payment status');
    }
  }

  /**
   * Process payment callback from MyFatoorah
   */
  async processPaymentCallback(callbackData: any): Promise<{
    isSuccess: boolean;
    orderId: string;
    status: string;
  }> {
    try {
      // Extract order ID from callback data
      const orderId = callbackData.CustomerReference || callbackData.UserDefinedField;
      const paymentStatus = callbackData.InvoiceStatus;
      const invoiceId = callbackData.InvoiceId;

      if (!orderId) {
        throw new BadRequestError('Order ID not found in callback data');
      }

      // Map MyFatoorah status to our order status
      let orderStatus: OrderStatus;
      switch (paymentStatus) {
        case 'Paid':
          orderStatus = OrderStatus.PAID;
          break;
        case 'Failed':
          orderStatus = OrderStatus.FAILED;
          break;
        case 'Pending':
          orderStatus = OrderStatus.PENDING_PAYMENT;
          break;
        default:
          orderStatus = OrderStatus.FAILED;
      }

      return {
        isSuccess: true,
        orderId,
        status: orderStatus,
      };

    } catch (error) {
      console.error('Payment callback processing error:', error);
      throw error;
    }
  }

  /**
   * Validate payment configuration
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.baseUrl;
  }
} 