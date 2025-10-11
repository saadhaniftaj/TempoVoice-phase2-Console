export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'DEVELOPER';
  tenantId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  phoneNumber?: string;
  voiceId?: string;
  status: 'DRAFT' | 'DEPLOYING' | 'ACTIVE' | 'ERROR';
  config: AgentConfig;
  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
}

export interface AgentConfig {
  knowledgeBase: string[];
  guardrails: {
    maxCallDuration: number;
    transferAfter: number;
    blockedTopics: string[];
  };
  transfer: {
    warmTransferNumber?: string;
    coldTransferNumber?: string;
  };
  webhooks: {
    callStarted?: string;
    callEnded?: string;
    transfer?: string;
  };
  whatsapp: {
    number?: string;
    summaryTemplate?: string;
  };
}

export interface Call {
  id: string;
  agentId: string;
  callSid?: string;
  fromNumber?: string;
  toNumber?: string;
  durationSec?: number;
  status?: string;
  transcript?: string;
  recordingUrl?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface DashboardStats {
  totalAgents: number;
  activeCalls: number;
  totalCalls: number;
  successRate: number;
}
