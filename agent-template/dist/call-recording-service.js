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
exports.CallRecordingService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CallRecordingService {
    constructor(twilioClient, baseDir = './recordings') {
        this.callRecords = new Map();
        this.twilioClient = twilioClient;
        this.recordingsDir = path.join(baseDir, 'recordings');
        this.transcriptsDir = path.join(baseDir, 'transcripts');
        this.analyticsDir = path.join(baseDir, 'analytics');
        this.ensureDirectoriesExist();
    }
    ensureDirectoriesExist() {
        [this.recordingsDir, this.transcriptsDir, this.analyticsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    async startCallRecording(callSid, sessionId, phoneNumber) {
        try {
            console.log(`Starting call recording for ${callSid}`);
            const callRecord = {
                callSid,
                sessionId,
                startTime: new Date(),
                status: 'active',
                phoneNumber,
                transcriptSegments: [],
                guardRailsEvents: [],
                knowledgeBaseQueries: [],
                metadata: {}
            };
            this.callRecords.set(callSid, callRecord);
            // Start Twilio recording
            const recording = await this.twilioClient.calls(callSid).recordings.create({
                recordingStatusCallback: process.env.RECORDING_WEBHOOK_URL || 'https://your-webhook-url.com/recording-status',
                recordingStatusCallbackEvent: ['completed', 'failed'],
                trim: 'trim-silence'
            });
            callRecord.metadata = { ...callRecord.metadata, recordingSid: recording.sid };
            this.callRecords.set(callSid, callRecord);
            console.log(`Recording started for call ${callSid}, recording SID: ${recording.sid}`);
        }
        catch (error) {
            console.error(`Failed to start recording for call ${callSid}:`, error);
            throw error;
        }
    }
    async stopCallRecording(callSid) {
        try {
            const callRecord = this.callRecords.get(callSid);
            if (!callRecord) {
                console.warn(`No call record found for ${callSid}`);
                return null;
            }
            console.log(`Stopping call recording for ${callSid}`);
            // Stop Twilio recording
            const recordings = await this.twilioClient.calls(callSid).recordings.list({ limit: 1 });
            if (recordings.length > 0) {
                const recording = recordings[0];
                await recording.update({ status: 'stopped' });
                callRecord.recordingUrl = `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`;
                callRecord.endTime = new Date();
                callRecord.duration = callRecord.endTime.getTime() - callRecord.startTime.getTime();
                callRecord.status = 'completed';
                this.callRecords.set(callSid, callRecord);
                console.log(`Recording stopped for call ${callSid}, URL: ${callRecord.recordingUrl}`);
                return callRecord.recordingUrl;
            }
            return null;
        }
        catch (error) {
            console.error(`Failed to stop recording for call ${callSid}:`, error);
            throw error;
        }
    }
    addTranscriptSegment(callSid, segment) {
        const callRecord = this.callRecords.get(callSid);
        if (callRecord) {
            callRecord.transcriptSegments.push(segment);
            this.callRecords.set(callSid, callRecord);
        }
    }
    addGuardRailsEvent(callSid, event) {
        const callRecord = this.callRecords.get(callSid);
        if (callRecord) {
            callRecord.guardRailsEvents.push(event);
            this.callRecords.set(callSid, callRecord);
        }
    }
    addKnowledgeBaseQuery(callSid, query) {
        const callRecord = this.callRecords.get(callSid);
        if (callRecord) {
            callRecord.knowledgeBaseQueries.push(query);
            this.callRecords.set(callSid, callRecord);
        }
    }
    setCallTranscription(callSid, transcription) {
        const callRecord = this.callRecords.get(callSid);
        if (callRecord) {
            callRecord.transcription = transcription;
            this.callRecords.set(callSid, callRecord);
        }
    }
    setEscalationReason(callSid, reason) {
        const callRecord = this.callRecords.get(callSid);
        if (callRecord) {
            callRecord.escalationReason = reason;
            this.callRecords.set(callSid, callRecord);
        }
    }
    getCallRecord(callSid) {
        return this.callRecords.get(callSid);
    }
    getAllCallRecords() {
        return Array.from(this.callRecords.values());
    }
    async saveCallTranscript(callSid) {
        const callRecord = this.callRecords.get(callSid);
        if (!callRecord) {
            throw new Error(`No call record found for ${callSid}`);
        }
        const transcriptData = {
            callSid: callRecord.callSid,
            sessionId: callRecord.sessionId,
            startTime: callRecord.startTime,
            endTime: callRecord.endTime,
            duration: callRecord.duration,
            phoneNumber: callRecord.phoneNumber,
            status: callRecord.status,
            recordingUrl: callRecord.recordingUrl,
            transcription: callRecord.transcription,
            transcriptSegments: callRecord.transcriptSegments,
            guardRailsEvents: callRecord.guardRailsEvents,
            knowledgeBaseQueries: callRecord.knowledgeBaseQueries,
            escalationReason: callRecord.escalationReason,
            metadata: callRecord.metadata
        };
        const filename = `${callSid}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filepath = path.join(this.transcriptsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(transcriptData, null, 2));
        console.log(`Transcript saved for call ${callSid} to ${filepath}`);
        return filepath;
    }
    async generateCallAnalytics(timeframe = 'day') {
        const now = new Date();
        const cutoffDate = new Date();
        switch (timeframe) {
            case 'day':
                cutoffDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                cutoffDate.setMonth(now.getMonth() - 1);
                break;
        }
        const recentCalls = this.getAllCallRecords().filter(call => call.startTime >= cutoffDate && call.status === 'completed');
        const totalCalls = recentCalls.length;
        const averageDuration = totalCalls > 0
            ? recentCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / totalCalls
            : 0;
        const escalationRate = totalCalls > 0
            ? recentCalls.filter(call => call.escalationReason).length / totalCalls
            : 0;
        // Common topics (simplified)
        const commonTopics = this.extractCommonTopics(recentCalls);
        // Guard rails triggers
        const guardRailsTriggers = this.extractGuardRailsTriggers(recentCalls);
        // Knowledge base usage
        const knowledgeBaseUsage = totalCalls > 0
            ? recentCalls.reduce((sum, call) => sum + (call.knowledgeBaseQueries?.length || 0), 0) / totalCalls
            : 0;
        return {
            totalCalls,
            averageDuration,
            escalationRate,
            commonTopics,
            guardRailsTriggers,
            knowledgeBaseUsage
        };
    }
    extractCommonTopics(calls) {
        const topicCounts = new Map();
        calls.forEach(call => {
            if (call.transcriptSegments) {
                call.transcriptSegments.forEach(segment => {
                    // Simple keyword extraction (in production, use NLP)
                    const keywords = segment.text.toLowerCase().split(/\s+/)
                        .filter(word => word.length > 3)
                        .filter(word => !['the', 'and', 'you', 'for', 'are', 'with', 'this', 'that'].includes(word));
                    keywords.forEach(keyword => {
                        topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 1);
                    });
                });
            }
        });
        return Array.from(topicCounts.entries())
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    extractGuardRailsTriggers(calls) {
        const triggerCounts = new Map();
        calls.forEach(call => {
            if (call.guardRailsEvents) {
                call.guardRailsEvents.forEach(event => {
                    triggerCounts.set(event.eventType, (triggerCounts.get(event.eventType) || 0) + 1);
                });
            }
        });
        return Array.from(triggerCounts.entries())
            .map(([trigger, count]) => ({ trigger, count }))
            .sort((a, b) => b.count - a.count);
    }
    async downloadRecording(recordingUrl, outputPath) {
        try {
            const response = await fetch(recordingUrl);
            if (!response.ok) {
                throw new Error(`Failed to download recording: ${response.statusText}`);
            }
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(outputPath, Buffer.from(buffer));
            console.log(`Recording downloaded to ${outputPath}`);
        }
        catch (error) {
            console.error(`Failed to download recording:`, error);
            throw error;
        }
    }
    async cleanupOldRecords(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const oldCalls = this.getAllCallRecords().filter(call => call.startTime < cutoffDate);
        for (const call of oldCalls) {
            // Remove from memory
            this.callRecords.delete(call.callSid);
            // Remove transcript file if it exists
            const transcriptPattern = `${call.callSid}_*.json`;
            const files = fs.readdirSync(this.transcriptsDir);
            const transcriptFiles = files.filter(file => file.startsWith(`${call.callSid}_`));
            transcriptFiles.forEach(file => {
                const filepath = path.join(this.transcriptsDir, file);
                fs.unlinkSync(filepath);
                console.log(`Deleted old transcript: ${file}`);
            });
        }
        console.log(`Cleaned up ${oldCalls.length} old call records`);
    }
}
exports.CallRecordingService = CallRecordingService;
//# sourceMappingURL=call-recording-service.js.map