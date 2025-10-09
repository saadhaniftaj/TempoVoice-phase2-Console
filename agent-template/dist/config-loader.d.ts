export interface AgentConfig {
    agentId: string;
    agentName: string;
    agentDescription: string;
    agentPrompt: string;
    voiceId: string;
    knowledgeBase: any;
    guardrails: string;
    twilioAccountSid: string;
    twilioApiSecret: string;
    callPhoneNumber: string;
    transferPhoneNumber?: string;
    summaryPhoneNumber?: string;
    awsRegion: string;
    s3BucketName: string;
    awsAccessKey?: string;
    awsSecretKey?: string;
    makeEndpoint?: string;
    sipEndpoint?: string;
    novaPickupWebhookUrl?: string;
    transcriptWebhookUrl?: string;
    enableRecording: boolean;
    enableTranscription: boolean;
    maxConversationLength: number;
    maxSessionDuration: number;
    maxInappropriateAttempts: number;
    novaApiKey?: string;
}
export declare class ConfigLoader {
    static loadConfig(): AgentConfig;
    private static parseJsonEnv;
    static validateConfig(config: AgentConfig): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=config-loader.d.ts.map