import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft,
  TrendingUp,
  User,
  CreditCard,
  Receipt
} from 'lucide-react';
import dayjs from 'dayjs';

// Helper function to format currency in Rupees
const formatRupees = (amount) => {
  return `₹${parseFloat(amount).toFixed(2)}`;
};

const MemberDashboard = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [memberExpenses, setMemberExpenses] = useState([]);
  const [personalBalance, setPersonalBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, expenses, settlements
  const { user } = useAuth();

  const fetchMemberData = useCallback(async () => {
    try {
      const [groupRes, expensesRes, balancesRes] = await Promise.all([
        axios.get(`/api/groups/${groupId}`),
        axios.get(`/api/expenses/group/${groupId}`),
        axios.get(`/api/expenses/balances/${groupId}`)
      ]);
      
      setGroup(groupRes.data);
      setMemberExpenses(expensesRes.data);
      
      // Find current user's balance
      const currentUserBalance = balancesRes.data.balances.find(
        balance => balance.userId === user?.id
      );
      setPersonalBalance(currentUserBalance);
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user?.id]);

  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchMemberData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, groupId, fetchMemberData]);

  const getCurrentUserId = () => {
    return user?.id;
  };

  const getPersonalExpenses = () => {
    const currentUserId = getCurrentUserId();
    return memberExpenses.filter(expense => 
      expense.paidByUserId._id === currentUserId
    );
  };

  const getExpensesOwed = () => {
    const currentUserId = getCurrentUserId();
    return memberExpenses.filter(expense => 
      expense.splits.some(split => 
        split.userId._id === currentUserId && !split.isPaid
      )
    );
  };

  const getTotalPersonalSpent = () => {
    return getPersonalExpenses().reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getTotalOwed = () => {
    return getExpensesOwed().reduce((sum, exp) => {
      const split = exp.splits.find(s => s.userId._id === getCurrentUserId());
      return sum + (split ? split.amount : 0);
    }, 0);
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
            to={`/groups/${groupId}`}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-600">
              Personal overview for {group.name}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'expenses' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('expenses')}
          >
            My Expenses
          </Button>
          <Button
            variant={activeTab === 'settlements' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('settlements')}
          >
            Settlements
          </Button>
        </div>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Position</p>
              <p className="text-2xl font-bold text-gray-900">
                {personalBalance?.netBalance > 0 ? 'Creditor' : personalBalance?.netBalance < 0 ? 'Debtor' : 'Settled'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatRupees(getTotalPersonalSpent())}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Receipt className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Owed</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatRupees(getTotalOwed())}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-info-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-info-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold ${
                personalBalance?.netBalance > 0 ? 'text-success-600' : 
                personalBalance?.netBalance < 0 ? 'text-danger-600' : 'text-gray-900'
              }`}>
                {personalBalance?.netBalance > 0 ? '+' : ''}{formatRupees(personalBalance?.netBalance || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Personal Balance Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">My Balance Summary</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatRupees(personalBalance?.totalPaid || 0)}
                  </div>
                  <div className="text-sm text-green-700">Total Paid</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {formatRupees(personalBalance?.totalOwed || 0)}
                  </div>
                  <div className="text-sm text-red-700">Total Owed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className={`text-2xl font-bold ${
                    personalBalance?.netBalance > 0 ? 'text-green-600' : 
                    personalBalance?.netBalance < 0 ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {personalBalance?.netBalance > 0 ? '+' : ''}{formatRupees(personalBalance?.netBalance || 0)}
                  </div>
                  <div className="text-sm text-blue-700">Net Balance</div>
                </div>
              </div>
              
              {personalBalance && (
                <div className="mt-6 text-center">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    personalBalance.netBalance > 0 
                      ? 'bg-green-100 text-green-800' 
                      : personalBalance.netBalance < 0 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {personalBalance.netBalance > 0 
                      ? `You will receive ${formatRupees(personalBalance.netBalance)}`
                      : personalBalance.netBalance < 0 
                      ? `You owe ${formatRupees(Math.abs(personalBalance.netBalance))}`
                      : 'You are all settled up!'
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {memberExpenses.slice(0, 5).map((expense) => (
                  <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{expense.description}</div>
                      <div className="text-sm text-gray-500">
                        {dayjs(expense.date).format('MMM D, YYYY')} • {expense.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {formatRupees(expense.amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {expense.paidByUserId._id === getCurrentUserId() ? 'You paid' : 'You owe'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">My Expenses</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {getPersonalExpenses().map((expense) => (
                <div key={expense._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{expense.description}</div>
                      <div className="text-sm text-gray-500">
                        {dayjs(expense.date).format('MMM D, YYYY')} • {expense.category}
                      </div>
                      <div className="text-sm text-gray-600">
                        Split among {expense.splits.length} members
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatRupees(expense.amount)}
                      </div>
                      <div className="text-sm text-green-600">
                        You paid this
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {getPersonalExpenses().length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  You haven't paid for any expenses yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settlements' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Settlement Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {getExpensesOwed().map((expense) => (
                <div key={expense._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{expense.description}</div>
                      <div className="text-sm text-gray-500">
                        Paid by {expense.paidByUserId.name} • {dayjs(expense.date).format('MMM D, YYYY')}
                      </div>
                      <div className="text-sm text-gray-600">
                        Your share: {formatRupees(expense.amount / expense.splits.length)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        {formatRupees(expense.amount / expense.splits.length)}
                      </div>
                      <div className="text-sm text-red-600">
                        Unpaid
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {getExpensesOwed().length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  You don't owe anything! All expenses are settled.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDashboard; 