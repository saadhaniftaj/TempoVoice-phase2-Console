'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmptyState } from '@/components/ui/empty-state';
import { Bot, Phone, BarChart3, Users, Activity, TrendingUp, Clock, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    totalAgents: 0,
    activeCalls: 0,
    totalCalls: 0,
    systemStatus: 'Operational',
    recentActivity: [],
    performanceMetrics: {
      avgCallDuration: 0,
      successRate: 0,
      responseTime: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real app, this would come from API
      setDashboardData({
        totalAgents: 3,
        activeCalls: 2,
        totalCalls: 47,
        systemStatus: 'Operational',
        recentActivity: [
          { type: 'call', message: 'New call received on Agent Alpha', time: '2 minutes ago', status: 'success' },
          { type: 'agent', message: 'Agent Beta deployed successfully', time: '15 minutes ago', status: 'success' },
          { type: 'call', message: 'Call completed on Agent Gamma', time: '1 hour ago', status: 'success' },
          { type: 'system', message: 'System health check passed', time: '2 hours ago', status: 'info' }
        ],
        performanceMetrics: {
          avgCallDuration: 4.2,
          successRate: 94.5,
          responseTime: 1.8
        }
      });
      
      setIsLoading(false);
    };

    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Agents',
      value: isLoading ? '...' : dashboardData.totalAgents.toString(),
      description: isLoading ? 'Loading...' : `${dashboardData.totalAgents} agents deployed`,
      icon: Bot,
      color: 'text-blue-600',
      trend: '+2 this week'
    },
    {
      title: 'Active Calls',
      value: isLoading ? '...' : dashboardData.activeCalls.toString(),
      description: isLoading ? 'Loading...' : `${dashboardData.activeCalls} calls in progress`,
      icon: Phone,
      color: 'text-green-600',
      trend: 'Live'
    },
    {
      title: 'Total Calls',
      value: isLoading ? '...' : dashboardData.totalCalls.toString(),
      description: isLoading ? 'Loading...' : `${dashboardData.totalCalls} calls processed`,
      icon: BarChart3,
      color: 'text-purple-600',
      trend: '+12 today'
    },
    {
      title: 'Success Rate',
      value: isLoading ? '...' : `${dashboardData.performanceMetrics.successRate}%`,
      description: isLoading ? 'Loading...' : `${dashboardData.performanceMetrics.successRate}% success rate`,
      icon: TrendingUp,
      color: 'text-green-600',
      trend: '+2.1% this week'
    }
  ];

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Welcome to your TempoVoice control center"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="vanguard-card">
              <div className="flex flex-row items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">
                  {stat.title}
                </h3>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <p className="text-sm text-gray-500 mb-2">
                {stat.description}
              </p>
              {stat.trend && (
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="vanguard-card">
          <h3 className="text-xl font-bold text-white mb-2">Quick Actions</h3>
          <p className="text-gray-400 mb-6">Get started with your voice AI agents</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div 
              className="p-4 cursor-pointer hover:bg-gray-800 transition-all duration-200 border-2 border-dashed border-gray-600 hover:border-blue-400 rounded-xl"
              onClick={() => router.push('/dashboard/agents/new')}
            >
              <div className="text-center">
                <Bot className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-medium text-white">Create Agent</h4>
                <p className="text-sm text-gray-400">Set up a new voice AI agent</p>
              </div>
            </div>
            
            <div 
              className="p-4 cursor-pointer hover:bg-gray-800 transition-all duration-200 border-2 border-dashed border-gray-600 hover:border-blue-400 rounded-xl"
              onClick={() => router.push('/dashboard/calls')}
            >
              <div className="text-center">
                <Phone className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-medium text-white">View Calls</h4>
                <p className="text-sm text-gray-400">Monitor call activity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="vanguard-card">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Recent Activity</h3>
          <p className="text-gray-600 mb-6">Latest system events and call activity</p>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.status === 'success' ? 'bg-green-100' : 
                    activity.status === 'error' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {activity.type === 'call' && <Phone className="w-4 h-4 text-green-600" />}
                    {activity.type === 'agent' && <Bot className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'system' && <Settings className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="vanguard-card">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Performance</h3>
          <p className="text-gray-600 mb-6">Key performance indicators</p>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Call Duration</span>
              <span className="text-lg font-semibold text-gray-900">
                {isLoading ? '...' : `${dashboardData.performanceMetrics.avgCallDuration}m`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-lg font-semibold text-gray-900">
                {isLoading ? '...' : `${dashboardData.performanceMetrics.responseTime}s`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-lg font-semibold text-green-600">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}