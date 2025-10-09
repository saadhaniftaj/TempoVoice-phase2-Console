import { Twilio } from 'twilio';
import { S2SBidirectionalStreamClient } from './nova-client';
export interface VoicemailRecord {
    id: string;
    callSid: string;
    from: string;
    recordingUrl: string;
    transcription: string;
    timestamp: Date;
    status: 'new' | 'processing' | 'processed' | 'failed';
    aiAnalysis?: VoicemailAnalysis;
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    category: 'inquiry' | 'complaint' | 'booking' | 'support' | 'other';
    responseRequired: boolean;
    assignedTo?: string;
    notes?: string;
}
export interface VoicemailAnalysis {
    intent: string;
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    category: 'inquiry' | 'complaint' | 'booking' | 'support' | 'other';
    keyPoints: string[];
    customerInfo: {
        name?: string;
        phone?: string;
        email?: string;
        referenceNumber?: string;
    };
    suggestedResponse: string;
    responseRequired: boolean;
    estimatedResponseTime: string;
    priority: number;
}
export declare class VoicemailService {
    private twilioClient;
    private aiClient;
    private voicemails;
    constructor(twilioClient: Twilio, aiClient: S2SBidirectionalStreamClient);
    /**
     * Process incoming voicemail with AI analysis
     */
    processVoicemail(voicemailData: {
        callSid: string;
        from: string;
        recordingUrl: string;
        transcription: string;
    }): Promise<VoicemailRecord>;
    /**
     * Analyze voicemail content using AI
     */
    private analyzeVoicemail;
    private extractKeyPoints;
    private extractCustomerInfo;
    private generateSuggestedResponse;
    private calculatePriority;
    private determineIntent;
    private getEstimatedResponseTime;
    /**
     * Create TwiML for voicemail recording
     */
    createVoicemailTwiML(scenario: 'after-hours' | 'busy' | 'unavailable' | 'custom'): string;
    /**
     * Get all voicemails
     */
    getAllVoicemails(): VoicemailRecord[];
    /**
     * Get urgent voicemails
     */
    getUrgentVoicemails(): VoicemailRecord[];
    /**
     * Get voicemail by ID
     */
    getVoicemail(id: string): VoicemailRecord | null;
    /**
     * Update voicemail status
     */
    updateVoicemailStatus(id: string, status: string, notes?: string): boolean;
    /**
     * Get voicemail statistics
     */
    getVoicemailStats(): any;
    /**
     * Clean up old voicemails
     */
    cleanupOldVoicemails(daysToKeep?: number): void;
}
//# sourceMappingURL=voicemail-service.d.ts.map