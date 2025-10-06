'use client';

import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmptyState } from '@/components/ui/empty-state';
import { Phone, PhoneCall, Clock, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CallsPage() {
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
      title="Call History" 
      subtitle="Monitor and analyze call performance"
    >
      <EmptyState
        icon={<Phone className="w-12 h-12 text-blue-500" />}
        title="No Calls Yet"
        description="Call history will appear here once your agents start receiving calls. Set up your first agent to get started."
        action={{
          label: "Create Agent",
          onClick: () => router.push('/dashboard/agents/new')
        }}
      />
    </DashboardLayout>
  );
}