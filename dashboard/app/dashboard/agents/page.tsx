'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Phone, Play, Pause, Trash2, Edit, MoreVertical, Copy, CheckCircle, Files, Folder } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { FolderSelector } from '@/components/ui/folder-selector';

interface Agent {
  id: string;
  name: string;
  status: 'DRAFT' | 'PENDING' | 'DEPLOYING' | 'ACTIVE' | 'ERROR';
  callPhoneNumber: string;
  webhookEndpoint?: string;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
  folder?: {
    id: string;
    name: string;
    color?: string;
  };
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  agents: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

export default function AgentsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFolders, setShowFolders] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Removed folder selection and dialog state - now handled by FolderSelector

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && mounted) {
      loadAgents();
      loadFolders();
    }
  }, [isAuthenticated, mounted]);

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

  const loadFolders = async () => {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/folders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      } else {
        console.error('Failed to load folders');
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const handleCreateFolder = async (name: string, description?: string, color?: string) => {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        const data = await response.json();
        setFolders(prev => [...prev, data.folder]);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  };

  const handleMoveToFolder = async (agentId: string, folderId: string | null) => {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`/api/agents/${agentId}/folder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId }),
      });

      if (response.ok) {
        const updatedAgent = await response.json();
        setAgents(prev => prev.map(agent => 
          agent.id === agentId ? updatedAgent : agent
        ));
        // Reload folders to update agent counts
        loadFolders();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move agent');
      }
    } catch (error) {
      console.error('Error moving agent:', error);
      throw error;
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

  const handleCloneAgent = async (agent: Agent) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/agents/${agent.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const agentData = await response.json();
        
        // Remove phone number and ID from cloned data
        const clonedData = {
          ...agentData,
          name: `${agentData.name} (Copy)`,
          callPhoneNumber: '', // Remove phone number
          status: 'DRAFT' // Reset status
        };
        
        // Store cloned data in localStorage and navigate to create page
        localStorage.setItem('clonedAgentData', JSON.stringify(clonedData));
        router.push('/dashboard/agents/new?cloned=true');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to fetch agent data for cloning');
      }
    } catch (error) {
      console.error('Error cloning agent:', error);
      alert('An unexpected error occurred while cloning the agent');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'DEPLOYING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800  ';
    }
  };

  // Filter agents based on view mode
  const displayData = showFolders ? folders : agents;

  if (!isAuthenticated || !user || !mounted) {
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
      <div className="max-w-7xl mx-auto">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Voice AI Agents</h1>
            <p className="text-gray-600 mt-1">Create and manage your voice AI agents</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowFolders(!showFolders)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Folder className="w-4 h-4" />
              <span>{showFolders ? 'Show All Agents' : 'Show Folders'}</span>
            </Button>
            <Button
              onClick={() => router.push('/dashboard/agents/new')}
              className="new-agent-button flex items-center space-x-2"
            >
              <Bot className="w-4 h-4" />
              <span>Create Agent</span>
            </Button>
          </div>
        </div>

        {/* Content */}
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
              <Bot className="w-12 h-12 text-gray-400  mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900  mb-2">No Agents</h3>
              <p className="text-gray-600  mb-4">Get started by creating your first voice AI agent</p>
              <Button
                onClick={() => router.push('/dashboard/agents/new')}
                className="new-agent-button"
              >
                <Bot className="w-4 h-4 mr-2" />
                Create First Agent
              </Button>
            </CardContent>
          </Card>
        ) : showFolders ? (
          /* Folder View */
          <div className="space-y-6">
            {folders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Folder className="w-12 h-12 text-gray-400  mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900  mb-2">No Folders</h3>
                  <p className="text-gray-600  mb-4">Create folders to organize your agents</p>
                  <p className="text-sm text-gray-500 ">Use the three-dot menu on any agent to create folders</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {folders.map((folder) => (
                <Card key={folder.id} className="vanguard-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Folder className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{folder.name}</CardTitle>
                          {folder.description && (
                            <CardDescription className="mt-1">{folder.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 ">
                        {folder.agents.length} agent{folder.agents.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {folder.agents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 ">
                        <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No agents in this folder</p>
                        <p className="text-sm">Use the three-dot menu on agents to move them here</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {folder.agents.map((agent) => {
                          const fullAgent = agents.find(a => a.id === agent.id);
                          if (!fullAgent) return null;
                          return (
                            <Card key={agent.id} className="border border-gray-200 ">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <Bot className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium text-gray-900  text-sm">{agent.name}</span>
                                  </div>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                                    {agent.status}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-600  mb-3">
                                  <Phone className="w-3 h-3" />
                                  <span>{fullAgent.callPhoneNumber}</span>
                                </div>
                                <div className="flex space-x-2">
                                  {fullAgent.status === 'ACTIVE' ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStopAgent(fullAgent.id)}
                                      className="text-orange-600 hover:text-orange-700 text-xs px-2 py-1"
                                    >
                                      <Pause className="w-3 h-3 mr-1" />
                                      Stop
                                    </Button>
                                  ) : fullAgent.status === 'ERROR' || fullAgent.status === 'DRAFT' ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStartAgent(fullAgent.id)}
                                      className="text-green-600 hover:text-green-700 text-xs px-2 py-1"
                                    >
                                      <Play className="w-3 h-3 mr-1" />
                                      Start
                                    </Button>
                                  ) : null}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0 hover:bg-gray-100 "
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                        <span className="sr-only">Open menu</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem
                                        onClick={() => handleCloneAgent(fullAgent)}
                                        className="cursor-pointer"
                                      >
                                        <Files className="mr-2 h-4 w-4" />
                                        <span>Clone Agent</span>
                                      </DropdownMenuItem>
                                      <FolderSelector
                                        folders={folders}
                                        onFolderCreate={handleCreateFolder}
                                        onMoveToFolder={async (folderId) => {
                                          await handleMoveToFolder(fullAgent.id, folderId);
                                        }}
                                        currentFolderId={fullAgent.folderId}
                                      />
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteAgent(fullAgent.id)}
                                        className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete Agent</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                ))}
                
                {/* Unorganized Agents */}
                {(() => {
                  const unorganizedAgents = agents.filter(agent => !agent.folderId);
                  if (unorganizedAgents.length > 0) {
                    return (
                      <Card className="vanguard-card">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-xl">Unorganized Agents</CardTitle>
                                <CardDescription className="mt-1">Agents not assigned to any folder</CardDescription>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 ">
                              {unorganizedAgents.length} agent{unorganizedAgents.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unorganizedAgents.map((agent) => (
                              <Card key={agent.id} className="border border-gray-200 ">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <Bot className="w-4 h-4 text-blue-500" />
                                      <span className="font-medium text-gray-900  text-sm">{agent.name}</span>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                                      {agent.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-xs text-gray-600  mb-3">
                                    <Phone className="w-3 h-3" />
                                    <span>{agent.callPhoneNumber}</span>
                                  </div>
                                  <div className="flex space-x-2">
                                    {agent.status === 'ACTIVE' ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStopAgent(agent.id)}
                                        className="text-orange-600 hover:text-orange-700 text-xs px-2 py-1"
                                      >
                                        <Pause className="w-3 h-3 mr-1" />
                                        Stop
                                      </Button>
                                    ) : agent.status === 'ERROR' || agent.status === 'DRAFT' ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStartAgent(agent.id)}
                                        className="text-green-600 hover:text-green-700 text-xs px-2 py-1"
                                      >
                                        <Play className="w-3 h-3 mr-1" />
                                        Start
                                      </Button>
                                    ) : null}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 w-6 p-0 hover:bg-gray-100 "
                                        >
                                          <MoreVertical className="h-3 w-3" />
                                          <span className="sr-only">Open menu</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem
                                          onClick={() => handleCloneAgent(agent)}
                                          className="cursor-pointer"
                                        >
                                          <Files className="mr-2 h-4 w-4" />
                                          <span>Clone Agent</span>
                                        </DropdownMenuItem>
                                        <FolderSelector
                                          folders={folders}
                                          onFolderCreate={handleCreateFolder}
                                          onMoveToFolder={async (folderId) => {
                                            await handleMoveToFolder(agent.id, folderId);
                                          }}
                                          currentFolderId={agent.folderId}
                                        />
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteAgent(agent.id)}
                                          className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Delete Agent</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  return null;
                })()}
              </>
            )}
          </div>
        ) : (
          /* Agents Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="vanguard-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-900 ">{agent.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600  mb-2">
                      <Phone className="w-4 h-4" />
                      <span>{agent.callPhoneNumber}</span>
                    </div>
                  </div>

                  {agent.webhookEndpoint && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500  mb-1">
                        Webhook URL:
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 text-xs bg-gray-100  text-gray-900 dark:text-gray-100 px-2 py-1 rounded truncate">
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

                  <div className="text-xs text-gray-500  mb-4">
                    Created: {new Date(agent.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex justify-between items-center">
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
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 hover:bg-gray-100 "
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleCloneAgent(agent)}
                          className="cursor-pointer"
                        >
                          <Files className="mr-2 h-4 w-4" />
                          <span>Clone Agent</span>
                        </DropdownMenuItem>
                        <FolderSelector
                          folders={folders}
                          onFolderCreate={handleCreateFolder}
                          onMoveToFolder={async (folderId) => {
                            await handleMoveToFolder(agent.id, folderId);
                          }}
                          currentFolderId={agent.folderId}
                        />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete Agent</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Folder management now handled by FolderSelector in dropdown menu */}
    </DashboardLayout>
  );
}