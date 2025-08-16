const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const auth = require('../middleware/auth');
const dayjs = require('dayjs');

const router = express.Router();

// @route   POST /api/expenses
// @desc    Add a new expense
// @access  Private
router.post('/', [
  auth,
  body('groupId').isMongoId().withMessage('Valid group ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').trim().isLength({ min: 1, max: 200 }).withMessage('Description is required and must be less than 200 characters'),
  body('category').isIn(['Food', 'Rent', 'Utilities', 'Transport', 'Entertainment', 'Shopping', 'Other']).withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groupId, amount, description, category, date } = req.body;

    // Check if user is a member of the group
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

    // Create new expense
    const expense = new Expense({
      groupId,
      paidByUserId: req.user._id,
      amount,
      description,
      category,
      date: date || new Date()
    });

    await expense.save();

    console.log('Expense created:', {
      id: expense._id,
      amount: expense.amount,
      splits: expense.splits,
      groupMembers: group.members.length
    });

    // Populate expense details
    await expense.populate('paidByUserId', 'name');
    await expense.populate('splits.userId', 'name');

    res.status(201).json({
      message: 'Expense added successfully',
      expense
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ message: 'Server error adding expense' });
  }
});

// @route   GET /api/expenses/group/:groupId
// @desc    Get all expenses for a group
// @access  Private
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if user is a member of the group
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

    // Get expenses with populated user details
    const expenses = await Expense.find({ groupId })
      .populate('paidByUserId', 'name')
      .populate('splits.userId', 'name')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error getting expenses' });
  }
});

// @route   GET /api/expenses/balances/:groupId
// @desc    Get balance sheet for a group
// @access  Private
router.get('/balances/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if user is a member of the group
    const group = await Group.findById(groupId).populate('members.user', 'name');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.find(member => 
      member.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. Not a member of this group.' });
    }

    // Get all expenses for the group
    const expenses = await Expense.find({ groupId }).populate('paidByUserId', 'name');

    // Calculate balances
    const balances = {};
    group.members.forEach(member => {
      balances[member.user._id] = {
        userId: member.user._id,
        name: member.user.name,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0
      };
    });

    // Calculate total paid and owed for each member
    expenses.forEach(expense => {
      const paidBy = expense.paidByUserId._id.toString();
      balances[paidBy].totalPaid += expense.amount;

      // Each member owes their share of the expense
      expense.splits.forEach(split => {
        const userId = split.userId.toString();
        balances[userId].totalOwed += split.amount;
      });
    });

    // Calculate net balance (what they're owed - what they owe)
    Object.values(balances).forEach(balance => {
      balance.netBalance = balance.totalPaid - balance.totalOwed;
    });

    // Generate settlement suggestions
    const settlements = [];
    const positiveBalances = Object.values(balances).filter(b => b.netBalance > 0).sort((a, b) => b.netBalance - a.netBalance);
    const negativeBalances = Object.values(balances).filter(b => b.netBalance < 0).sort((a, b) => a.netBalance - b.netBalance);

    let i = 0, j = 0;
    while (i < positiveBalances.length && j < negativeBalances.length) {
      const positive = positiveBalances[i];
      const negative = negativeBalances[j];
      
      const amount = Math.min(positive.netBalance, Math.abs(negative.netBalance));
      
      if (amount > 0.01) { // Only show settlements above 1 cent
        settlements.push({
          from: negative.name,
          to: positive.name,
          amount: parseFloat(amount.toFixed(2))
        });
      }

      positive.netBalance -= amount;
      negative.netBalance += amount;

      if (Math.abs(positive.netBalance) < 0.01) i++;
      if (Math.abs(negative.netBalance) < 0.01) j++;
    }

    res.json({
      balances: Object.values(balances),
      settlements,
      totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      memberCount: group.members.length
    });
  } catch (error) {
    console.error('Get balances error:', error);
    res.status(500).json({ message: 'Server error getting balances' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user is the one who paid for the expense
    if (expense.paidByUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete expenses you paid for.' });
    }

    await expense.deleteOne();

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error deleting expense' });
  }
});

// @route   PATCH /api/expenses/:id/toggle-payment
// @desc    Toggle payment status for a member
// @access  Private
router.patch('/:id/toggle-payment', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user is a member of the group
    const group = await Group.findById(expense.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. Not a member of this group.' });
    }

    // Toggle payment status
    await expense.togglePaymentStatus(userId);
    
    // Get updated expense with populated data
    await expense.populate('paidByUserId', 'name');
    await expense.populate('splits.userId', 'name');

    res.json({
      message: 'Payment status updated successfully',
      expense,
      paymentSummary: expense.getPaymentSummary()
    });
  } catch (error) {
    console.error('Toggle payment error:', error);
    res.status(500).json({ message: 'Server error updating payment status' });
  }
});

// @route   GET /api/expenses/:id/payment-summary
// @desc    Get payment summary for an expense
// @access  Private
router.get('/:id/payment-summary', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user is a member of the group
    const group = await Group.findById(expense.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. Not a member of this group.' });
    }

    res.json({
      paymentSummary: expense.getPaymentSummary(),
      splits: expense.splits
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({ message: 'Server error getting payment summary' });
  }
});

module.exports = router; 