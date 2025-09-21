const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String,
    unique: true,
    sparse: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'card', 'netbanking', 'wallet', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  refundId: {
    type: String
  },
  refundAmount: {
    type: Number
  },
  refundReason: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ userId: 1, groupId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Method to update payment status
paymentSchema.methods.updateStatus = function(status, paymentId = null) {
  this.status = status;
  if (paymentId) {
    this.razorpayPaymentId = paymentId;
  }
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(refundId, refundAmount, reason) {
  this.status = 'refunded';
  this.refundId = refundId;
  this.refundAmount = refundAmount;
  this.refundReason = reason;
  return this.save();
};

// Static method to get payment summary for a group
paymentSchema.statics.getGroupPaymentSummary = async function(groupId) {
  const summary = await this.aggregate([
    { $match: { groupId: new mongoose.Types.ObjectId(groupId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  return summary.reduce((acc, item) => {
    acc[item._id] = {
      count: item.count,
      totalAmount: item.totalAmount
    };
    return acc;
  }, {});
};

// Static method to get user payment history
paymentSchema.statics.getUserPayments = async function(userId, limit = 10) {
  return this.find({ userId })
    .populate('groupId', 'name')
    .populate('expenseId', 'description amount')
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Payment', paymentSchema); 