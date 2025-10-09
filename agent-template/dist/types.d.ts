export interface CallSession {
    callSid: string;
    agentId: string;
    from: string;
    to: string;
    startTime: Date;
    endTime?: Date;
    status: CallStatus;
    transcript?: string;
    recordingUrl?: string;
    summary?: string;
}
export declare enum CallStatus {
    INITIATED = "initiated",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    TRANSFERRED = "transferred"
}
export interface VoiceConfig {
    id: string;
    name: string;
    gender: 'male' | 'female';
    language: string;
    locale: string;
    description: string;
}
export interface KnowledgeBaseItem {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    lastUpdated: Date;
}
export interface GuardRailRule {
    id: string;
    name: string;
    description: string;
    condition: string;
    action: 'block' | 'warn' | 'redirect';
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface AgentMetrics {
    totalCalls: number;
    successfulCalls: number;
    averageCallDuration: number;
    averageResponseTime: number;
    errorRate: number;
    lastCallTime?: Date;
}
export interface TranscriptSegment {
    timestamp: number;
    speaker: 'agent' | 'customer';
    text: string;
    confidence: number;
}
export interface CallSummary {
    callSid: string;
    agentId: string;
    customerPhone: string;
    duration: number;
    summary: string;
    keyTopics: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    nextSteps?: string[];
    transcript?: string;
}
export interface WebhookPayload {
    event: string;
    timestamp: Date;
    data: any;
    agentId: string;
}
export interface ToolCall {
    name: string;
    parameters: Record<string, any>;
    result?: any;
    error?: string;
}
export interface NovaResponse {
    text: string;
    toolCalls?: ToolCall[];
    confidence: number;
    isComplete: boolean;
}
export interface TwilioWebhookData {
    CallSid: string;
    From: string;
    To: string;
    CallStatus: string;
    Direction: string;
    MediaUrl?: string;
}
export interface S3UploadResult {
    bucket: string;
    key: string;
    url: string;
    size: number;
    lastModified: Date;
}
export interface ErrorDetails {
    code: string;
    message: string;
    stack?: string;
    timestamp: Date;
    context?: Record<string, any>;
}
export interface HealthCheck {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: Date;
    version: string;
    uptime: number;
    checks: {
        database?: 'connected' | 'disconnected';
        novaApi?: 'connected' | 'disconnected';
        twilio?: 'connected' | 'disconnected';
        s3?: 'connected' | 'disconnected';
    };
    metrics: {
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage?: number;
        activeConnections: number;
    };
}
//# sourceMappingURL=types.d.ts.map