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
  const [agentInvocationUrl, setAgentInvocationUrl] = useState('');
  const [s3BucketName, setS3BucketName] = useState('');
  const [availableNumbers, setAvailableNumbers] = useState<Array<{id: string, number: string, description?: string}>>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    knowledgeBase: '',
    prompt: '',
    guardrails: '',
    makeEndpoint: '',
    callPhoneNumber: '',
    transferPhoneNumber: '',
    summaryPhoneNumber: '',
    twilioAccountSid: '',
    twilioApiSecret: '',
    voiceId: '',
    // AWS Configuration
    awsAccessKey: '',
    awsSecretKey: '',
    awsRegion: 'us-east-1',
    // Additional Core Agent Fields
    sipEndpoint: '',
    novaPickupWebhookUrl: '',
    transcriptWebhookUrl: '',
    // Call Recording Settings
    enableRecording: true,
    enableTranscription: true,
    // Guard Rails Configuration
    maxConversationLength: '100',
    maxSessionDuration: '900000', // 15 minutes in milliseconds
    maxInappropriateAttempts: '5'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAvailableNumbers();
    }
  }, [isAuthenticated]);

  const loadAvailableNumbers = async () => {
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
        setAvailableNumbers(data.phoneNumbers.filter((num: any) => num.isAvailable));
      }
    } catch (error) {
      console.error('Error loading phone numbers:', error);
    }
  };

  const isFormValid = () => {
    const requiredFields = ['name', 'knowledgeBase', 'prompt', 'guardrails', 'callPhoneNumber', 'transferPhoneNumber', 'summaryPhoneNumber', 'twilioAccountSid', 'twilioApiSecret', 'voiceId'];
    return requiredFields.every(field => formData[field as keyof typeof formData]?.toString().trim() !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError('All fields are required');
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
        setSuccess('Agent created successfully!');
        setWebhookEndpoint(data.webhookEndpoint);
        setAgentInvocationUrl(data.agentInvocationUrl);
        setS3BucketName(data.s3BucketName);
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
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout 
      title="Create New Agent" 
      subtitle="Configure your voice AI agent with all required settings"
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

        {/* Success Message with URLs */}
        {success && webhookEndpoint && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Agent Created & Deployed Successfully!</h3>
            </div>
            <p className="text-green-700 mb-4">Your agent is now running on AWS Fargate and ready to receive calls.</p>
            
            <div className="space-y-3">
              {/* Agent Invocation URL for Twilio */}
              <div className="bg-white p-3 rounded border">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🎯 Agent Invocation URL (Add this to Twilio):
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                    {agentInvocationUrl || webhookEndpoint}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(agentInvocationUrl || webhookEndpoint)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Configure this URL in your Twilio phone number's webhook settings
                </p>
              </div>

              {/* Webhook Endpoint */}
              <div className="bg-white p-3 rounded border">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🔗 Webhook Endpoint:
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

              {/* S3 Bucket for Transcripts */}
              {s3BucketName && (
                <div className="bg-white p-3 rounded border">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📁 S3 Bucket for Transcripts:
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                      {s3BucketName}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(s3BucketName)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Call transcripts and recordings will be stored in this bucket
                  </p>
                </div>
              )}
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
                  Agent Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter agent name (e.g., Customer Support Bot)"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the agent's purpose..."
                  rows={2}
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
                  Knowledge Base *
                </label>
                <Textarea
                  id="knowledgeBase"
                  name="knowledgeBase"
                  value={formData.knowledgeBase}
                  onChange={handleInputChange}
                  placeholder="Enter knowledge base content or instructions..."
                  rows={4}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt *
                </label>
                <Textarea
                  id="prompt"
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleInputChange}
                  placeholder="Enter the system prompt for the AI agent..."
                  rows={4}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="guardrails" className="block text-sm font-medium text-gray-700 mb-2">
                  Guardrails *
                </label>
                <Textarea
                  id="guardrails"
                  name="guardrails"
                  value={formData.guardrails}
                  onChange={handleInputChange}
                  placeholder="Enter safety guardrails and restrictions..."
                  rows={3}
                  required
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
                  Voice ID *
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
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Choose the voice that best matches your brand and audience preferences.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AWS Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <span>AWS Configuration</span>
              </CardTitle>
              <CardDescription>
                AWS credentials and region for Nova Sonic integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="awsAccessKey" className="block text-sm font-medium text-gray-700 mb-2">
                  AWS Access Key ID
                </label>
                <Input
                  id="awsAccessKey"
                  name="awsAccessKey"
                  type="password"
                  value={formData.awsAccessKey}
                  onChange={handleInputChange}
                  placeholder="AKIA..."
                />
              </div>
              
              <div>
                <label htmlFor="awsSecretKey" className="block text-sm font-medium text-gray-700 mb-2">
                  AWS Secret Access Key
                </label>
                <Input
                  id="awsSecretKey"
                  name="awsSecretKey"
                  type="password"
                  value={formData.awsSecretKey}
                  onChange={handleInputChange}
                  placeholder="Enter AWS secret key"
                />
              </div>
              
              <div>
                <label htmlFor="awsRegion" className="block text-sm font-medium text-gray-700 mb-2">
                  AWS Region *
                </label>
                <select
                  id="awsRegion"
                  name="awsRegion"
                  value={formData.awsRegion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
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
                  Make.com Endpoint *
                </label>
                <Input
                  id="makeEndpoint"
                  name="makeEndpoint"
                  value={formData.makeEndpoint}
                  onChange={handleInputChange}
                  placeholder="https://hook.eu1.make.com/..."
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Advanced Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <span>Advanced Configuration</span>
              </CardTitle>
              <CardDescription>
                Additional settings for call handling and webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="sipEndpoint" className="block text-sm font-medium text-gray-700 mb-2">
                  SIP Endpoint (Optional)
                </label>
                <Input
                  id="sipEndpoint"
                  name="sipEndpoint"
                  value={formData.sipEndpoint}
                  onChange={handleInputChange}
                  placeholder="username@domain.sip.twilio.com"
                />
                <p className="text-sm text-gray-500 mt-1">
                  For human agent transfers via SIP
                </p>
              </div>
              
              <div>
                <label htmlFor="novaPickupWebhookUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Pickup Webhook URL (Optional)
                </label>
                <Input
                  id="novaPickupWebhookUrl"
                  name="novaPickupWebhookUrl"
                  value={formData.novaPickupWebhookUrl}
                  onChange={handleInputChange}
                  placeholder="https://your-webhook-url.com/nova-pickup"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Webhook triggered when Nova picks up the call
                </p>
              </div>
              
              <div>
                <label htmlFor="transcriptWebhookUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Transcript Webhook URL (Optional)
                </label>
                <Input
                  id="transcriptWebhookUrl"
                  name="transcriptWebhookUrl"
                  value={formData.transcriptWebhookUrl}
                  onChange={handleInputChange}
                  placeholder="https://your-webhook-url.com/transcript"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Webhook for receiving call transcripts
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Conversation Length
                  </label>
                  <Input
                    name="maxConversationLength"
                    type="number"
                    value={formData.maxConversationLength}
                    onChange={handleInputChange}
                    placeholder="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Session Duration (ms)
                  </label>
                  <Input
                    name="maxSessionDuration"
                    type="number"
                    value={formData.maxSessionDuration}
                    onChange={handleInputChange}
                    placeholder="900000"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="enableRecording"
                    checked={formData.enableRecording}
                    onChange={(e) => setFormData(prev => ({ ...prev, enableRecording: e.target.checked }))}
                    className="mr-2"
                  />
                  Enable Call Recording
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="enableTranscription"
                    checked={formData.enableTranscription}
                    onChange={(e) => setFormData(prev => ({ ...prev, enableTranscription: e.target.checked }))}
                    className="mr-2"
                  />
                  Enable Transcription
                </label>
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
                  Call Phone Number *
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
                  Transfer Endpoint Phone Number *
                </label>
                <Input
                  id="transferPhoneNumber"
                  name="transferPhoneNumber"
                  value={formData.transferPhoneNumber}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="summaryPhoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Summary Message Phone Number *
                </label>
                <Input
                  id="summaryPhoneNumber"
                  name="summaryPhoneNumber"
                  value={formData.summaryPhoneNumber}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  required
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
                  Twilio Account SID *
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
                  Twilio API Secret *
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
