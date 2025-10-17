'use client';

import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Bot, 
  Phone, 
  BarChart3, 
  Settings, 
  Users,
  LogOut,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Agents', href: '/dashboard/agents', icon: Bot },
    { name: 'Numbers', href: '/dashboard/numbers', icon: Phone },
    { name: 'Calls', href: '/dashboard/calls', icon: Phone },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    ...(user?.role === 'ADMIN' ? [
      { name: 'Users', href: '/dashboard/users', icon: Users },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ] : [])
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className={`flex flex-col h-full vanguard-sidebar ${className}`}>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg" style={{boxShadow: '0 0 12px #3b82f611'}}>
                  <Image 
                    src="/images/tempo-logo.png" 
                    alt="Tempo AI" 
                    width={32} 
                    height={32} 
                    className="logo-img"
                    priority
                  />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white" style={{letterSpacing: '-0.03em'}}>TempoVoice</span>
              </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.email}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {user?.role?.toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <button
              key={item.name}
              className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'text-white bg-blue-600 shadow-lg' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => router.push(item.href)}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-700 dark:border-gray-600 space-y-2">
                <button 
                  className="w-full new-agent-button flex items-center justify-center text-white font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                  onClick={() => router.push('/dashboard/agents/new')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Agent
                </button>
        
        <button 
          className="w-full btn-secondary flex items-center justify-center"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
}
