"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardRailsService = void 0;
class GuardRailsService {
    constructor(config) {
        this.activeSessions = new Map();
        this.rateLimitTracker = new Map();
        this.config = {
            maxConversationLength: 100, // messages - increased
            maxSessionDuration: 15 * 60 * 1000, // 15 minutes - increased
            maxInappropriateAttempts: 5, // increased
            rateLimitWindow: 60 * 1000, // 1 minute
            maxRequestsPerWindow: 10000, // Effectively disabled rate limiting
            allowedTopics: [
                'car rental', 'vehicle', 'booking', 'reservation', 'cancellation',
                'pricing', 'policy', 'insurance', 'age requirement', 'license',
                'pickup', 'return', 'extension', 'discount', 'offer', 'hours',
                'location', 'contact', 'support', 'help', 'question'
            ],
            blockedKeywords: [
                'hack', 'exploit', 'bypass', 'admin', 'root', 'password',
                'sql injection', 'xss', 'ddos', 'malware', 'virus',
                'illegal', 'fraud', 'scam', 'steal', 'break', 'destroy'
            ],
            emergencyKeywords: [
                'emergency', 'urgent', 'help', 'police', 'fire', 'medical',
                'accident', 'injury', 'danger', 'threat', 'violence'
            ],
            ...config
        };
    }
    initializeSession(sessionId) {
        const context = {
            sessionId,
            startTime: Date.now(),
            messageCount: 0,
            inappropriateCount: 0,
            lastActivity: Date.now(),
            topics: [],
            isEscalated: false
        };
        this.activeSessions.set(sessionId, context);
        console.log(`Guard rails initialized for session ${sessionId}`);
    }
    validateMessage(sessionId, message, callSid) {
        const context = this.activeSessions.get(sessionId);
        if (!context) {
            console.warn(`No context found for session ${sessionId}`);
            return { allowed: true, action: 'continue' };
        }
        // Update activity
        context.lastActivity = Date.now();
        context.messageCount++;
        // Check session duration
        const sessionDuration = Date.now() - context.startTime;
        if (sessionDuration > this.config.maxSessionDuration) {
            console.log(`Session ${sessionId} exceeded max duration: ${sessionDuration}ms`);
            return {
                allowed: false,
                reason: 'Session duration exceeded',
                action: 'escalate',
                message: 'Your session has been active for a while. Let me transfer you to a human agent.'
            };
        }
        // Check conversation length
        if (context.messageCount > this.config.maxConversationLength) {
            console.log(`Session ${sessionId} exceeded max conversation length: ${context.messageCount} messages`);
            return {
                allowed: false,
                reason: 'Conversation length exceeded',
                action: 'escalate',
                message: 'We\'ve been talking for a while. Let me connect you with a specialist.'
            };
        }
        // Check for blocked keywords
        const lowerMessage = message.toLowerCase();
        const blockedFound = this.config.blockedKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
        if (blockedFound) {
            context.inappropriateCount++;
            console.log(`Blocked keyword detected in session ${sessionId}: ${message.substring(0, 50)}...`);
            if (context.inappropriateCount >= this.config.maxInappropriateAttempts) {
                return {
                    allowed: false,
                    reason: 'Multiple inappropriate attempts',
                    action: 'terminate',
                    message: 'I cannot assist with this request. Thank you for calling.'
                };
            }
            else {
                return {
                    allowed: false,
                    reason: 'Inappropriate content detected',
                    action: 'continue',
                    message: 'I can only help with car rental related questions. How can I assist you with your rental needs?'
                };
            }
        }
        // Check for emergency keywords
        const emergencyFound = this.config.emergencyKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
        if (emergencyFound) {
            console.log(`Emergency keyword detected in session ${sessionId}: ${message.substring(0, 50)}...`);
            return {
                allowed: false,
                reason: 'Emergency situation detected',
                action: 'escalate',
                message: 'I understand this is urgent. Let me immediately connect you with emergency services.'
            };
        }
        // Rate limiting check
        const rateLimitResult = this.checkRateLimit(sessionId);
        if (!rateLimitResult.allowed) {
            return rateLimitResult;
        }
        // Extract topics from message
        this.extractTopics(message, context);
        return { allowed: true, action: 'continue' };
    }
    checkRateLimit(sessionId) {
        const now = Date.now();
        const rateLimitData = this.rateLimitTracker.get(sessionId);
        if (!rateLimitData) {
            this.rateLimitTracker.set(sessionId, { count: 1, windowStart: now });
            return { allowed: true, action: 'continue' };
        }
        // Reset window if needed
        if (now - rateLimitData.windowStart > this.config.rateLimitWindow) {
            rateLimitData.count = 1;
            rateLimitData.windowStart = now;
            return { allowed: true, action: 'continue' };
        }
        // Check if limit exceeded
        if (rateLimitData.count >= this.config.maxRequestsPerWindow) {
            console.log(`Rate limit exceeded for session ${sessionId}: ${rateLimitData.count} requests`);
            return {
                allowed: false,
                reason: 'Rate limit exceeded',
                action: 'escalate',
                message: 'You\'re sending messages very quickly. Let me connect you with a human agent.'
            };
        }
        rateLimitData.count++;
        return { allowed: true, action: 'continue' };
    }
    extractTopics(message, context) {
        const lowerMessage = message.toLowerCase();
        const detectedTopics = this.config.allowedTopics.filter(topic => lowerMessage.includes(topic.toLowerCase()));
        detectedTopics.forEach(topic => {
            if (!context.topics.includes(topic)) {
                context.topics.push(topic);
            }
        });
    }
    escalateSession(sessionId, reason) {
        const context = this.activeSessions.get(sessionId);
        if (context) {
            context.isEscalated = true;
            console.log(`Session ${sessionId} escalated: ${reason}`);
        }
    }
    cleanupSession(sessionId) {
        this.activeSessions.delete(sessionId);
        this.rateLimitTracker.delete(sessionId);
        console.log(`Guard rails cleaned up for session ${sessionId}`);
    }
    getSessionStats() {
        const sessions = Array.from(this.activeSessions.values());
        return {
            activeSessions: sessions.length,
            totalMessages: sessions.reduce((sum, s) => sum + s.messageCount, 0),
            escalatedSessions: sessions.filter(s => s.isEscalated).length,
            averageSessionDuration: sessions.length > 0
                ? sessions.reduce((sum, s) => sum + (Date.now() - s.startTime), 0) / sessions.length
                : 0,
            commonTopics: this.getCommonTopics(sessions)
        };
    }
    getCommonTopics(sessions) {
        const topicCounts = new Map();
        sessions.forEach(session => {
            session.topics.forEach(topic => {
                topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
            });
        });
        return Array.from(topicCounts.entries())
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('Guard rails configuration updated');
    }
    getConfig() {
        return { ...this.config };
    }
    getSessionContext(sessionId) {
        return this.activeSessions.get(sessionId);
    }
    getAllActiveSessions() {
        return Array.from(this.activeSessions.values());
    }
}
exports.GuardRailsService = GuardRailsService;
//# sourceMappingURL=guard-rails.js.map