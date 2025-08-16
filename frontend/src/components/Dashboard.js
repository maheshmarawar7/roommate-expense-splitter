import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Users, 
  Copy,
  Check
} from 'lucide-react';

// Helper function to format currency in Rupees
const formatRupees = (amount) => {
  return `₹${parseFloat(amount).toFixed(2)}`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: ''
  });
  const [joinForm, setJoinForm] = useState({
    inviteCode: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setCreateLoading(true);
    try {
      const response = await axios.post('/api/groups', createForm);
      setGroups(prev => [response.data.group, ...prev]);
      setCreateForm({ name: '' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinForm.inviteCode.trim()) return;

    setJoinLoading(true);
    try {
      const response = await axios.post('/api/groups/join', joinForm);
      setGroups(prev => [response.data.group, ...prev]);
      setJoinForm({ inviteCode: '' });
      setShowJoinModal(false);
    } catch (error) {
      console.error('Error joining group:', error);
    } finally {
      setJoinLoading(false);
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const leaveGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    try {
      await axios.delete(`/api/groups/${groupId}`);
      setGroups(prev => prev.filter(group => group._id !== groupId));
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="min-h-96" />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-gray-600">
          Manage your roommate expenses and track balances across all your groups
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Groups</p>
              <p className="text-2xl font-bold text-gray-900">
                {groups.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <span className="text-2xl font-bold text-success-600">₹</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Group Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatRupees(groups.reduce((sum, group) => sum + (group.totalExpenses || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <span className="text-2xl font-bold text-warning-600">₹</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average per Group</p>
              <p className="text-2xl font-bold text-gray-900">
                {groups.length > 0 ? formatRupees(groups.reduce((sum, group) => sum + (group.totalExpenses || 0), 0) / groups.length) : formatRupees(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Groups</h2>
          <p className="text-gray-600">
            Manage your existing groups or create new ones
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowJoinModal(true)}
            className="flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Join Group
          </Button>
        </div>
      </div>

      {/* Groups */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Groups</h2>
        </div>
        
        {groups.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No groups yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new group or joining an existing one.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
              <Button variant="outline" onClick={() => setShowJoinModal(true)}>
                <Users className="h-4 w-4 mr-2" />
                Join Group
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groups.map((group) => (
              <div key={group._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {group.name}
                      </h3>
                      {group.createdBy._id === user._id && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''} • 
                      Created by {group.createdBy.name}
                      {group.totalExpenses && (
                        <span className="ml-2 text-success-600 font-medium">
                          • Total: {formatRupees(group.totalExpenses)}
                        </span>
                      )}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Invite code:</span>
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                        {group.inviteCode}
                      </code>
                      <button
                        onClick={() => copyInviteCode(group.inviteCode)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {copiedCode === group.inviteCode ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/groups/${group._id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      View Group
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => leaveGroup(group._id)}
                    >
                      Leave
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Group</h3>
              <form onSubmit={handleCreateGroup}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter group name"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={createLoading}
                    disabled={createLoading}
                  >
                    Create Group
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    disabled={createLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Join Group</h3>
              <form onSubmit={handleJoinGroup}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    value={joinForm.inviteCode}
                    onChange={(e) => setJoinForm({ inviteCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter invite code"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={joinLoading}
                    disabled={joinLoading}
                  >
                    Join Group
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowJoinModal(false)}
                    disabled={joinLoading}
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

export default Dashboard; 