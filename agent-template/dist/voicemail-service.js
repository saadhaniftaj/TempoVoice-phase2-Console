"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoicemailService = void 0;
class VoicemailService {
    constructor(twilioClient, aiClient) {
        this.voicemails = new Map();
        this.twilioClient = twilioClient;
        this.aiClient = aiClient;
    }
    /**
     * Process incoming voicemail with AI analysis
     */
    async processVoicemail(voicemailData) {
        const voicemailId = `vm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const voicemail = {
            id: voicemailId,
            callSid: voicemailData.callSid,
            from: voicemailData.from,
            recordingUrl: voicemailData.recordingUrl,
            transcription: voicemailData.transcription,
            timestamp: new Date(),
            status: 'processing',
            urgency: 'medium',
            category: 'inquiry',
            responseRequired: true
        };
        this.voicemails.set(voicemailId, voicemail);
        try {
            // Analyze voicemail with AI
            const analysis = await this.analyzeVoicemail(voicemailData.transcription);
            voicemail.aiAnalysis = analysis;
            voicemail.urgency = analysis.urgency;
            voicemail.category = analysis.category;
            voicemail.responseRequired = analysis.responseRequired;
            voicemail.status = 'processed';
            console.log(`Voicemail ${voicemailId} processed successfully`);
            return voicemail;
        }
        catch (error) {
            console.error(`Error processing voicemail ${voicemailId}:`, error);
            voicemail.status = 'failed';
            return voicemail;
        }
    }
    /**
     * Analyze voicemail content using AI
     */
    async analyzeVoicemail(transcription) {
        // Simple analysis logic (in production, use actual AI analysis)
        const lowerTranscription = transcription.toLowerCase();
        // Determine urgency
        let urgency = 'medium';
        if (lowerTranscription.includes('urgent') || lowerTranscription.includes('asap')) {
            urgency = 'high';
        }
        else if (lowerTranscription.includes('emergency') || lowerTranscription.includes('help')) {
            urgency = 'emergency';
        }
        else if (lowerTranscription.includes('question') || lowerTranscription.includes('info')) {
            urgency = 'low';
        }
        // Determine category
        let category = 'inquiry';
        if (lowerTranscription.includes('complaint') || lowerTranscription.includes('problem')) {
            category = 'complaint';
        }
        else if (lowerTranscription.includes('book') || lowerTranscription.includes('reserve')) {
            category = 'booking';
        }
        else if (lowerTranscription.includes('support') || lowerTranscription.includes('help')) {
            category = 'support';
        }
        // Extract key points
        const keyPoints = this.extractKeyPoints(transcription);
        // Extract customer info
        const customerInfo = this.extractCustomerInfo(transcription);
        // Generate suggested response
        const suggestedResponse = this.generateSuggestedResponse(category, urgency);
        // Determine priority
        const priority = this.calculatePriority(urgency, category);
        return {
            intent: this.determineIntent(transcription),
            urgency,
            category,
            keyPoints,
            customerInfo,
            suggestedResponse,
            responseRequired: true,
            estimatedResponseTime: this.getEstimatedResponseTime(urgency),
            priority
        };
    }
    extractKeyPoints(transcription) {
        // Simple key point extraction
        const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 10);
        return sentences.slice(0, 3); // Take first 3 meaningful sentences
    }
    extractCustomerInfo(transcription) {
        const phoneRegex = /(\+?1[-.\s]?)?(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g;
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const nameRegex = /(?:my name is|i'm|i am|call me|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
        const refRegex = /(?:reference|booking|reservation|confirmation)\s+(?:number\s+)?([A-Z0-9]{6,})/gi;
        const phones = [...transcription.matchAll(phoneRegex)].map(match => match[0]);
        const emails = [...transcription.matchAll(emailRegex)].map(match => match[0]);
        const names = [...transcription.matchAll(nameRegex)].map(match => match[1]);
        const refs = [...transcription.matchAll(refRegex)].map(match => match[1]);
        return {
            phone: phones[0],
            email: emails[0],
            name: names[0],
            referenceNumber: refs[0]
        };
    }
    generateSuggestedResponse(category, urgency) {
        const responses = {
            inquiry: "Thank you for your inquiry. We'll get back to you with the information you requested.",
            complaint: "We apologize for any inconvenience. Our team will review your concern and respond promptly.",
            booking: "Thank you for your booking request. We'll process this and confirm the details with you.",
            support: "We'll connect you with our support team to resolve your issue as quickly as possible.",
            other: "Thank you for your message. We'll review this and get back to you soon."
        };
        return responses[category] || responses.other;
    }
    calculatePriority(urgency, category) {
        let priority = 5; // Base priority
        // Adjust based on urgency
        switch (urgency) {
            case 'emergency':
                priority += 5;
                break;
            case 'high':
                priority += 3;
                break;
            case 'medium':
                priority += 1;
                break;
            case 'low':
                priority -= 1;
                break;
        }
        // Adjust based on category
        switch (category) {
            case 'complaint':
                priority += 2;
                break;
            case 'booking':
                priority += 1;
                break;
            case 'support':
                priority += 1;
                break;
        }
        return Math.max(1, Math.min(10, priority));
    }
    determineIntent(transcription) {
        const lowerTranscription = transcription.toLowerCase();
        if (lowerTranscription.includes('cancel'))
            return 'cancellation';
        if (lowerTranscription.includes('book') || lowerTranscription.includes('reserve'))
            return 'booking';
        if (lowerTranscription.includes('price') || lowerTranscription.includes('cost'))
            return 'pricing';
        if (lowerTranscription.includes('policy'))
            return 'policy_inquiry';
        if (lowerTranscription.includes('complaint'))
            return 'complaint';
        return 'general_inquiry';
    }
    getEstimatedResponseTime(urgency) {
        switch (urgency) {
            case 'emergency': return 'Within 1 hour';
            case 'high': return 'Within 4 hours';
            case 'medium': return 'Within 24 hours';
            case 'low': return 'Within 48 hours';
            default: return 'Within 24 hours';
        }
    }
    /**
     * Create TwiML for voicemail recording
     */
    createVoicemailTwiML(scenario) {
        const scenarios = {
            'after-hours': {
                message: 'Thank you for calling. Our office is currently closed. Please leave a detailed message with your name, phone number, and the reason for your call. We\'ll get back to you during business hours.',
                recordingLength: 120
            },
            'busy': {
                message: 'Thank you for calling. All our agents are currently busy helping other customers. Please leave a message and we\'ll return your call as soon as possible.',
                recordingLength: 90
            },
            'unavailable': {
                message: 'Thank you for calling. Our voicemail system is ready to record your message. Please speak clearly and include your contact information.',
                recordingLength: 60
            },
            'custom': {
                message: 'Please leave your message after the tone. We\'ll get back to you as soon as possible.',
                recordingLength: 60
            }
        };
        const config = scenarios[scenario];
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${config.message}</Say>
    <Record 
        maxLength="${config.recordingLength}"
        timeout="10"
        transcribe="true"
        transcribeCallback="/voicemail-transcribe"
        recordingStatusCallback="/voicemail-recording-status"
        recordingStatusCallbackEvent="completed"
    />
    <Say voice="alice">Thank you for your message. We'll get back to you soon. Goodbye.</Say>
    <Hangup/>
</Response>`;
    }
    /**
     * Get all voicemails
     */
    getAllVoicemails() {
        return Array.from(this.voicemails.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Get urgent voicemails
     */
    getUrgentVoicemails() {
        return this.getAllVoicemails()
            .filter(vm => vm.urgency === 'high' || vm.urgency === 'emergency')
            .sort((a, b) => b.priority - a.priority);
    }
    /**
     * Get voicemail by ID
     */
    getVoicemail(id) {
        return this.voicemails.get(id) || null;
    }
    /**
     * Update voicemail status
     */
    updateVoicemailStatus(id, status, notes) {
        const voicemail = this.voicemails.get(id);
        if (!voicemail)
            return false;
        voicemail.status = status;
        if (notes)
            voicemail.notes = notes;
        return true;
    }
    /**
     * Get voicemail statistics
     */
    getVoicemailStats() {
        const voicemails = this.getAllVoicemails();
        return {
            total: voicemails.length,
            byStatus: {
                new: voicemails.filter(vm => vm.status === 'new').length,
                processing: voicemails.filter(vm => vm.status === 'processing').length,
                processed: voicemails.filter(vm => vm.status === 'processed').length,
                failed: voicemails.filter(vm => vm.status === 'failed').length
            },
            byUrgency: {
                low: voicemails.filter(vm => vm.urgency === 'low').length,
                medium: voicemails.filter(vm => vm.urgency === 'medium').length,
                high: voicemails.filter(vm => vm.urgency === 'high').length,
                emergency: voicemails.filter(vm => vm.urgency === 'emergency').length
            },
            byCategory: {
                inquiry: voicemails.filter(vm => vm.category === 'inquiry').length,
                complaint: voicemails.filter(vm => vm.category === 'complaint').length,
                booking: voicemails.filter(vm => vm.category === 'booking').length,
                support: voicemails.filter(vm => vm.category === 'support').length,
                other: voicemails.filter(vm => vm.category === 'other').length
            },
            responseRequired: voicemails.filter(vm => vm.responseRequired).length,
            averagePriority: voicemails.length > 0
                ? voicemails.reduce((sum, vm) => sum + (vm.aiAnalysis?.priority || 5), 0) / voicemails.length
                : 0
        };
    }
    /**
     * Clean up old voicemails
     */
    cleanupOldVoicemails(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        let cleanedCount = 0;
        for (const [id, voicemail] of this.voicemails.entries()) {
            if (voicemail.timestamp < cutoffDate && voicemail.status === 'processed') {
                this.voicemails.delete(id);
                cleanedCount++;
            }
        }
        console.log(`Cleaned up ${cleanedCount} old voicemails`);
    }
}
exports.VoicemailService = VoicemailService;
//# sourceMappingURL=voicemail-service.js.map