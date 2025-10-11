'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Phone, Play, Pause, Trash2, Edit, MoreVertical, Copy, CheckCircle } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  status: 'DRAFT' | 'PENDING' | 'DEPLOYING' | 'ACTIVE' | 'ERROR';
  callPhoneNumber: string;
  webhookEndpoint?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AgentsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAgents();
    }
  }, [isAuthenticated]);

  const loadAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setAgents(agents.filter(agent => agent.id !== agentId));
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete agent');
      }
    } catch (error) {
      alert('An unexpected error occurred');
    }
  };

  const handleStopAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to stop this agent?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/agents/${agentId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        loadAgents(); // Reload to get updated status
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to stop agent');
      }
    } catch (error) {
      alert('An unexpected error occurred');
    }
  };

  const handleStartAgent = async (agentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/agents/${agentId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        loadAgents(); // Reload to get updated status
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to start agent');
      }
    } catch (error) {
      alert('An unexpected error occurred');
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
          console.error('Fallback copy failed:', err);
          alert('Failed to copy to clipboard');
        }
        
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DEPLOYING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Agents" 
      subtitle="Manage your voice AI agents"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Voice AI Agents</h1>
            <p className="text-gray-600 mt-1">Create and manage your voice AI agents</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/agents/new')}
            className="new-agent-button flex items-center space-x-2"
          >
            <Bot className="w-4 h-4" />
            <span>Create Agent</span>
          </Button>
        </div>

        {/* Agents Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Agents</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first voice AI agent</p>
              <Button
                onClick={() => router.push('/dashboard/agents/new')}
                className="new-agent-button"
              >
                <Bot className="w-4 h-4 mr-2" />
                Create First Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="vanguard-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-900">{agent.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Phone className="w-4 h-4" />
                      <span>{agent.callPhoneNumber}</span>
                    </div>
                  </div>

                  {agent.webhookEndpoint && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Webhook URL:
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 text-xs bg-gray-100 px-2 py-1 rounded truncate">
                          {agent.webhookEndpoint}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(agent.webhookEndpoint!, agent.id)}
                          className="px-2 py-1"
                        >
                          {copiedId === agent.id ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    Created: {new Date(agent.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex space-x-2">
                    {agent.status === 'ACTIVE' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStopAgent(agent.id)}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                    ) : agent.status === 'ERROR' || agent.status === 'DRAFT' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartAgent(agent.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    ) : null}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}