/**
 * Mock Payment Service
 * Simulates payment processing and escrow functionality
 * In production, this would integrate with real payment gateways like Razorpay/Stripe
 */

const { Order } = require('../models');

class PaymentService {
  constructor() {
    this.escrowAccounts = new Map();
  }

  // Generate a mock transaction ID
  generateTransactionId() {
    return 'txn_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate a mock payment token
  generatePaymentToken() {
    return 'pay_' + Math.random().toString(36).substr(2, 9);
  }

  // Calculate platform commission (0.5%)
  calculateCommission(amount) {
    return parseFloat((amount * 0.005).toFixed(2));
  }

  // Process initial payment and hold in escrow
  async processPayment(orderId, amount) {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const transactionId = this.generateTransactionId();
      const paymentToken = this.generatePaymentToken();

      // Calculate platform commission
      const commission = this.calculateCommission(amount);
      const escrowAmount = amount - commission;

      // Store in escrow
      this.escrowAccounts.set(orderId, {
        amount: escrowAmount,
        commission,
        transactionId,
        paymentToken,
        status: 'held',
        createdAt: new Date()
      });

      return {
        success: true,
        transactionId,
        paymentToken,
        escrowAmount,
        commission,
        message: 'Payment processed and held in escrow'
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: 'Payment processing failed'
      };
    }
  }

  // Release payment from escrow to farmer
  async releasePayment(orderId) {
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const escrowData = this.escrowAccounts.get(orderId);
      
      if (!escrowData) {
        throw new Error('No escrow found for this order');
      }

      if (escrowData.status !== 'held') {
        throw new Error('Payment already released or refunded');
      }

      // Update escrow status
      escrowData.status = 'released';
      escrowData.releasedAt = new Date();
      this.escrowAccounts.set(orderId, escrowData);

      return {
        success: true,
        transactionId: escrowData.transactionId,
        amount: escrowData.amount,
        message: 'Payment released to farmer'
      };
    } catch (error) {
      console.error('Payment release error:', error);
      return {
        success: false,
        error: error.message || 'Payment release failed'
      };
    }
  }

  // Process refund in case of order cancellation
  async processRefund(orderId, reason) {
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const escrowData = this.escrowAccounts.get(orderId);
      
      if (!escrowData) {
        throw new Error('No escrow found for this order');
      }

      if (escrowData.status !== 'held') {
        throw new Error('Payment already released or refunded');
      }

      // Calculate refund amount based on cancellation reason
      let refundAmount = escrowData.amount;
      let penaltyAmount = 0;

      // Apply penalties based on cancellation reason
      if (reason === 'buyer_cancellation') {
        penaltyAmount = escrowData.amount * 0.05; // 5% penalty
        refundAmount -= penaltyAmount;
      }

      // Update escrow status
      escrowData.status = 'refunded';
      escrowData.refundedAt = new Date();
      escrowData.refundAmount = refundAmount;
      escrowData.penaltyAmount = penaltyAmount;
      this.escrowAccounts.set(orderId, escrowData);

      return {
        success: true,
        transactionId: this.generateTransactionId(),
        refundAmount,
        penaltyAmount,
        message: 'Refund processed successfully'
      };
    } catch (error) {
      console.error('Refund processing error:', error);
      return {
        success: false,
        error: error.message || 'Refund processing failed'
      };
    }
  }

  // Get escrow status
  async getEscrowStatus(orderId) {
    const escrowData = this.escrowAccounts.get(orderId);
    
    if (!escrowData) {
      return {
        success: false,
        error: 'No escrow found for this order'
      };
    }

    return {
      success: true,
      status: escrowData.status,
      amount: escrowData.amount,
      commission: escrowData.commission,
      transactionId: escrowData.transactionId,
      createdAt: escrowData.createdAt,
      releasedAt: escrowData.releasedAt,
      refundedAt: escrowData.refundedAt
    };
  }

  // Process premium subscription payment
  async processPremiumSubscription(userId) {
    await new Promise(resolve => setTimeout(resolve, 800));

    const subscriptionAmount = 250; // ₹250/year
    const transactionId = this.generateTransactionId();

    return {
      success: true,
      transactionId,
      amount: subscriptionAmount,
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      message: 'Premium subscription activated successfully'
    };
  }
}

module.exports = new PaymentService();
