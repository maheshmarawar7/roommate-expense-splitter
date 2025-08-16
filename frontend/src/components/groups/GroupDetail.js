import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  DollarSign, 
  Users, 
  Trash2,
  ArrowLeft,
  TrendingUp,
  User
} from 'lucide-react';
import dayjs from 'dayjs';

// Helper function to format currency in Rupees
const formatRupees = (amount) => {
  return `₹${parseFloat(amount).toFixed(2)}`;
};

const GroupDetail = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    category: 'Other',
    date: dayjs().format('YYYY-MM-DD')
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchGroupData = useCallback(async () => {
    try {
      const [groupRes, expensesRes, balancesRes] = await Promise.all([
        axios.get(`/api/groups/${groupId}`),
        axios.get(`/api/expenses/group/${groupId}`),
        axios.get(`/api/expenses/balances/${groupId}`)
      ]);
      
      setGroup(groupRes.data);
      setExpenses(expensesRes.data);
      setBalances(balancesRes.data);
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupData();
  }, [groupId, fetchGroupData]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchGroupData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loading, groupId, fetchGroupData]);

  // Real-time updates when expenses or balances change
  const updateExpenseInList = (updatedExpense) => {
    setExpenses(prev => prev.map(exp => 
      exp._id === updatedExpense._id ? updatedExpense : exp
    ));
  };

  const updateBalances = async () => {
    try {
      const balancesRes = await axios.get(`/api/expenses/balances/${groupId}`);
      setBalances(balancesRes.data);
    } catch (error) {
      console.error('Error updating balances:', error);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.description) return;

    setSubmitting(true);
    try {
      const response = await axios.post('/api/expenses', {
        ...expenseForm,
        groupId,
        amount: parseFloat(expenseForm.amount)
      });
      
      // Add new expense to the list
      setExpenses(prev => [response.data.expense, ...prev]);
      
      // Reset form
      setExpenseForm({
        amount: '',
        description: '',
        category: 'Other',
        date: dayjs().format('YYYY-MM-DD')
      });
      setShowAddExpense(false);
      
      // Update balances in real-time
      await updateBalances();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await axios.delete(`/api/expenses/${expenseId}`);
      
      // Remove expense from the list
      setExpenses(prev => prev.filter(exp => exp._id !== expenseId));
      
      // Update balances in real-time
      await updateBalances();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const handleTogglePayment = async (expenseId, userId) => {
    try {
      const response = await axios.patch(`/api/expenses/${expenseId}/toggle-payment`, { userId });
      
      // Update the expense in the list with real-time data
      updateExpenseInList(response.data.expense);
      
      // Update balances
      await updateBalances();
      
      // Show success message
      console.log('Payment status updated:', response.data.message);
    } catch (error) {
      console.error('Error toggling payment:', error);
      alert('Failed to update payment status. Please try again.');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Food: 'bg-orange-100 text-orange-800',
      Rent: 'bg-red-100 text-red-800',
      Utilities: 'bg-blue-100 text-blue-800',
      Transport: 'bg-green-100 text-green-800',
      Entertainment: 'bg-purple-100 text-purple-800',
      Shopping: 'bg-pink-100 text-pink-800',
      Other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.Other;
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="min-h-96" />;
  }

  if (!group) {
    return <div>Group not found</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-gray-600">
              {group.members.length} member{group.members.length !== 1 ? 's' : ''} • 
              Created by {group.createdBy.name}
            </p>
            {balances && (
              <div className="mt-2 flex items-center space-x-4 text-sm">
                <span className="text-gray-500">Your position:</span>
                {(() => {
                  const currentUserBalance = balances.balances.find(b => b.userId === user?.id);
                  if (currentUserBalance) {
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        currentUserBalance.netBalance > 0 
                          ? 'bg-success-100 text-success-800' 
                          : currentUserBalance.netBalance < 0 
                          ? 'bg-danger-100 text-danger-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {currentUserBalance.netBalance > 0 
                          ? `Will receive ${formatRupees(currentUserBalance.netBalance)}`
                          : currentUserBalance.netBalance < 0 
                          ? `Owes ${formatRupees(Math.abs(currentUserBalance.netBalance))}`
                          : 'Settled up'
                        }
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowAddExpense(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
          <Link
            to={`/groups/${groupId}/dashboard`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <User className="h-4 w-4 mr-2" />
            My Dashboard
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <div className="border-b-2 border-primary-500 py-2 px-1 text-sm font-medium text-primary-600">
            Group Overview
          </div>
          <Link
            to={`/groups/${groupId}/dashboard`}
            className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            My Personal View
          </Link>
        </nav>
      </div>

      {/* Group Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Group Overview</h2>
          <p className="text-gray-600">Total expenses and balances for the entire group</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-3 bg-primary-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{group.members.length}</h3>
            <p className="text-gray-600">Total Members</p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-success-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-success-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {formatRupees(balances?.totalExpenses || 0)}
            </h3>
            <p className="text-gray-600">Total Group Expenses</p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-warning-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-warning-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {balances?.settlements?.length || 0}
            </h3>
            <p className="text-gray-600">Pending Settlements</p>
          </div>
        </div>
        
        {/* Quick Personal Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Your Personal Summary</h3>
              <p className="text-sm text-gray-600">Click "My Dashboard" for detailed personal view</p>
            </div>
            <Link
              to={`/groups/${groupId}/dashboard`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              <User className="h-4 w-4 mr-2" />
              View My Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Balance Sheet */}
      {balances && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Balance Sheet (₹)</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Paid (₹)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Owed (₹)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Balance (₹)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {balances.balances.map((balance) => (
                    <tr key={balance.userId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {balance.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatRupees(balance.totalPaid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatRupees(balance.totalOwed)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          balance.netBalance > 0 
                            ? 'bg-success-100 text-success-800' 
                            : balance.netBalance < 0 
                            ? 'bg-danger-100 text-danger-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {balance.netBalance > 0 ? '+' : ''}{formatRupees(balance.netBalance)}
                        </span>
                        <div className="mt-1 text-xs text-gray-500">
                          {balance.netBalance > 0 ? 'Will receive' : balance.netBalance < 0 ? 'Owes' : 'Settled'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Settlement Suggestions */}
            {balances.settlements.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Settlement Suggestions</h3>
                <div className="space-y-2">
                  {balances.settlements.map((settlement, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-700">
                        <strong>{settlement.from}</strong> owes{' '}
                        <strong>{formatRupees(settlement.amount)}</strong> to{' '}
                        <strong>{settlement.to}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Expenses (₹)</h2>
        </div>
        
        {/* Payment Summary */}
        {expenses.length > 0 && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{expenses.length}</div>
                  <div className="text-sm text-blue-700">Total Expenses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {expenses.filter(exp => exp.isSettled).length}
                  </div>
                  <div className="text-sm text-green-700">Fully Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {expenses.filter(exp => !exp.isSettled && exp.splits.some(s => s.isPaid)).length}
                  </div>
                  <div className="text-sm text-orange-700">Partially Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {expenses.filter(exp => !exp.isSettled && !exp.splits.some(s => s.isPaid)).length}
                  </div>
                  <div className="text-sm text-red-700">Unpaid</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-600">
                  Auto-refresh every 30 seconds
                </div>
                <button
                  onClick={fetchGroupData}
                  className="text-xs text-blue-500 hover:text-blue-700 underline"
                >
                  Refresh Now
                </button>
              </div>
            </div>
          </div>
        )}
        
        {expenses.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add your first expense to get started.
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowAddExpense(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <div key={expense._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {expense.description}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      <span className="font-medium">Paid by:</span> {expense.paidByUserId.name} • {dayjs(expense.date).format('MMM D, YYYY')}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      <span className="font-medium">Split:</span> {expense.splits.length} member{expense.splits.length !== 1 ? 's' : ''} • 
                      <span className="font-medium"> Each owes:</span> {formatRupees(expense.amount / expense.splits.length)}
                    </p>
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <span className="font-medium">Split Details:</span> {expense.splits.map(split => 
                        `${split.userId.name}: ${formatRupees(split.amount)}`
                      ).join(' | ')}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                      <span className="font-medium">Payment Status:</span> {expense.splits.map(split => (
                        <span key={split.userId._id} className="inline-flex items-center mr-3 mb-1">
                          <span className={`w-3 h-3 rounded-full mr-2 ${split.isPaid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className={`font-medium ${split.isPaid ? 'text-green-700' : 'text-red-700'}`}>
                            {split.userId.name}: {split.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                          <button
                            onClick={() => handleTogglePayment(expense._id, split.userId._id)}
                            className="ml-2 px-2 py-1 text-xs rounded border border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                          >
                            Mark as {split.isPaid ? 'Unpaid' : 'Paid'}
                          </button>
                        </span>
                      ))}
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <span className="text-xs text-blue-600">
                          Overall: {expense.splits.filter(s => s.isPaid).length}/{expense.splits.length} members paid
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatRupees(expense.amount)}
                    </span>
                    {expense.paidByUserId._id === user._id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Expense</h3>
              <form onSubmit={handleAddExpense}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  
                  <Input
                    label="Description"
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What was this expense for?"
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Food">Food</option>
                      <option value="Rent">Rent</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Transport">Transport</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <Input
                    label="Date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={submitting}
                    disabled={submitting}
                  >
                    Add Expense
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddExpense(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail; 