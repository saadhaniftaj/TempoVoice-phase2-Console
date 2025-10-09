"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptStorageService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const client_s3_1 = require("@aws-sdk/client-s3");
class TranscriptStorageService {
    constructor(options = {}, cloudConfig) {
        this.options = {
            localStorage: true,
            cloudStorage: false,
            webhookDelivery: true,
            databaseStorage: false,
            ...options
        };
        this.cloudConfig = cloudConfig;
        this.transcriptsDir = './transcripts';
        if (this.options.localStorage) {
            this.ensureLocalStorageExists();
        }
    }
    ensureLocalStorageExists() {
        if (!fs.existsSync(this.transcriptsDir)) {
            fs.mkdirSync(this.transcriptsDir, { recursive: true });
            console.log(`Created transcripts directory: ${this.transcriptsDir}`);
        }
    }
    async storeTranscript(transcriptData) {
        const storagePaths = [];
        try {
            // Local storage
            if (this.options.localStorage) {
                const localPath = await this.storeLocally(transcriptData);
                storagePaths.push(localPath);
            }
            // Cloud storage
            if (this.options.cloudStorage && this.cloudConfig) {
                const cloudPath = await this.storeInCloud(transcriptData);
                storagePaths.push(cloudPath);
            }
            // Webhook delivery
            if (this.options.webhookDelivery) {
                await this.deliverViaWebhook(transcriptData);
            }
            // Database storage
            if (this.options.databaseStorage) {
                await this.storeInDatabase(transcriptData);
            }
            console.log(`Transcript stored successfully: ${storagePaths.join(', ')}`);
            return storagePaths;
        }
        catch (error) {
            console.error('Error storing transcript:', error);
            throw error;
        }
    }
    async storeLocally(transcriptData) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `transcript_${transcriptData.callSid}_${timestamp}.json`;
        const filepath = path.join(this.transcriptsDir, filename);
        const dataToStore = {
            ...transcriptData,
            storedAt: new Date().toISOString(),
            storageType: 'local'
        };
        fs.writeFileSync(filepath, JSON.stringify(dataToStore, null, 2));
        console.log(`Transcript stored locally: ${filepath}`);
        return filepath;
    }
    async storeInCloud(transcriptData) {
        if (!this.cloudConfig) {
            throw new Error('Cloud storage configuration not provided');
        }
        switch (this.cloudConfig.provider) {
            case 'aws-s3':
                return await this.storeInS3(transcriptData);
            case 'railway-volumes':
                return await this.storeInRailwayVolumes(transcriptData);
            default:
                throw new Error(`Unsupported cloud provider: ${this.cloudConfig.provider}`);
        }
    }
    async storeInS3(transcriptData) {
        if (!this.cloudConfig?.bucketName || !this.cloudConfig?.region) {
            throw new Error('S3 configuration incomplete');
        }
        const s3Client = new client_s3_1.S3Client({
            region: this.cloudConfig.region,
            credentials: {
                accessKeyId: this.cloudConfig.accessKey || process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: this.cloudConfig.secretKey || process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const key = `transcripts/${transcriptData.callSid}/${timestamp}_transcript.json`;
        const dataToStore = {
            ...transcriptData,
            storedAt: new Date().toISOString(),
            storageType: 's3'
        };
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.cloudConfig.bucketName,
            Key: key,
            Body: JSON.stringify(dataToStore, null, 2),
            ContentType: 'application/json',
            Metadata: {
                callSid: transcriptData.callSid,
                sessionId: transcriptData.sessionId,
                phoneNumber: transcriptData.phoneNumber || 'unknown'
            }
        });
        await s3Client.send(command);
        const s3Url = `s3://${this.cloudConfig.bucketName}/${key}`;
        console.log(`Transcript stored in S3: ${s3Url}`);
        return s3Url;
    }
    async storeInRailwayVolumes(transcriptData) {
        // Railway volumes are mounted at /app/volumes
        const volumesDir = '/app/volumes/transcripts';
        if (!fs.existsSync(volumesDir)) {
            fs.mkdirSync(volumesDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `transcript_${transcriptData.callSid}_${timestamp}.json`;
        const filepath = path.join(volumesDir, filename);
        const dataToStore = {
            ...transcriptData,
            storedAt: new Date().toISOString(),
            storageType: 'railway-volumes'
        };
        fs.writeFileSync(filepath, JSON.stringify(dataToStore, null, 2));
        console.log(`Transcript stored in Railway volumes: ${filepath}`);
        return filepath;
    }
    async deliverViaWebhook(transcriptData) {
        const webhookUrl = process.env.TRANSCRIPT_WEBHOOK_URL;
        if (!webhookUrl) {
            console.log('No transcript webhook URL configured, skipping webhook delivery');
            return;
        }
        try {
            const payload = {
                event: 'transcript_completed',
                timestamp: new Date().toISOString(),
                data: transcriptData
            };
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TempoVoice-Agent/1.0'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
            }
            console.log(`Transcript delivered via webhook to: ${webhookUrl}`);
        }
        catch (error) {
            console.error('Webhook delivery failed:', error);
            // Don't throw - webhook failure shouldn't break transcript storage
        }
    }
    async storeInDatabase(transcriptData) {
        // Database storage implementation would go here
        // For now, just log that it would be stored
        console.log(`Transcript would be stored in database for call: ${transcriptData.callSid}`);
    }
    async retrieveTranscript(callSid, storagePath) {
        try {
            if (storagePath) {
                return await this.retrieveFromPath(storagePath);
            }
            // Try to find locally first
            if (this.options.localStorage) {
                const localTranscript = await this.findLocalTranscript(callSid);
                if (localTranscript) {
                    return localTranscript;
                }
            }
            // Try cloud storage
            if (this.options.cloudStorage && this.cloudConfig) {
                const cloudTranscript = await this.findCloudTranscript(callSid);
                if (cloudTranscript) {
                    return cloudTranscript;
                }
            }
            return null;
        }
        catch (error) {
            console.error(`Error retrieving transcript for call ${callSid}:`, error);
            return null;
        }
    }
    async retrieveFromPath(filepath) {
        try {
            if (filepath.startsWith('s3://')) {
                // Handle S3 path
                return await this.retrieveFromS3(filepath);
            }
            else {
                // Handle local file path
                if (fs.existsSync(filepath)) {
                    const data = fs.readFileSync(filepath, 'utf8');
                    return JSON.parse(data);
                }
            }
            return null;
        }
        catch (error) {
            console.error(`Error retrieving transcript from path ${filepath}:`, error);
            return null;
        }
    }
    async findLocalTranscript(callSid) {
        try {
            const files = fs.readdirSync(this.transcriptsDir);
            const transcriptFile = files.find(file => file.includes(callSid));
            if (transcriptFile) {
                const filepath = path.join(this.transcriptsDir, transcriptFile);
                const data = fs.readFileSync(filepath, 'utf8');
                return JSON.parse(data);
            }
            return null;
        }
        catch (error) {
            console.error(`Error finding local transcript for call ${callSid}:`, error);
            return null;
        }
    }
    async findCloudTranscript(callSid) {
        // Implementation would depend on the cloud provider
        // For now, return null
        console.log(`Cloud transcript retrieval not implemented for call ${callSid}`);
        return null;
    }
    async retrieveFromS3(s3Path) {
        // S3 retrieval implementation would go here
        console.log(`S3 transcript retrieval not implemented for path ${s3Path}`);
        return null;
    }
    async generateTranscriptSummary(transcriptData) {
        try {
            // Simple summary generation
            const segments = transcriptData.segments || [];
            const userSegments = segments.filter(s => s.speaker === 'user');
            const aiSegments = segments.filter(s => s.speaker === 'ai');
            const summary = {
                callId: transcriptData.callSid,
                duration: transcriptData.duration,
                participants: {
                    user: userSegments.length,
                    ai: aiSegments.length
                },
                topics: this.extractTopics(segments),
                outcome: this.determineOutcome(transcriptData),
                keyPoints: this.extractKeyPoints(segments)
            };
            return JSON.stringify(summary, null, 2);
        }
        catch (error) {
            console.error('Error generating transcript summary:', error);
            return JSON.stringify({ error: 'Failed to generate summary' });
        }
    }
    extractTopics(segments) {
        // Simple topic extraction based on keywords
        const keywords = segments
            .flatMap(s => s.text.toLowerCase().split(/\s+/))
            .filter(word => word.length > 4)
            .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said'].includes(word));
        const topicCounts = new Map();
        keywords.forEach(keyword => {
            topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 1);
        });
        return Array.from(topicCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic]) => topic);
    }
    determineOutcome(transcriptData) {
        if (transcriptData.metadata?.escalationReason) {
            return 'escalated';
        }
        const lastSegment = transcriptData.segments?.[transcriptData.segments.length - 1];
        if (lastSegment?.text.toLowerCase().includes('thank you') ||
            lastSegment?.text.toLowerCase().includes('goodbye')) {
            return 'completed_successfully';
        }
        return 'ongoing';
    }
    extractKeyPoints(segments) {
        // Simple key point extraction
        return segments
            .filter(s => s.text.length > 20)
            .map(s => s.text.substring(0, 100) + '...')
            .slice(0, 3);
    }
    async cleanupOldTranscripts(daysToKeep = 30) {
        if (!this.options.localStorage) {
            return;
        }
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const files = fs.readdirSync(this.transcriptsDir);
            for (const file of files) {
                const filepath = path.join(this.transcriptsDir, file);
                const stats = fs.statSync(filepath);
                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filepath);
                    console.log(`Deleted old transcript: ${file}`);
                }
            }
            console.log(`Cleanup completed for transcripts older than ${daysToKeep} days`);
        }
        catch (error) {
            console.error('Error during transcript cleanup:', error);
        }
    }
}
exports.TranscriptStorageService = TranscriptStorageService;
//# sourceMappingURL=transcript-storage-service.js.map