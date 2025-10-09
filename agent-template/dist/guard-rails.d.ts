export interface GuardRailConfig {
    maxConversationLength: number;
    maxSessionDuration: number;
    maxInappropriateAttempts: number;
    rateLimitWindow: number;
    maxRequestsPerWindow: number;
    allowedTopics: string[];
    blockedKeywords: string[];
    emergencyKeywords: string[];
}
export interface ConversationContext {
    sessionId: string;
    startTime: number;
    messageCount: number;
    inappropriateCount: number;
    lastActivity: number;
    topics: string[];
    isEscalated: boolean;
}
export interface GuardRailResult {
    allowed: boolean;
    reason?: string;
    action?: 'continue' | 'escalate' | 'terminate' | 'redirect';
    message?: string;
}
export declare class GuardRailsService {
    private config;
    private activeSessions;
    private rateLimitTracker;
    constructor(config?: Partial<GuardRailConfig>);
    initializeSession(sessionId: string): void;
    validateMessage(sessionId: string, message: string, callSid?: string): GuardRailResult;
    private checkRateLimit;
    private extractTopics;
    escalateSession(sessionId: string, reason: string): void;
    cleanupSession(sessionId: string): void;
    getSessionStats(): any;
    private getCommonTopics;
    updateConfig(newConfig: Partial<GuardRailConfig>): void;
    getConfig(): GuardRailConfig;
    getSessionContext(sessionId: string): ConversationContext | undefined;
    getAllActiveSessions(): ConversationContext[];
}
//# sourceMappingURL=guard-rails.d.ts.map