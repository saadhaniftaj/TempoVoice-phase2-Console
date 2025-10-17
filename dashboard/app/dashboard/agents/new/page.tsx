'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Bot, Phone, Settings, MessageSquare, Shield, Zap } from 'lucide-react';

export default function NewAgentPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [webhookEndpoint, setWebhookEndpoint] = useState('');
  const [availableNumbers, setAvailableNumbers] = useState<Array<{id: string, number: string, description?: string}>>([]);

  const [formData, setFormData] = useState({
    name: '',
    knowledgeBase: '',
    prompt: '',
    guardrails: '',
    makeEndpoint: '',
    callPhoneNumber: '',
    transferPhoneNumber: '',
    summaryPhoneNumber: '',
    twilioAccountSid: process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID || '',
    twilioApiSecret: process.env.NEXT_PUBLIC_TWILIO_API_SECRET || '',
    twilioApiSid: process.env.NEXT_PUBLIC_TWILIO_API_SID || '',
    voiceId: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAvailableNumbers();
      loadClonedData();
    }
  }, [isAuthenticated]);

  const loadClonedData = () => {
    const clonedData = localStorage.getItem('clonedAgentData');
    if (clonedData) {
      try {
        const parsedData = JSON.parse(clonedData);
        setFormData(prev => ({
          ...prev,
          ...parsedData,
          callPhoneNumber: '', // Always clear phone number for cloned agents
          name: parsedData.name || prev.name
        }));
        // Clear the cloned data from localStorage
        localStorage.removeItem('clonedAgentData');
      } catch (error) {
        console.error('Error parsing cloned agent data:', error);
      }
    }
  };

  const loadAvailableNumbers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/phone-numbers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json() as { phoneNumbers: Array<{ id: string; number: string; description?: string; isAvailable: boolean }> };
      if (response.ok) {
        setAvailableNumbers(data.phoneNumbers.filter((num) => num.isAvailable));
      }
    } catch (error) {
      console.error('Error loading phone numbers:', error);
    }
  };

  const isFormValid = () => {
    // Only require: phone number, voice, and Twilio credentials
    const requiredFields = {
      callPhoneNumber: formData.callPhoneNumber,
      voiceId: formData.voiceId,
      twilioAccountSid: formData.twilioAccountSid,
      twilioApiSecret: formData.twilioApiSecret,
      twilioApiSid: formData.twilioApiSid
    };
    
    return Object.values(requiredFields).every(value => value.trim() !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError('Phone number, voice selection, and Twilio credentials are required');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Use the webhook URL from deployment (Lambda returns /incoming-call endpoint)
        const webhookUrl = data.deployment?.webhookUrl || data.agent.webhookEndpoint;
        
        setSuccess('Agent created and deployed successfully!');
        setWebhookEndpoint(webhookUrl);
        
        // Always redirect to agents list after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/agents');
        }, 2000);
      } else {
        setError(data.message || 'Failed to create agent');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  return (
    <DashboardLayout 
      title="Create New Agent" 
      subtitle="Configure your voice AI agent - only phone number, voice, and Twilio credentials are required"
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>

        {/* Success Message with Webhook */}
        {success && webhookEndpoint && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Agent Created Successfully!</h3>
            </div>
            <p className="text-green-700 mb-3">Your agent is now deployed and ready to receive calls.</p>
            <div className="bg-white p-3 rounded border">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Endpoint:
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                  {webhookEndpoint}
                </code>
                <Button
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(webhookEndpoint)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✗</span>
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-500" />
                <span>Basic Information</span>
              </CardTitle>
              <CardDescription>
                Essential details for your voice AI agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter agent name (e.g., Customer Support Bot)"
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <span>AI Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure the AI behavior and knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="knowledgeBase" className="block text-sm font-medium text-gray-700 mb-2">
                  Knowledge Base
                </label>
                <Textarea
                  id="knowledgeBase"
                  name="knowledgeBase"
                  value={formData.knowledgeBase}
                  onChange={handleInputChange}
                  placeholder="Enter knowledge base content or instructions..."
                  rows={4}
                />
              </div>
              
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt
                </label>
                <Textarea
                  id="prompt"
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleInputChange}
                  placeholder="Enter the system prompt for the AI agent..."
                  rows={4}
                />
              </div>
              
              <div>
                <label htmlFor="guardrails" className="block text-sm font-medium text-gray-700 mb-2">
                  Guardrails
                </label>
                <Textarea
                  id="guardrails"
                  name="guardrails"
                  value={formData.guardrails}
                  onChange={handleInputChange}
                  placeholder="Enter safety guardrails and restrictions..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Voice Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <span>Voice Configuration</span>
              </CardTitle>
              <CardDescription>
                Select the voice characteristics for your AI agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="voiceId" className="block text-sm font-medium text-gray-700 mb-2">
                  Voice ID <span className="text-red-500">*</span>
                </label>
                <select
                  id="voiceId"
                  name="voiceId"
                  value={formData.voiceId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a voice</option>
                  <optgroup label="English (US)">
                    <option value="tiffany">Tiffany - Feminine-sounding voice</option>
                    <option value="matthew">Matthew - Masculine-sounding voice</option>
                  </optgroup>
                  <optgroup label="English (GB)">
                    <option value="amy">Amy - Feminine-sounding voice</option>
                  </optgroup>
                  <optgroup label="French">
                    <option value="ambre">Ambre - Feminine-sounding voice</option>
                    <option value="florian">Florian - Masculine-sounding voice</option>
                  </optgroup>
                  <optgroup label="Italian">
                    <option value="beatrice">Beatrice - Feminine-sounding voice</option>
                    <option value="lorenzo">Lorenzo - Masculine-sounding voice</option>
                  </optgroup>
                  <optgroup label="German">
                    <option value="greta">Greta - Feminine-sounding voice</option>
                    <option value="lennart">Lennart - Masculine-sounding voice</option>
                  </optgroup>
                  <optgroup label="Spanish">
                    <option value="lupe">Lupe - Feminine-sounding voice</option>
                    <option value="carlos">Carlos - Masculine-sounding voice</option>
                  </optgroup>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Choose the voice that best matches your brand and audience preferences.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Integration Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <span>Integration Settings</span>
              </CardTitle>
              <CardDescription>
                Configure external service integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="makeEndpoint" className="block text-sm font-medium text-gray-700 mb-2">
                  Make.com Endpoint
                </label>
                <Input
                  id="makeEndpoint"
                  name="makeEndpoint"
                  value={formData.makeEndpoint}
                  onChange={handleInputChange}
                  placeholder="https://hook.eu1.make.com/..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Phone Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-blue-500" />
                <span>Phone Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure phone numbers and call handling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="callPhoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Call Phone Number <span className="text-red-500">*</span>
                </label>
                <select
                  id="callPhoneNumber"
                  name="callPhoneNumber"
                  value={formData.callPhoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a phone number</option>
                  {availableNumbers.map((number) => (
                    <option key={number.id} value={number.number}>
                      {number.number} {number.description && `- ${number.description}`}
                    </option>
                  ))}
                </select>
                {availableNumbers.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No available phone numbers. <a href="/dashboard/numbers" className="text-blue-600 hover:underline">Add some first</a>
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="transferPhoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Endpoint Phone Number
                </label>
                <Input
                  id="transferPhoneNumber"
                  name="transferPhoneNumber"
                  value={formData.transferPhoneNumber}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                />
              </div>
              
              <div>
                <label htmlFor="summaryPhoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Summary Message Phone Number
                </label>
                <Input
                  id="summaryPhoneNumber"
                  name="summaryPhoneNumber"
                  value={formData.summaryPhoneNumber}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                />
              </div>
            </CardContent>
          </Card>

          {/* Twilio Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <span>Twilio Configuration</span>
              </CardTitle>
              <CardDescription>
                Twilio account credentials for telephony
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="twilioAccountSid" className="block text-sm font-medium text-gray-700 mb-2">
                  Twilio Account SID <span className="text-red-500">*</span>
                </label>
                <Input
                  id="twilioAccountSid"
                  name="twilioAccountSid"
                  value={formData.twilioAccountSid}
                  onChange={handleInputChange}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="twilioApiSecret" className="block text-sm font-medium text-gray-700 mb-2">
                  Twilio API Secret <span className="text-red-500">*</span>
                </label>
                <Input
                  id="twilioApiSecret"
                  name="twilioApiSecret"
                  type="password"
                  value={formData.twilioApiSecret}
                  onChange={handleInputChange}
                  placeholder="Enter Twilio API secret"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="twilioApiSid" className="block text-sm font-medium text-gray-700 mb-2">
                  Twilio API SID <span className="text-red-500">*</span>
                </label>
                <Input
                  id="twilioApiSid"
                  name="twilioApiSid"
                  value={formData.twilioApiSid}
                  onChange={handleInputChange}
                  placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Creating Agent...' : 'Launch Agent'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
