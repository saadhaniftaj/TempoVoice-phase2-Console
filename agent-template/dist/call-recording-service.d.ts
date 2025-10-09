import { Twilio } from 'twilio';
export interface CallRecord {
    callSid: string;
    sessionId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    status: 'active' | 'completed' | 'failed';
    phoneNumber?: string;
    recordingUrl?: string;
    transcription?: string;
    transcriptSegments?: TranscriptSegment[];
    guardRailsEvents?: GuardRailsEvent[];
    knowledgeBaseQueries?: string[];
    escalationReason?: string;
    metadata?: Record<string, any>;
}
export interface TranscriptSegment {
    timestamp: Date;
    speaker: 'user' | 'ai';
    text: string;
    confidence?: number;
    duration?: number;
}
export interface GuardRailsEvent {
    timestamp: Date;
    eventType: 'content_blocked' | 'escalation' | 'rate_limit' | 'session_timeout';
    reason: string;
    action: string;
}
export interface CallAnalytics {
    totalCalls: number;
    averageDuration: number;
    escalationRate: number;
    commonTopics: Array<{
        topic: string;
        count: number;
    }>;
    guardRailsTriggers: Array<{
        trigger: string;
        count: number;
    }>;
    knowledgeBaseUsage: number;
}
export declare class CallRecordingService {
    private twilioClient;
    private recordingsDir;
    private transcriptsDir;
    private analyticsDir;
    private callRecords;
    constructor(twilioClient: Twilio, baseDir?: string);
    private ensureDirectoriesExist;
    startCallRecording(callSid: string, sessionId: string, phoneNumber?: string): Promise<void>;
    stopCallRecording(callSid: string): Promise<string | null>;
    addTranscriptSegment(callSid: string, segment: TranscriptSegment): void;
    addGuardRailsEvent(callSid: string, event: GuardRailsEvent): void;
    addKnowledgeBaseQuery(callSid: string, query: string): void;
    setCallTranscription(callSid: string, transcription: string): void;
    setEscalationReason(callSid: string, reason: string): void;
    getCallRecord(callSid: string): CallRecord | undefined;
    getAllCallRecords(): CallRecord[];
    saveCallTranscript(callSid: string): Promise<string>;
    generateCallAnalytics(timeframe?: 'day' | 'week' | 'month'): Promise<CallAnalytics>;
    private extractCommonTopics;
    private extractGuardRailsTriggers;
    downloadRecording(recordingUrl: string, outputPath: string): Promise<void>;
    cleanupOldRecords(daysToKeep?: number): Promise<void>;
}
//# sourceMappingURL=call-recording-service.d.ts.map