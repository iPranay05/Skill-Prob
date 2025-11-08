'use client';

import { useState, useEffect } from 'react';
import { RealTimeAnalytics } from './RealTimeAnalytics';
import { RealTimeNotifications } from './RealTimeNotifications';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
  lastLogin?: Date;
}

interface Course {
  id: string;
  title: string;
  instructor: string;
  status: 'draft' | 'published' | 'archived';
  studentsCount: number;
  revenue: number;
  createdAt: Date;
}

interface PayoutRequest {
  id: string;
  ambassadorName: string;
  ambassadorEmail: string;
  amount: number;
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
}

interface SystemConfig {
  platformCommission: number;
  ambassadorCommissionRate: number;
  minimumPayoutAmount: number;
  autoApprovePayouts: boolean;
  maintenanceMode: boolean;
}

interface AdminPanelProps {
  adminId: string;
  adminProfile: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export function AdminPanel({ adminId, adminProfile }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    platformCommission: 10,
    ambassadorCommissionRate: 5,
    minimumPayoutAmount: 1000,
    autoApprovePayouts: false,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'payouts' | 'settings' | 'analytics'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [usersRes, coursesRes, payoutsRes, configRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/courses'),
        fetch('/api/admin/payouts'),
        fetch('/api/admin/config')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }

      if (payoutsRes.ok) {
        const payoutsData = await payoutsRes.json();
        setPayoutRequests(payoutsData.payouts || []);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        setSystemConfig({ ...systemConfig, ...configData.config });
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        fetchAdminData(); // Refresh data
      }
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  const handlePayoutAction = async (payoutId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        fetchAdminData(); // Refresh data
      }
    } catch (error) {
      console.error('Error processing payout:', error);
    }
  };

  const handleConfigUpdate = async (config: Partial<SystemConfig>) => {
    try {
      const response = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSystemConfig({ ...systemConfig, ...config });
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'published':
      case 'approved':
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
      case 'archived':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const UserCard = ({ user }: { user: User }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{user.firstName} {user.lastName}</h4>
          <p className="text-sm text-gray-600">{user.email}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.status)}`}>
          {user.status}
        </span>
      </div>
      
      <div className="space-y-1 text-sm text-gray-600 mb-3">
        <div className="flex justify-between">
          <span>Joined:</span>
          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
        {user.lastLogin && (
          <div className="flex justify-between">
            <span>Last Login:</span>
            <span>{new Date(user.lastLogin).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2">
        {user.status === 'active' ? (
          <button
            onClick={() => handleUserAction(user.id, 'suspend')}
            className="flex-1 px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
          >
            Suspend
          </button>
        ) : (
          <button
            onClick={() => handleUserAction(user.id, 'activate')}
            className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
          >
            Activate
          </button>
        )}
        <button
          onClick={() => handleUserAction(user.id, 'delete')}
          className="flex-1 px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );

  const CourseCard = ({ course }: { course: Course }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{course.title}</h4>
          <p className="text-sm text-gray-600">by {course.instructor}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(course.status)}`}>
          {course.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{course.studentsCount}</div>
          <div className="text-xs text-gray-500">Students</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-secondary">₹{course.revenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Revenue</div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        Created: {new Date(course.createdAt).toLocaleDateString()}
      </div>
    </div>
  );

  const PayoutCard = ({ payout }: { payout: PayoutRequest }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{payout.ambassadorName}</h4>
          <p className="text-sm text-gray-600">{payout.ambassadorEmail}</p>
          <p className="text-lg font-semibold text-gray-900">₹{payout.amount.toLocaleString()}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payout.status)}`}>
          {payout.status}
        </span>
      </div>
      
      <div className="text-xs text-gray-500 mb-3">
        Requested: {new Date(payout.requestDate).toLocaleDateString()}
      </div>
      
      {payout.status === 'pending' && (
        <div className="flex space-x-2">
          <button
            onClick={() => handlePayoutAction(payout.id, 'approve')}
            className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => handlePayoutAction(payout.id, 'reject')}
            className="flex-1 px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );

  const OverviewTab = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.status === 'published').length;
    const totalRevenue = courses.reduce((sum, course) => sum + course.revenue, 0);
    const pendingPayouts = payoutRequests.filter(p => p.status === 'pending').length;

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                <p className="text-xs text-secondary">{activeUsers} active</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-info text-xl">👥</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
                <p className="text-xs text-secondary">{publishedCourses} published</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-secondary text-xl">📚</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-primary text-xl">💰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-gray-900">{pendingPayouts}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-accent text-xl">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Maintenance Mode</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  systemConfig.maintenanceMode ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {systemConfig.maintenanceMode ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto Approve Payouts</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  systemConfig.autoApprovePayouts ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {systemConfig.autoApprovePayouts ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Platform Commission</span>
                <span className="text-sm font-medium text-gray-900">{systemConfig.platformCommission}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ambassador Commission</span>
                <span className="text-sm font-medium text-gray-900">{systemConfig.ambassadorCommissionRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
            <div className="space-y-3">
              {users.slice(0, 5).map(user => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Payouts</h3>
            <div className="space-y-3">
              {payoutRequests.filter(p => p.status === 'pending').slice(0, 5).map(payout => (
                <div key={payout.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payout.ambassadorName}</p>
                    <p className="text-xs text-gray-600">₹{payout.amount.toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handlePayoutAction(payout.id, 'approve')}
                      className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handlePayoutAction(payout.id, 'reject')}
                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      ✗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const UsersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="mentor">Mentors</option>
            <option value="ambassador">Ambassadors</option>
            <option value="admin">Admins</option>
          </select>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );

  const CoursesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Course Management</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );

  const PayoutsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Payout Management</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {payoutRequests.map(payout => (
          <PayoutCard key={payout.id} payout={payout} />
        ))}
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Commission (%)
            </label>
            <input
              type="number"
              value={systemConfig.platformCommission}
              onChange={(e) => handleConfigUpdate({ platformCommission: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ambassador Commission Rate (%)
            </label>
            <input
              type="number"
              value={systemConfig.ambassadorCommissionRate}
              onChange={(e) => handleConfigUpdate({ ambassadorCommissionRate: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Payout Amount (₹)
            </label>
            <input
              type="number"
              value={systemConfig.minimumPayoutAmount}
              onChange={(e) => handleConfigUpdate({ minimumPayoutAmount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={systemConfig.autoApprovePayouts}
                onChange={(e) => handleConfigUpdate({ autoApprovePayouts: e.target.checked })}
                className="rounded border-gray-300 text-info focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">Auto-approve payouts</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={systemConfig.maintenanceMode}
                onChange={(e) => handleConfigUpdate({ maintenanceMode: e.target.checked })}
                className="rounded border-gray-300 text-info focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-700">Maintenance mode</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Panel ⚙️
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {adminProfile.firstName}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <RealTimeNotifications />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'users', label: 'Users', icon: '👥' },
            { id: 'courses', label: 'Courses', icon: '📚' },
            { id: 'payouts', label: 'Payouts', icon: '💰' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-info text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'courses' && <CoursesTab />}
            {activeTab === 'payouts' && <PayoutsTab />}
            {activeTab === 'settings' && <SettingsTab />}
            {activeTab === 'analytics' && (
              <RealTimeAnalytics userRole="admin" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
