const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Try to require Payment model (optional)
let Payment = null;
let Expense = null;
let Group = null;
try {
  Payment = require('../models/Payment');
} catch (error) {
  console.log('Payment model not found. Payment features will be disabled.');
}
try {
  Expense = require('../models/Expense');
} catch (error) {
  console.log('Expense model not found. Auto-marking splits paid will be disabled.');
}
try {
  Group = require('../models/Group');
} catch (error) {
  console.log('Group model not found. Group-level payment history checks will be disabled.');
}

// Try to require Razorpay (optional)
let Razorpay = null;
try {
  Razorpay = require('razorpay');
} catch (error) {
  console.log('Razorpay not installed. Payment features will be disabled.');
}

// Initialize Razorpay (only if keys are provided)
let razorpay = null;
if (Razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// @route   GET /api/payments/config
// @desc    Get Razorpay public configuration (key id)
// @access  Public
router.get('/config', (req, res) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      return res.status(503).json({ message: 'Payment gateway not configured' });
    }

    return res.json({
      success: true,
      keyId,
      environment: keyId.startsWith('rzp_test_') ? 'test' : 'live',
      isConfigured: Boolean(razorpay)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load payment configuration' });
  }
});

// @route   POST /api/payments/create-order
// @desc    Create a new payment order
// @access  Private
router.post('/create-order', [
  auth,
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('currency').isIn(['INR']).withMessage('Currency must be INR'),
    body('receipt').notEmpty().withMessage('Receipt is required'),
    body('notes').optional().isObject().withMessage('Notes must be an object'),
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(503).json({ 
        message: 'Payment gateway not configured. Please contact administrator.' 
      });
    }

    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
      notes: {
        ...notes,
        userId: req.user._id.toString(),
        userName: req.user.name
      }
    };

    const order = await razorpay.orders.create(options);

    // Save payment record to database (if Payment model is available)
    let payment = null;
    if (Payment) {
      payment = new Payment({
        userId: req.user._id,
        groupId: notes.groupId,
        expenseId: notes.expenseId,
        razorpayOrderId: order.id,
        amount: amount,
        currency: currency,
        status: 'pending',
        paymentMethod: 'other', // Will be updated after payment
        description: notes.description || 'Expense payment'
      });

      await payment.save();
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      paymentId: payment ? payment._id : null
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Error creating payment order' });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify payment signature
// @access  Private
router.post('/verify', [
  auth,
  [
    body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
    body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
    body('razorpay_signature').notEmpty().withMessage('Signature is required'),
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(503).json({ 
        message: 'Payment gateway not configured. Please contact administrator.' 
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Get payment details from Razorpay
    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

    // Update payment record in database (if Payment model is available)
    let payment = null;
    if (Payment) {
      payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
      if (payment) {
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.status = 'completed';
        payment.paymentMethod = paymentDetails.method || 'other';
        payment.notes = `Payment completed via ${paymentDetails.method || 'unknown method'}`;
        await payment.save();

        // Mark the corresponding expense split as paid for the current user
        if (Expense && payment.expenseId) {
          try {
            const expense = await Expense.findById(payment.expenseId);
            if (expense) {
              const split = expense.splits.find(s => s.userId.toString() === req.user._id.toString());
              if (split && !split.isPaid) {
                split.isPaid = true;
                // Update isSettled if all splits are paid
                expense.isSettled = expense.splits.every(s => s.isPaid);
                await expense.save();
              }
            }
          } catch (err) {
            console.error('Error marking expense split as paid:', err);
          }
        }
      }
    }

    // Payment is verified
    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paymentRecord: payment
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
});

// @route   GET /api/payments/orders/:orderId
// @desc    Get payment order details
// @access  Private
router.get('/orders/:orderId', auth, async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(503).json({ 
        message: 'Payment gateway not configured. Please contact administrator.' 
      });
    }

    const { orderId } = req.params;
    const order = await razorpay.orders.fetch(orderId);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        notes: order.notes
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Error fetching order details' });
  }
});

// @route   GET /api/payments/payments/:paymentId
// @desc    Get payment details
// @access  Private
router.get('/payments/:paymentId', auth, async (req, res) => {
  try {
    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(503).json({ 
        message: 'Payment gateway not configured. Please contact administrator.' 
      });
    }

    const { paymentId } = req.params;
    const payment = await razorpay.payments.fetch(paymentId);
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        description: payment.description,
        email: payment.email,
        contact: payment.contact,
        created_at: payment.created_at
      }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Error fetching payment details' });
  }
});

// @route   POST /api/payments/refund
// @desc    Create a refund
// @access  Private
router.post('/refund', [
  auth,
  [
    body('payment_id').notEmpty().withMessage('Payment ID is required'),
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(503).json({ 
        message: 'Payment gateway not configured. Please contact administrator.' 
      });
    }

    const { payment_id, amount, reason = 'Refund requested' } = req.body;

    const refundOptions = {
      payment_id,
      reason,
      ...(amount && { amount: amount * 100 }) // Convert to paise if amount provided
    };

    const refund = await razorpay.payments.refund(refundOptions);

    res.json({
      success: true,
      refund: {
        id: refund.id,
        payment_id: refund.payment_id,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason
      }
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Error processing refund' });
  }
});

// @route   GET /api/payments/history/:groupId
// @desc    Get payment history for a group
// @access  Private
router.get('/history/:groupId', auth, async (req, res) => {
  try {
    // Check if Payment model is available
    if (!Payment) {
      return res.status(503).json({ 
        message: 'Payment features not available. Please contact administrator.' 
      });
    }

    const { groupId } = req.params;

    // Optional: validate group and membership when Group model is present
    if (Group) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
      const isMember = group.members.find(member => 
        member.user.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied. Not a member of this group.' });
      }
    }

    const payments = await Payment.find({ groupId })
      .populate('userId', 'name email')
      .populate('expenseId', 'description amount')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Error fetching payment history' });
  }
});

// @route   GET /api/payments/user/:userId
// @desc    Get payment history for a user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // Check if Payment model is available
    if (!Payment) {
      return res.status(503).json({ 
        message: 'Payment features not available. Please contact administrator.' 
      });
    }

    const { userId } = req.params;
    
    // Only allow users to see their own payments
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payments = await Payment.find({ userId })
      .populate('groupId', 'name')
      .populate('expenseId', 'description amount')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ message: 'Error fetching user payments' });
  }
});

// @route   GET /api/payments/summary/:groupId
// @desc    Get payment summary for a group
// @access  Private
router.get('/summary/:groupId', auth, async (req, res) => {
  try {
    // Check if Payment model is available
    if (!Payment) {
      return res.status(503).json({ 
        message: 'Payment features not available. Please contact administrator.' 
      });
    }

    const { groupId } = req.params;
    
    const summary = await Payment.getGroupPaymentSummary(groupId);

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({ message: 'Error fetching payment summary' });
  }
});

module.exports = router; 