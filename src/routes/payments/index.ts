import { Router } from 'express';
import { 
  handlePaymentCallback
} from '../../controllers/paymentController';

const router = Router();

// MyFatoorah webhook callback (public endpoint)

/**
 * @swagger
 * /api/payments/callback:
 *   post:
 *     summary: MyFatoorah payment webhook callback
 *     tags: [Payments]
 *     description: Webhook endpoint for MyFatoorah payment gateway callbacks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: MyFatoorah webhook payload
 *             example:
 *               {
 *                 "InvoiceId": 123456,
 *                 "InvoiceStatus": "Paid",
 *                 "InvoiceReference": "REF123456",
 *                 "CustomerReference": "CUST123",
 *                 "TransactionId": "TXN789",
 *                 "TransactionStatus": "SUCCESS",
 *                 "Amount": 100.00,
 *                 "Currency": "USD"
 *               }
 *     responses:
 *       200:
 *         description: Payment callback processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment callback processed successfully
 *       400:
 *         description: Invalid webhook payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/callback', handlePaymentCallback);

export default router; 