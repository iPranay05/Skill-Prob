'use client';

import { useEffect, useState } from 'react';
import { useAnalyticsUpdates } from '../hooks/useSocket';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalRevenue: number;
  enrollments: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  liveSessionsActive: number;
  ambassadorStats: {
    totalAmbassadors: number;
    activeReferrals: number;
    totalCommissions: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'enrollment' | 'course_created' | 'session_started' | 'payout_processed';
    description: string;
    timestamp: Date;
    value?: number;
  }>;
}

interface RealTimeAnalyticsProps {
  initialData?: Partial<AnalyticsData>;
  userRole?: 'admin' | 'mentor' | 'ambassador';
}

export function RealTimeAnalytics({ initialData = {}, userRole = 'admin' }: RealTimeAnalyticsProps) {
  const analyticsUpdates = useAnalyticsUpdates();
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    enrollments: { today: 0, thisWeek: 0, thisMonth: 0 },
    liveSessionsActive: 0,
    ambassadorStats: {
      totalAmbassadors: 0,
      activeReferrals: 0,
      totalCommissions: 0,
    },
    recentActivity: [],
    ...initialData,
  });
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (Object.keys(analyticsUpdates).length > 0) {
      setData(prev => ({ ...prev, ...analyticsUpdates }));
      
      // Highlight updated fields
      const newUpdatedFields = new Set(Object.keys(analyticsUpdates));
      setUpdatedFields(newUpdatedFields);
      
      // Clear highlights after 3 seconds
      const timer = setTimeout(() => {
        setUpdatedFields(new Set());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [analyticsUpdates]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return '📚';
      case 'course_created':
        return '🎓';
      case 'session_started':
        return '🎥';
      case 'payout_processed':
        return '💰';
      default:
        return '📊';
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = 'blue', 
    fieldKey,
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    icon: string; 
    color?: string; 
    fieldKey?: string;
    subtitle?: string;
  }) => {
    const isUpdated = fieldKey && updatedFields.has(fieldKey);
    const colorClasses = {
      blue: 'bg-info',
      green: 'bg-secondary-light',
      purple: 'bg-primary-light',
      orange: 'bg-accent-light',
      red: 'bg-error',
    };

    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${isUpdated ? 'ring-2 ring-blue-500 animate-pulse' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`w-12 h-12 ${colorClasses[color as keyof typeof colorClasses]} rounded-full flex items-center justify-center`}>
            <span className="text-white text-xl">{icon}</span>
          </div>
        </div>
        {isUpdated && (
          <div className="mt-2 text-xs text-info flex items-center">
            <span className="animate-bounce mr-1">📈</span>
            Updated now
          </div>
        )}
      </div>
    );
  };

  const renderAdminDashboard = () => (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={data.totalUsers}
          icon="👥"
          color="blue"
          fieldKey="totalUsers"
        />
        <StatCard
          title="Active Users"
          value={data.activeUsers}
          icon="🟢"
          color="green"
          fieldKey="activeUsers"
        />
        <StatCard
          title="Total Courses"
          value={data.totalCourses}
          icon="📚"
          color="purple"
          fieldKey="totalCourses"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${data.totalRevenue.toLocaleString()}`}
          icon="💰"
          color="green"
          fieldKey="totalRevenue"
        />
      </div>

      {/* Enrollment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Enrollments Today"
          value={data.enrollments.today}
          icon="📈"
          color="blue"
          fieldKey="enrollments"
        />
        <StatCard
          title="This Week"
          value={data.enrollments.thisWeek}
          icon="📊"
          color="purple"
          fieldKey="enrollments"
        />
        <StatCard
          title="This Month"
          value={data.enrollments.thisMonth}
          icon="🎯"
          color="orange"
          fieldKey="enrollments"
        />
      </div>

      {/* Live Sessions & Ambassador Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Live Sessions Active"
          value={data.liveSessionsActive}
          icon="🎥"
          color="red"
          fieldKey="liveSessionsActive"
        />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ambassador Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Ambassadors</span>
              <span className="font-semibold">{data.ambassadorStats.totalAmbassadors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Referrals</span>
              <span className="font-semibold">{data.ambassadorStats.activeReferrals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Commissions</span>
              <span className="font-semibold">₹{data.ambassadorStats.totalCommissions.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderMentorDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="My Courses"
        value={data.totalCourses}
        icon="📚"
        color="blue"
        fieldKey="totalCourses"
      />
      <StatCard
        title="Total Enrollments"
        value={data.enrollments.thisMonth}
        icon="👥"
        color="green"
        fieldKey="enrollments"
      />
      <StatCard
        title="Revenue This Month"
        value={`₹${data.totalRevenue.toLocaleString()}`}
        icon="💰"
        color="purple"
        fieldKey="totalRevenue"
      />
    </div>
  );

  const renderAmbassadorDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Active Referrals"
        value={data.ambassadorStats.activeReferrals}
        icon="🔗"
        color="blue"
        fieldKey="ambassadorStats"
      />
      <StatCard
        title="Total Commissions"
        value={`₹${data.ambassadorStats.totalCommissions.toLocaleString()}`}
        icon="💰"
        color="green"
        fieldKey="ambassadorStats"
      />
      <StatCard
        title="This Month"
        value={data.enrollments.thisMonth}
        icon="📈"
        color="purple"
        fieldKey="enrollments"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Dashboard based on user role */}
      {userRole === 'admin' && renderAdminDashboard()}
      {userRole === 'mentor' && renderMentorDashboard()}
      {userRole === 'ambassador' && renderAmbassadorDashboard()}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-secondary-light rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>

        {data.recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.recentActivity.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {getActivityIcon(activity.type)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                {activity.value && (
                  <div className="text-sm font-semibold text-secondary">
                    +₹{activity.value.toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


