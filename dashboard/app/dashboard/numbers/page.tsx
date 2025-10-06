'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Plus, Copy, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';

interface PhoneNumber {
  id: string;
  number: string;
  description?: string;
  isAvailable: boolean;
  agentId?: string;
  webhookUrl?: string;
  agent?: {
    id: string;
    name: string;
  };
}

export default function NumbersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPhoneNumbers();
    }
  }, [isAuthenticated]);

  const loadPhoneNumbers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/phone-numbers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setPhoneNumbers(data.phoneNumbers);
      }
    } catch (error) {
      console.error('Error loading phone numbers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;

    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/phone-numbers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: newNumber.trim(),
          description: newDescription.trim() || undefined,
        }),
      });

      if (response.ok) {
        setNewNumber('');
        setNewDescription('');
        setShowAddForm(false);
        loadPhoneNumbers();
      }
    } catch (error) {
      console.error('Error adding phone number:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteNumber = async (id: string) => {
    if (!confirm('Are you sure you want to delete this phone number?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/phone-numbers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        loadPhoneNumbers();
      }
    } catch (error) {
      console.error('Error deleting phone number:', error);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
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
      title="Phone Numbers" 
      subtitle="Manage your available phone numbers"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Phone Numbers</h1>
            <p className="text-gray-600 mt-1">Manage your available phone numbers for agents</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="new-agent-button flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Number</span>
          </Button>
        </div>

        {/* Add Number Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Phone Number</CardTitle>
              <CardDescription>
                Add a new phone number that can be assigned to agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNumber} className="space-y-4">
                <div>
                  <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <Input
                    id="number"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    placeholder="+1234567890"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <Input
                    id="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g., Customer Support Line"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={isAdding || !newNumber.trim()}
                    className="signin-button"
                  >
                    {isAdding ? 'Adding...' : 'Add Number'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewNumber('');
                      setNewDescription('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Phone Numbers Grid */}
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
        ) : phoneNumbers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Phone Numbers</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first phone number</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="new-agent-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Number
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {phoneNumbers.map((phoneNumber) => (
              <Card key={phoneNumber.id} className="vanguard-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-900">{phoneNumber.number}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {phoneNumber.isAvailable ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>

                  {phoneNumber.description && (
                    <p className="text-sm text-gray-600 mb-4">{phoneNumber.description}</p>
                  )}

                  {phoneNumber.agent && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Assigned to Agent:</p>
                      <p className="text-sm text-blue-700">{phoneNumber.agent.name}</p>
                    </div>
                  )}

                  {phoneNumber.webhookUrl && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Webhook URL:
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 text-xs bg-gray-100 px-2 py-1 rounded truncate">
                          {phoneNumber.webhookUrl}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(phoneNumber.webhookUrl!, phoneNumber.id)}
                          className="px-2 py-1"
                        >
                          {copiedId === phoneNumber.id ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {phoneNumber.isAvailable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteNumber(phoneNumber.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    )}
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
