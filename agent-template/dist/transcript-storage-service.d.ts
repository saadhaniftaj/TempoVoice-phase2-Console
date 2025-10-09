import { TranscriptSegment } from './call-recording-service';
export interface TranscriptStorageOptions {
    localStorage: boolean;
    cloudStorage: boolean;
    webhookDelivery: boolean;
    databaseStorage: boolean;
}
export interface CloudStorageConfig {
    provider: 'aws-s3' | 'google-cloud' | 'azure-blob' | 'railway-volumes';
    bucketName?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
}
export interface TranscriptData {
    callSid: string;
    sessionId: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    phoneNumber?: string;
    status: string;
    fullTranscript: string;
    segments: TranscriptSegment[];
    extractedData: any;
    summary: string;
    analytics: any;
    metadata: any;
}
export declare class TranscriptStorageService {
    private transcriptsDir;
    private options;
    private cloudConfig?;
    constructor(options?: Partial<TranscriptStorageOptions>, cloudConfig?: CloudStorageConfig);
    private ensureLocalStorageExists;
    storeTranscript(transcriptData: TranscriptData): Promise<string[]>;
    private storeLocally;
    private storeInCloud;
    private storeInS3;
    private storeInRailwayVolumes;
    private deliverViaWebhook;
    private storeInDatabase;
    retrieveTranscript(callSid: string, storagePath?: string): Promise<TranscriptData | null>;
    private retrieveFromPath;
    private findLocalTranscript;
    private findCloudTranscript;
    private retrieveFromS3;
    generateTranscriptSummary(transcriptData: TranscriptData): Promise<string>;
    private extractTopics;
    private determineOutcome;
    private extractKeyPoints;
    cleanupOldTranscripts(daysToKeep?: number): Promise<void>;
}
//# sourceMappingURL=transcript-storage-service.d.ts.map