const express = require('express');
const { Order, Crop, User } = require('../models');
const { auth, isBuyer, isVerified } = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const router = express.Router();

// Create new order
router.post('/', [auth, isBuyer, isVerified], async (req, res) => {
  try {
    const { cropId, quantity, pickupDate } = req.body;

    const crop = await Crop.findByPk(cropId);
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    if (crop.status !== 'available') {
      return res.status(400).json({ error: 'Crop is not available for purchase' });
    }

    if (quantity > crop.quantity) {
      return res.status(400).json({ error: 'Requested quantity not available' });
    }

    // Calculate total amount including platform fee
    const totalAmount = quantity * crop.price;
    const payment = await paymentService.processPayment(cropId, totalAmount);

    if (!payment.success) {
      return res.status(400).json({ error: 'Payment processing failed' });
    }

    const order = await Order.create({
      cropId,
      buyerId: req.user.id,
      quantity,
      totalAmount,
      status: 'pending',
      paymentId: payment.transactionId,
      pickupDate: new Date(pickupDate)
    });

    // Update crop quantity and status
    await crop.update({
      quantity: crop.quantity - quantity,
      status: crop.quantity - quantity === 0 ? 'sold' : 'available'
    });

    res.status(201).json({
      order,
      payment: {
        transactionId: payment.transactionId,
        amount: totalAmount,
        escrowAmount: payment.escrowAmount,
        commission: payment.commission
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(400).json({ error: 'Failed to create order' });
  }
});

// Get order details
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Crop,
          as: 'crop',
          include: [{
            model: User,
            as: 'farmer',
            attributes: ['id', 'name', 'phone']
          }]
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'phone']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is authorized to view this order
    if (order.buyerId !== req.user.id && order.crop.farmerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    // Get escrow status
    const escrowStatus = await paymentService.getEscrowStatus(order.id);

    res.json({ order, escrowStatus });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Update order status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: Crop,
        as: 'crop'
      }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify authorization based on status update
    if (status === 'delivered' && req.user.id !== order.buyerId) {
      return res.status(403).json({ error: 'Only buyer can confirm delivery' });
    }

    if (status === 'in-transit' && req.user.id !== order.crop.farmerId) {
      return res.status(403).json({ error: 'Only farmer can update to in-transit' });
    }

    // Handle status transitions
    switch (status) {
      case 'in-transit':
        if (order.status !== 'pending') {
          return res.status(400).json({ error: 'Invalid status transition' });
        }
        break;

      case 'delivered':
        if (order.status !== 'in-transit') {
          return res.status(400).json({ error: 'Order must be in transit first' });
        }
        // Release payment to farmer
        const paymentRelease = await paymentService.releasePayment(order.id);
        if (!paymentRelease.success) {
          return res.status(400).json({ error: 'Failed to release payment' });
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid status' });
    }

    await order.update({ status });
    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(400).json({ error: 'Failed to update order status' });
  }
});

// Cancel order
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: Crop,
        as: 'crop'
      }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify cancellation eligibility
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot cancel order in current status' });
    }

    // Process refund
    const refund = await paymentService.processRefund(order.id, reason);
    if (!refund.success) {
      return res.status(400).json({ error: 'Failed to process refund' });
    }

    // Update order status and restore crop quantity
    await order.update({ status: 'canceled' });
    await order.crop.update({
      quantity: order.crop.quantity + order.quantity,
      status: 'available'
    });

    res.json({
      message: 'Order cancelled successfully',
      refund: {
        amount: refund.refundAmount,
        penaltyAmount: refund.penaltyAmount,
        transactionId: refund.transactionId
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(400).json({ error: 'Failed to cancel order' });
  }
});

// List orders (filtered by user role)
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    // Filter based on user role
    if (req.user.type === 'buyer') {
      where.buyerId = req.user.id;
    } else if (req.user.type === 'farmer') {
      where['$crop.farmerId$'] = req.user.id;
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Crop,
          as: 'crop',
          include: [{
            model: User,
            as: 'farmer',
            attributes: ['id', 'name']
          }]
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;
