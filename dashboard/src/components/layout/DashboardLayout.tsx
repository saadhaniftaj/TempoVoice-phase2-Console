'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Create background particles
    const bgElement = document.getElementById('bgParticles');
    if (bgElement) {
      // Clear existing particles
      bgElement.innerHTML = '';
      
              // Create new particles with different sizes
              for (let i = 0; i < 300; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + 'vw';
                particle.style.top = Math.random() * 100 + 'vh';
                particle.style.animationDuration = (5 + Math.random() * 15) + 's';
                particle.style.opacity = (Math.random() * 0.4 + 0.6).toString();
                
                // Different sizes
                const size = Math.random() * 4 + 2; // 2px to 6px
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                particle.style.borderRadius = '50%';
                
                bgElement.appendChild(particle);
              }
    }
  }, []);

  return (
    <div className="h-screen flex relative">
      {/* Background Particles */}
      <div className="bg-animation" id="bgParticles"></div>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:relative lg:w-64`}>
        <div className="fixed inset-y-0 left-0 z-50 w-64 lg:static">
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Header 
          title={title} 
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
