'use client';

import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmptyState } from '@/components/ui/empty-state';
import { Settings, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <DashboardLayout title="Access Denied" subtitle="You don't have permission to access this page">
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access system settings.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="System Settings" 
      subtitle="Configure system-wide settings and preferences"
    >
      <EmptyState
        icon={<Settings className="w-12 h-12 text-blue-500" />}
        title="Settings Coming Soon"
        description="System configuration and settings will be available here."
        action={{
          label: "View Dashboard",
          onClick: () => router.push('/dashboard')
        }}
      />
    </DashboardLayout>
  );
}
