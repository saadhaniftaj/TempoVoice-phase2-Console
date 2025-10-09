"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
class ConfigLoader {
    static loadConfig() {
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
            awsAccessKey: process.env.AWS_ACCESS_KEY,
            awsSecretKey: process.env.AWS_SECRET_KEY,
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
            maxInappropriateAttempts: parseInt(process.env.MAX_INAPPROPRIATE_ATTEMPTS || '5'),
            // Nova Sonic API
            novaApiKey: process.env.NOVA_API_KEY
        };
    }
    static parseJsonEnv(key, defaultValue) {
        try {
            const value = process.env[key];
            return value ? JSON.parse(value) : defaultValue;
        }
        catch (error) {
            console.warn(`Failed to parse JSON environment variable ${key}:`, error);
            return defaultValue;
        }
    }
    static validateConfig(config) {
        const errors = [];
        // Required fields
        const requiredFields = [
            'agentId', 'agentName', 'agentPrompt', 'voiceId',
            'twilioAccountSid', 'twilioApiSecret', 'callPhoneNumber',
            'awsRegion', 's3BucketName'
        ];
        for (const field of requiredFields) {
            if (!config[field]) {
                errors.push(`Required field '${field}' is missing or empty`);
            }
        }
        // Validate voice ID
        const validVoiceIds = ['tiffany', 'matthew', 'amy', 'ambre', 'florian', 'beatrice', 'lorenzo', 'greta', 'lennart', 'lupe', 'carlos'];
        if (config.voiceId && !validVoiceIds.includes(config.voiceId)) {
            errors.push(`Invalid voice ID '${config.voiceId}'. Valid options: ${validVoiceIds.join(', ')}`);
        }
        // Validate numeric fields
        if (config.maxConversationLength <= 0) {
            errors.push('maxConversationLength must be greater than 0');
        }
        if (config.maxSessionDuration <= 0) {
            errors.push('maxSessionDuration must be greater than 0');
        }
        if (config.maxInappropriateAttempts <= 0) {
            errors.push('maxInappropriateAttempts must be greater than 0');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
exports.ConfigLoader = ConfigLoader;
//# sourceMappingURL=config-loader.js.map