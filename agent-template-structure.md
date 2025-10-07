# 🎯 **TempoVoice Agent Template Repository Structure**

## 📁 **Repository: `tempo-voice-agent-template`**

This repository contains the **configurable version** of your Phase 1 agent that can be deployed dynamically via the dashboard.

```
tempo-voice-agent-template/
├── src/
│   ├── server.ts                    # Main Fastify server (configurable)
│   ├── config-loader.ts            # Environment-based configuration loader
│   ├── nova-client.ts              # Nova Sonic integration (from Phase 1)
│   ├── knowledge-base-service.ts   # Dynamic KB loader (from Phase 1)
│   ├── voice-config.ts             # Voice selection service (from Phase 1)
│   ├── guard-rails.ts              # Configurable guardrails service
│   ├── call-recording-service.ts   # Call recording (from Phase 1)
│   ├── simple-call-transfer.ts     # Call transfer (from Phase 1)
│   ├── voicemail-service.ts        # Voicemail (from Phase 1)
│   ├── transcript-storage-service.ts # Transcript storage (from Phase 1)
│   ├── transcript-api-endpoints.ts # API endpoints (from Phase 1)
│   ├── types.ts                    # TypeScript definitions
│   └── consts.ts                   # Constants
├── Dockerfile                      # Container configuration
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── .env.example                    # Environment variables template
├── docker-compose.yml              # Local development
└── README.md                       # Documentation
```

---

## 🔧 **Key Modifications from Phase 1**

### **1. Configurable Server.ts**
```typescript
// src/server.ts (modified for multi-tenancy)
import Fastify from 'fastify';
import { ConfigLoader } from './config-loader';
import { KnowledgeBaseService } from './knowledge-base-service';
import { VoiceConfigService } from './voice-config';
import { GuardRailsService } from './guard-rails';
import { CallRecordingService } from './call-recording-service';
import { SimpleCallTransferService } from './simple-call-transfer';
import { VoicemailService } from './voicemail-service';
import { TranscriptStorageService } from './transcript-storage-service';

// Load configuration from environment variables
const config = ConfigLoader.loadConfig();

// Initialize services with loaded configuration
const knowledgeBaseService = new KnowledgeBaseService(config.knowledgeBase);
const voiceConfigService = new VoiceConfigService(config.voiceId);
const guardRailsService = new GuardRailsService({
  maxConversationLength: config.maxConversationLength,
  maxSessionDuration: config.maxSessionDuration,
  maxInappropriateAttempts: config.maxInappropriateAttempts,
  customRules: config.guardrails
});

const callRecordingService = new CallRecordingService(config.enableRecording);
const simpleCallTransferService = new SimpleCallTransferService(config.transferPhoneNumber);
const voicemailService = new VoicemailService(config.summaryPhoneNumber);
const transcriptStorageService = new TranscriptStorageService(config.s3BucketName, config.awsRegion);

// Create dynamic system prompt
const createSystemPrompt = () => {
  return `${config.agentPrompt}

🎯 TOOL CALLING INSTRUCTIONS (CRITICAL):
You are ${config.agentName} - ${config.agentDescription}

Available tools:
1. end_call - End the conversation gracefully
2. transfer_call - Transfer to human agent
3. voicemail - Let customer leave message
4. schedule_callback - Schedule callback

⚠️ CRITICAL: When customer says goodbye:
1. Say: "Thank you for calling ${config.agentName}. Have a great day!"
2. Call end_call tool immediately
3. Do NOT continue conversation after end_call

${config.guardrails ? `\n🛡️ GUARDRAILS:\n${config.guardrails}` : ''}`;
};

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Register Nova Sonic plugin with config
fastify.register(import('@novasonic/fastify-plugin'), {
  apiKey: process.env.NOVA_API_KEY,
  voiceId: config.voiceId,
  systemPrompt: createSystemPrompt(),
  knowledgeBase: config.knowledgeBase,
  guardRails: config.guardrails,
  tools: [
    {
      name: 'end_call',
      description: 'End the current call',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Reason for ending call' }
        },
        required: ['reason']
      }
    },
    {
      name: 'transfer_call',
      description: 'Transfer call to human agent',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Reason for transfer' }
        },
        required: ['reason']
      }
    },
    {
      name: 'voicemail',
      description: 'Let customer leave voicemail',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Message for customer' }
        },
        required: ['message']
      }
    },
    {
      name: 'schedule_callback',
      description: 'Schedule a callback',
      parameters: {
        type: 'object',
        properties: {
          time: { type: 'string', description: 'Preferred callback time' },
          reason: { type: 'string', description: 'Reason for callback' }
        },
        required: ['time', 'reason']
      }
    }
  ]
});

// Twilio webhook endpoints
fastify.post('/incoming-call', async (request, reply) => {
  // Your existing Twilio webhook logic
  // Now uses config.callPhoneNumber, config.transferPhoneNumber, etc.
});

fastify.post('/media-stream', async (request, reply) => {
  // Your existing media stream logic
  // Now uses config.enableRecording, config.enableTranscription, etc.
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'healthy', agentId: config.agentId, timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`🚀 Agent ${config.agentId} started successfully on port 3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

