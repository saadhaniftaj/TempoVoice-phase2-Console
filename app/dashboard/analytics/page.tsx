'use client';

import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AnalyticsPage() {
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

  return (
    <DashboardLayout 
      title="Analytics" 
      subtitle="Performance insights and metrics"
    >
      <EmptyState
        icon={<BarChart3 className="w-12 h-12 text-blue-500" />}
        title="Analytics Coming Soon"
        description="Detailed analytics and performance metrics will be available here once you start using the system."
        action={{
          label: "View Dashboard",
          onClick: () => router.push('/dashboard')
        }}
      />
    </DashboardLayout>
  );
}