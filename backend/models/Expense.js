const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  paidByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Food', 'Rent', 'Utilities', 'Transport', 'Entertainment', 'Shopping', 'Other'],
    default: 'Other'
  },
  date: {
    type: Date,
    default: Date.now
  },
  splits: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    isPaid: {
      type: Boolean,
      default: false
    }
  }],
  isSettled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate splits before saving
expenseSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('amount') || this.isModified('groupId')) {
    try {
      const Group = mongoose.model('Group');
      const group = await Group.findById(this.groupId).populate('members.user');
      
      if (group && group.members.length > 0) {
        const splitAmount = parseFloat((this.amount / group.members.length).toFixed(2));
        
        this.splits = group.members.map(member => ({
          userId: member.user._id,
          amount: splitAmount,
          isPaid: member.user._id.toString() === this.paidByUserId.toString()
        }));
        
        console.log('Splits calculated:', {
          totalAmount: this.amount,
          memberCount: group.members.length,
          splitAmount: splitAmount,
          splits: this.splits
        });
      } else {
        console.error('Group not found or no members');
      }
    } catch (error) {
      console.error('Error calculating splits:', error);
      return next(error);
    }
  }
  next();
});

// Method to mark expense as settled
expenseSchema.methods.markAsSettled = function() {
  this.isSettled = true;
  this.splits.forEach(split => {
    split.isPaid = true;
  });
  return this.save();
};

// Method to toggle payment status for a specific member
expenseSchema.methods.togglePaymentStatus = function(userId) {
  const split = this.splits.find(s => s.userId.toString() === userId.toString());
  if (split) {
    split.isPaid = !split.isPaid;
    // Update isSettled based on all splits
    this.isSettled = this.splits.every(s => s.isPaid);
    return this.save();
  }
  return Promise.reject(new Error('User not found in expense splits'));
};

// Method to get payment summary
expenseSchema.methods.getPaymentSummary = function() {
  const totalMembers = this.splits.length;
  const paidMembers = this.splits.filter(s => s.isPaid).length;
  const unpaidMembers = totalMembers - paidMembers;
  
  return {
    totalMembers,
    paidMembers,
    unpaidMembers,
    isFullyPaid: paidMembers === totalMembers,
    isPartiallyPaid: paidMembers > 0 && paidMembers < totalMembers
  };
};

module.exports = mongoose.model('Expense', expenseSchema); 