### **2. Configuration Loader**
```typescript
// src/config-loader.ts
export interface AgentConfig {
  // Agent Identity
  agentId: string;
  agentName: string;
  agentDescription: string;
  
  // AI Configuration
  agentPrompt: string;
  voiceId: string;
  knowledgeBase: any;
  guardrails: string;
  
  // Twilio Configuration
  twilioAccountSid: string;
  twilioApiSecret: string;
  callPhoneNumber: string;
  transferPhoneNumber?: string;
  summaryPhoneNumber?: string;
  
  // AWS Configuration
  awsRegion: string;
  s3BucketName: string;
  
  // Integration Configuration
  makeEndpoint?: string;
  sipEndpoint?: string;
  novaPickupWebhookUrl?: string;
  transcriptWebhookUrl?: string;
  
  // Feature Flags
  enableRecording: boolean;
  enableTranscription: boolean;
  
  // Guard Rails Configuration
  maxConversationLength: number;
  maxSessionDuration: number;
  maxInappropriateAttempts: number;
}

export class ConfigLoader {
  static loadConfig(): AgentConfig {
    return {
      // Agent Identity
      agentId: process.env.AGENT_ID || '',
      agentName: process.env.AGENT_NAME || 'AI Assistant',
      agentDescription: process.env.AGENT_DESCRIPTION || '',
      
      // AI Configuration
      agentPrompt: process.env.AGENT_PROMPT || 'You are a helpful AI assistant.',
      voiceId: process.env.VOICE_ID || 'tiffany',
      knowledgeBase: this.parseJsonEnv('AGENT_KNOWLEDGE_BASE', {}),
      guardrails: process.env.AGENT_GUARDRAILS || '',
      
      // Twilio Configuration
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
      twilioApiSecret: process.env.TWILIO_API_SECRET || '',
      callPhoneNumber: process.env.CALL_PHONE_NUMBER || '',
      transferPhoneNumber: process.env.TRANSFER_PHONE_NUMBER || '',
      summaryPhoneNumber: process.env.SUMMARY_PHONE_NUMBER || '',
      
      // AWS Configuration
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      s3BucketName: process.env.S3_BUCKET_NAME || '',
      
      // Integration Configuration
      makeEndpoint: process.env.MAKE_ENDPOINT || '',
      sipEndpoint: process.env.SIP_ENDPOINT || '',
      novaPickupWebhookUrl: process.env.NOVA_PICKUP_WEBHOOK_URL || '',
      transcriptWebhookUrl: process.env.TRANSCRIPT_WEBHOOK_URL || '',
      
      // Feature Flags
      enableRecording: process.env.ENABLE_RECORDING === 'true',
      enableTranscription: process.env.ENABLE_TRANSCRIPTION === 'true',
      
      // Guard Rails Configuration
      maxConversationLength: parseInt(process.env.MAX_CONVERSATION_LENGTH || '100'),
      maxSessionDuration: parseInt(process.env.MAX_SESSION_DURATION || '900000'),
      maxInappropriateAttempts: parseInt(process.env.MAX_INAPPROPRIATE_ATTEMPTS || '5')
    };
  }
  
  private static parseJsonEnv(key: string, defaultValue: any): any {
    try {
      const value = process.env[key];
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}
```

