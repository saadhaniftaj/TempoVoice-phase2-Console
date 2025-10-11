'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Create background particles
    const bgElement = document.getElementById('bgParticles');
    if (bgElement) {
      // Clear existing particles
      bgElement.innerHTML = '';
      
              // Create new particles with different sizes
              for (let i = 0; i < 200; i++) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background Particles */}
      <div className="bg-animation" id="bgParticles"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-32 h-32 rounded-xl flex items-center justify-center shadow-lg" style={{boxShadow: '0 0 30px #3b82f644'}}>
              <Image 
                src="/images/tempo-logo.png" 
                alt="Tempo AI" 
                width={96} 
                height={96} 
                className="logo-img"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2" style={{
            letterSpacing: '-1.2px',
            textShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
          }}>
            TempoVoice Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Multi-tenant Voice AI Agent Management Platform
          </p>
        </div>
        
        <div className="vanguard-card">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
                  </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="vanguard-input w-full"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="vanguard-input w-full"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                {error}
              </div>
            )}

                    <button
                      type="submit"
                      className="w-full signin-button text-white font-medium px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-[10px] text-gray-500">
            Developed by Vanguard Solutions
          </p>
        </div>
      </div>
    </div>
  );
}