### **3. Dockerfile**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
```

### **4. Package.json**
```json
{
  "name": "tempo-voice-agent-template",
  "version": "1.0.0",
  "description": "Configurable TempoVoice AI Agent",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsx watch src/server.ts",
    "test": "jest"
  },
  "dependencies": {
    "fastify": "^4.24.3",
    "@novasonic/fastify-plugin": "^1.0.0",
    "twilio": "^4.19.0",
    "@aws-sdk/client-s3": "^3.470.0",
    "@aws-sdk/client-bedrock-runtime": "^3.470.0",
    "ws": "^8.14.2",
    "pino": "^8.16.2",
    "pino-pretty": "^10.2.3"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/ws": "^8.5.8",
    "typescript": "^5.3.2",
    "tsx": "^4.6.0"
  }
}
```

---

## 🚀 **Integration with Dashboard**

### **Dashboard Agent Creation Flow**
1. **User fills form** in dashboard with all agent configuration
2. **Dashboard API** stores agent in database with full configuration
3. **Lambda function** triggered with agent configuration
4. **Lambda builds** Docker image from agent template repository
5. **Lambda pushes** image to ECR with agent-specific tag
6. **Lambda creates** ECS task definition with environment variables
7. **Lambda creates** ECS service and S3 bucket
8. **Lambda updates** ALB routing rules
9. **Agent becomes** available at unique URL

### **Environment Variables Injection**
```typescript
// Lambda injects these environment variables into ECS task
const environmentVariables = [
  { name: 'AGENT_ID', value: config.agentId },
  { name: 'AGENT_NAME', value: config.agentName },
  { name: 'AGENT_DESCRIPTION', value: config.description },
  { name: 'AGENT_PROMPT', value: config.prompt },
  { name: 'AGENT_KNOWLEDGE_BASE', value: JSON.stringify(config.knowledgeBase) },
  { name: 'AGENT_GUARDRAILS', value: config.guardrails },
  { name: 'VOICE_ID', value: config.voiceId },
  { name: 'TWILIO_ACCOUNT_SID', value: config.twilioAccountSid },
  { name: 'TWILIO_API_SECRET', value: config.twilioApiSecret },
  { name: 'CALL_PHONE_NUMBER', value: config.callPhoneNumber },
  { name: 'TRANSFER_PHONE_NUMBER', value: config.transferPhoneNumber || '' },
  { name: 'SUMMARY_PHONE_NUMBER', value: config.summaryPhoneNumber || '' },
  { name: 'AWS_REGION', value: config.awsRegion },
  { name: 'S3_BUCKET_NAME', value: `tempo-agent-transcripts-${config.agentId}` },
  { name: 'MAKE_ENDPOINT', value: config.makeEndpoint || '' },
  { name: 'SIP_ENDPOINT', value: config.sipEndpoint || '' },
  { name: 'NOVA_PICKUP_WEBHOOK_URL', value: config.novaPickupWebhookUrl || '' },
  { name: 'TRANSCRIPT_WEBHOOK_URL', value: config.transcriptWebhookUrl || '' },
  { name: 'ENABLE_RECORDING', value: config.enableRecording?.toString() },
  { name: 'ENABLE_TRANSCRIPTION', value: config.enableTranscription?.toString() },
  { name: 'MAX_CONVERSATION_LENGTH', value: config.maxConversationLength?.toString() },
  { name: 'MAX_SESSION_DURATION', value: config.maxSessionDuration?.toString() },
  { name: 'MAX_INAPPROPRIATE_ATTEMPTS', value: config.maxInappropriateAttempts?.toString() }
];
```

---

## 📋 **Migration Steps from Phase 1**

### **Step 1: Create Agent Template Repository**
```bash
# Create new repository
git clone https://github.com/saadhaniftaj/TempoVoice-phase1-Core-Nova-Agent-Enhanced.git tempo-voice-agent-template
cd tempo-voice-agent-template

# Remove Phase 1 specific files
rm railway.json start.sh

# Add new files
# - config-loader.ts
# - guard-rails.ts
# - Dockerfile
# - docker-compose.yml
```

### **Step 2: Modify Existing Files**
- **server.ts**: Add config loading and dynamic initialization
- **knowledge-base-service.ts**: Make knowledge base configurable
- **voice-config.ts**: Use environment-based voice selection
- **All services**: Remove hardcoded values, use config

### **Step 3: Test Locally**
```bash
# Set environment variables
export AGENT_ID="test-agent-123"
export AGENT_NAME="Test Agent"
export AGENT_PROMPT="You are a helpful test agent"
export VOICE_ID="tiffany"
# ... all other config

# Run locally
npm run dev

# Test endpoints
curl http://localhost:3000/health
```

### **Step 4: Build and Test Docker**
```bash
# Build image
docker build -t tempo-agent:test .

# Run container
docker run -p 3000:3000 \
  -e AGENT_ID="test-agent-123" \
  -e AGENT_NAME="Test Agent" \
  -e AGENT_PROMPT="You are a helpful test agent" \
  -e VOICE_ID="tiffany" \
  tempo-agent:test

# Test
curl http://localhost:3000/health
```

---

This agent template structure maintains **100% compatibility** with your Phase 1 agent while making it **fully configurable** for multi-tenant deployment! 🎯
