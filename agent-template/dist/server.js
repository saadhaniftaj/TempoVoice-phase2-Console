"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const formbody_1 = __importDefault(require("@fastify/formbody"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const node_crypto_1 = require("node:crypto");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const nova_client_1 = require("./nova-client");
const alawmulaw_1 = require("alawmulaw");
const twilio_1 = require("twilio");
const knowledge_base_service_1 = require("./knowledge-base-service");
const guard_rails_1 = require("./guard-rails");
const call_recording_service_1 = require("./call-recording-service");
const simple_call_transfer_1 = require("./simple-call-transfer");
const voicemail_service_1 = require("./voicemail-service");
const voice_config_1 = require("./voice-config");
const transcript_storage_service_1 = require("./transcript-storage-service");
const transcript_api_endpoints_1 = require("./transcript-api-endpoints");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_loader_1 = require("./config-loader");
// Load agent configuration from environment variables
const config = config_loader_1.ConfigLoader.loadConfig();
// Twilio configuration from environment
const apiSid = config.twilio.apiSid;
const apiSecret = config.twilio.apiSecret;
const accountSid = config.twilio.accountSid;
const sipEndpoint = config.advanced.sipEndpoint;
const fromNumber = config.twilio.fromNumber;
const twClient = new twilio_1.Twilio(apiSid, apiSecret, { accountSid });
// Create enhanced system prompt with knowledge base
const createSystemPrompt = () => {
    const kb = knowledgeBaseService.getKnowledgeBase();
    if (!kb) {
        return config.prompt || `You are a customer service agent for a car rental company, "The Car Genie". The user and you will engage in a spoken dialog exchanging the transcripts of a natural real-time conversation. Keep your responses professional, polite and short, generally two or three sentences for chatty scenarios.

You are here to answer questions related to car rentals. Customers would call regarding their car rental bookings, like status of the rental, cancellations, extensions etc. They would also reach out for any car rental policy related questions.

At all costs, avoid answering any general real world questions and any other questions which are out-of-context and not related to "The Car Genie" car rental company. Furthermore, for any booking related actions, including status, please confirm with the customer before invoking the tools. Make sure you greet the customer and tell about yourself as welcome message as soon as the audio is started.

🎯 TOOL CALLING INSTRUCTIONS (CRITICAL):
You have access to these tools. Use them when appropriate:

**CALL MANAGEMENT TOOLS:**
1. **end_call**: Use when customer says:
   - "goodbye", "bye", "thank you", "that's all", "I'm done", "have a good day"
   - "okay bye" or any farewell phrase
   - Wants to end the conversation
   - Conversation is complete and customer is satisfied

2. **transfer_call**: Use when customer wants to speak to human agent:
   - "I want to speak to someone", "transfer me", "connect me to an agent"
   - Parameters: department (support, sales, billing, manager), reason (optional)

3. **warm_transfer**: Use for complex issues needing context:
   - Customer has detailed problem that needs briefing
   - Parameters: department, reason

4. **cold_transfer**: Use for simple direct transfers:
   - Customer just wants to be connected quickly
   - Parameters: department, reason

5. **voicemail**: Use when customer wants to leave a message:
   - "I want to leave a message", "can I leave a voicemail"
   - "I'll call back later", "record a message"

6. **schedule_callback**: Use when customer wants callback:
   - "call me back", "schedule a callback", "when can you call me"
   - Parameters: customerPhone, preferredTime, reason

**INFORMATION TOOLS:**
7. **getPolicyDetails**: Answer rental policy questions
8. **getReservationStatus**: Check booking status  
9. **cancelReservation**: Cancel a booking
10. **getDateTool**: Get current date
11. **getTimeTool**: Get current time
12. **support**: Legacy support tool (use transfer_call instead)

**EXAMPLES:**
- Customer: "I want to speak to billing" → Use transfer_call with department: "billing"
- Customer: "Can I leave a message?" → Use voicemail tool
- Customer: "Call me back tomorrow at 2pm" → Use schedule_callback with time: "tomorrow 2pm"
- Customer: "Bye!" → Use end_call tool

⚠️ CRITICAL: When customer says goodbye or wants to end the call:
1. Say polite farewell: "Thank you for calling The Car Genie. Have a great day!"
2. IMMEDIATELY call the end_call tool
3. Do NOT continue conversation after calling end_call`;
    }
    return `You are a customer service agent for "${kb.company_info.name}" - ${kb.company_info.tagline}. 

COMPANY INFORMATION:
- Founded: ${kb.company_info.founded}
- Contact: ${kb.company_info.contact.phone} | ${kb.company_info.contact.email}
- Locations: ${kb.company_info.locations.join(', ')}

VEHICLE FLEET:
${Object.entries(kb.vehicle_fleet).map(([category, details]) => `${category.toUpperCase()}: ${details.daily_rate} - ${details.capacity} - Models: ${details.models.join(', ')}`).join('\n')}

KEY POLICIES:
- Minimum age: ${kb.policies.age_requirements.minimum_age} years
- License: ${kb.policies.driving_license.required}
- Insurance: ${kb.policies.insurance.basic_coverage}
- Mileage: ${kb.policies.mileage.unlimited}
- Cancellation: ${kb.policies.cancellation.free_cancellation}

SPECIAL OFFERS:
${Object.entries(kb.special_offers).map(([offer, description]) => `${offer.replace(/_/g, ' ').toUpperCase()}: ${description}`).join('\n')}

OPERATING HOURS:
${Object.entries(kb.operating_hours).map(([period, hours]) => `${period.replace(/_/g, ' ').toUpperCase()}: ${hours}`).join('\n')}

INSTRUCTIONS:
- Keep responses professional, polite and short (2-3 sentences)
- Use the knowledge base information above to answer questions accurately
- For booking actions, confirm with customer before invoking tools
- Greet customers warmly and introduce yourself as their Car Genie assistant
- Stay focused on car rental topics only
- If you don't know something specific, offer to connect them with a human agent

🎯 TOOL CALLING INSTRUCTIONS (CRITICAL):
You have access to these tools. Use them when appropriate:

**CALL MANAGEMENT TOOLS:**
1. **end_call**: Use when customer says:
   - "goodbye", "bye", "thank you", "that's all", "I'm done", "have a great day"
   - "okay bye" or any farewell phrase
   - Wants to end the conversation
   - Conversation is complete and customer is satisfied

2. **transfer_call**: Use when customer wants to speak to human agent:
   - "I want to speak to someone", "transfer me", "connect me to an agent"
   - Parameters: department (support, sales, billing, manager), reason (optional)

3. **warm_transfer**: Use for complex issues needing context:
   - Customer has detailed problem that needs briefing
   - Parameters: department, reason

4. **cold_transfer**: Use for simple direct transfers:
   - Customer just wants to be connected quickly
   - Parameters: department, reason

5. **voicemail**: Use when customer wants to leave a message:
   - "I want to leave a message", "can I leave a voicemail"
   - "I'll call back later", "record a message"

6. **schedule_callback**: Use when customer wants callback:
   - "call me back", "schedule a callback", "when can you call me"
   - Parameters: customerPhone, preferredTime, reason

**INFORMATION TOOLS:**
7. **getPolicyDetails**: Answer rental policy questions
8. **getReservationStatus**: Check booking status  
9. **cancelReservation**: Cancel a booking
10. **getDateTool**: Get current date
11. **getTimeTool**: Get current time
12. **support**: Legacy support tool (use transfer_call instead)

**EXAMPLES:**
- Customer: "I want to speak to billing" → Use transfer_call with department: "billing"
- Customer: "Can I leave a message?" → Use voicemail tool
- Customer: "Call me back tomorrow at 2pm" → Use schedule_callback with time: "tomorrow 2pm"
- Customer: "Bye!" → Use end_call tool

⚠️ CRITICAL: When customer says goodbye or wants to end the call:
1. Say polite farewell: "Thank you for calling The Car Genie. Have a great day!"
2. IMMEDIATELY call the end_call tool
3. Do NOT continue conversation after calling end_call`;
};
// Configure AWS credentials from config
const AWS_PROFILE_NAME = config.aws.profile || 'bedrock-test';
// Create the AWS Bedrock client with config values
const bedrockClient = new nova_client_1.S2SBidirectionalStreamClient({
    requestHandlerConfig: {
        maxConcurrentStreams: 10,
    },
    clientConfig: {
        region: config.aws.region || "us-east-1",
        credentials: config.aws.accessKeyId && config.aws.secretAccessKey
            ? {
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey
            }
            : (0, credential_providers_1.fromIni)({ profile: AWS_PROFILE_NAME })
    }
});
const sessionMap = {};
// Initialize Knowledge Base Service with config
const knowledgeBaseService = new knowledge_base_service_1.KnowledgeBaseService();
// Load initial audio for "Nova speaks first" functionality
let initialAudioData = null;
try {
    const initialAudioPath = path_1.default.join(__dirname, 'initial-audio.raw');
    const audioBuffer = fs_1.default.readFileSync(initialAudioPath);
    initialAudioData = new Int16Array(audioBuffer.buffer);
    console.log('✅ Initial audio loaded successfully:', initialAudioData.length, 'samples');
}
catch (error) {
    console.error('❌ Failed to load initial audio:', error);
    console.log('⚠️ Nova will not speak first - will wait for user input');
}
// Track which sessions have already sent initial audio
const sessionsWithInitialAudioSent = new Set();
// Function to send initial audio to trigger Nova to speak first
async function sendInitialAudio(session, callSid, sessionId) {
    if (!initialAudioData) {
        console.log('⚠️ No initial audio data available');
        return false;
    }
    // Check if we've already sent initial audio for this session
    if (sessionsWithInitialAudioSent.has(sessionId)) {
        console.log('⚠️ Initial audio already sent for this session');
        return false;
    }
    try {
        console.log(`🎤 NOVA SPEAKS FIRST: Sending initial audio for session ${sessionId}...`);
        const initialAudioChunkSize = 512; // Size of chunks to send initial audio in
        // Send initial audio data in chunks to simulate streaming
        for (let i = 0; i < initialAudioData.length; i += initialAudioChunkSize) {
            const end = Math.min(i + initialAudioChunkSize, initialAudioData.length);
            const chunk = initialAudioData.slice(i, end);
            // Convert chunk to Buffer and stream to Nova
            const audioBuffer = Buffer.from(chunk.buffer);
            await session.streamAudio(audioBuffer);
        }
        // Mark this session as having sent initial audio
        sessionsWithInitialAudioSent.add(sessionId);
        console.log(`✅ NOVA SPEAKS FIRST: Initial audio sent successfully for session ${sessionId}`);
        return true;
    }
    catch (error) {
        console.error('❌ NOVA SPEAKS FIRST: Error sending initial audio:', error);
        return false;
    }
}
// Function to trigger webhook when Nova picks up
async function triggerNovaPickupWebhook(callSid, sessionId, callData) {
    const webhookUrl = config.advanced.novaPickupWebhookUrl;
    if (!webhookUrl) {
        console.log('⚠️ NOVA PICKUP WEBHOOK: No webhook URL configured (NOVA_PICKUP_WEBHOOK_URL)');
        return;
    }
    try {
        console.log(`🔗 NOVA PICKUP WEBHOOK: Triggering webhook for call ${callSid}...`);
        const webhookPayload = {
            event: 'nova_pickup',
            timestamp: new Date().toISOString(),
            callSid: callSid,
            sessionId: sessionId,
            callData: {
                from: callData.from,
                to: callData.to,
                direction: callData.direction,
                status: 'nova_picked_up',
                streamSid: callData.streamSid
            },
            nova: {
                voiceId: config.voice.voiceId,
                status: 'active',
                speaksFirst: true
            },
            system: {
                knowledgeBase: 'active',
                guardRails: 'active',
                callRecording: 'active'
            }
        };
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Nova-Voice-System/1.0'
            },
            body: JSON.stringify(webhookPayload)
        });
        if (response.ok) {
            console.log(`✅ NOVA PICKUP WEBHOOK: Successfully triggered webhook for call ${callSid}`);
        }
        else {
            console.error(`❌ NOVA PICKUP WEBHOOK: Failed to trigger webhook for call ${callSid} - Status: ${response.status}`);
        }
    }
    catch (error) {
        console.error(`❌ NOVA PICKUP WEBHOOK: Error triggering webhook for call ${callSid}:`, error);
    }
}
// Function to trigger transcript webhook when call ends
async function triggerTranscriptWebhook(callSid, sessionId, callRecord) {
    const webhookUrl = config.advanced.transcriptWebhookUrl;
    console.log(`🔍 TRANSCRIPT WEBHOOK: Checking webhook configuration...`);
    console.log(`🔍 TRANSCRIPT WEBHOOK: Webhook URL set: ${webhookUrl ? 'YES' : 'NO'}`);
    if (!webhookUrl) {
        console.log('⚠️ TRANSCRIPT WEBHOOK: No webhook URL configured (TRANSCRIPT_WEBHOOK_URL)');
        console.log('⚠️ TRANSCRIPT WEBHOOK: Set TRANSCRIPT_WEBHOOK_URL environment variable to enable transcript webhooks');
        return;
    }
    try {
        console.log(`🔗 TRANSCRIPT WEBHOOK: Sending complete transcript for call ${callSid}...`);
        // Extract useful information from transcript
        const transcript = callRecord.transcriptSegments || [];
        const fullTranscript = transcript.map((segment) => `[${segment.timestamp.toISOString()}] ${segment.speaker.toUpperCase()}: ${segment.text}`).join('\n');
        // Extract phone numbers, emails, and names from transcript
        const extractedData = extractTranscriptData(fullTranscript);
        const webhookPayload = {
            event: 'call_completed',
            timestamp: new Date().toISOString(),
            callSid: callSid,
            sessionId: sessionId,
            callData: {
                startTime: callRecord.startTime?.toISOString(),
                endTime: callRecord.endTime?.toISOString(),
                duration: callRecord.duration,
                phoneNumber: callRecord.phoneNumber,
                status: callRecord.status,
                escalationReason: callRecord.escalationReason
            },
            transcript: {
                fullTranscript: fullTranscript,
                segments: transcript,
                extractedData: extractedData,
                summary: generateCallSummary(transcript)
            },
            analytics: {
                totalSegments: transcript.length,
                userSegments: transcript.filter((s) => s.speaker === 'user').length,
                aiSegments: transcript.filter((s) => s.speaker === 'ai').length,
                knowledgeBaseQueries: callRecord.knowledgeBaseQueries || [],
                guardRailsEvents: callRecord.guardRailsEvents || []
            }
        };
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Nova-Voice-System/1.0'
            },
            body: JSON.stringify(webhookPayload)
        });
        if (response.ok) {
            console.log(`✅ TRANSCRIPT WEBHOOK: Successfully sent transcript for call ${callSid}`);
        }
        else {
            console.error(`❌ TRANSCRIPT WEBHOOK: Failed to send transcript for call ${callSid} - Status: ${response.status}`);
        }
    }
    catch (error) {
        console.error(`❌ TRANSCRIPT WEBHOOK: Error sending transcript for call ${callSid}:`, error);
    }
}
// Function to extract useful data from transcript
function extractTranscriptData(transcript) {
    const phoneRegex = /(\+?1[-.\s]?)?(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g;
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const nameRegex = /(?:my name is|i'm|i am|call me|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
    const phones = [...transcript.matchAll(phoneRegex)].map(match => match[0]);
    const emails = [...transcript.matchAll(emailRegex)].map(match => match[0]);
    const names = [...transcript.matchAll(nameRegex)].map(match => match[1]);
    return {
        phoneNumbers: [...new Set(phones)], // Remove duplicates
        emails: [...new Set(emails)],
        names: [...new Set(names)],
        hasBookingInfo: transcript.toLowerCase().includes('booking') || transcript.toLowerCase().includes('reservation'),
        hasCancellationRequest: transcript.toLowerCase().includes('cancel'),
        hasExtensionRequest: transcript.toLowerCase().includes('extend'),
        hasPricingInquiry: transcript.toLowerCase().includes('price') || transcript.toLowerCase().includes('cost')
    };
}
// Function to generate call summary
function generateCallSummary(segments) {
    const userSegments = segments.filter(s => s.speaker === 'user').map(s => s.text).join(' ');
    const topics = [];
    if (userSegments.toLowerCase().includes('booking'))
        topics.push('Booking inquiry');
    if (userSegments.toLowerCase().includes('cancel'))
        topics.push('Cancellation request');
    if (userSegments.toLowerCase().includes('extend'))
        topics.push('Extension request');
    if (userSegments.toLowerCase().includes('price'))
        topics.push('Pricing inquiry');
    if (userSegments.toLowerCase().includes('status'))
        topics.push('Booking status');
    return `Call topics: ${topics.length > 0 ? topics.join(', ') : 'General inquiry'}. Duration: ${segments.length} exchanges.`;
}
// Initialize Guard Rails Service with config
const guardRailsService = new guard_rails_1.GuardRailsService({
    maxConversationLength: config.guardrails.maxConversationLength,
    maxSessionDuration: config.guardrails.maxSessionDuration,
    maxInappropriateAttempts: config.guardrails.maxInappropriateAttempts,
    rateLimitWindow: 60 * 1000, // 1 minute
    maxRequestsPerWindow: 10000, // Rate limiting effectively disabled for voice calls
});
// Initialize Call Recording Service
const callRecordingService = new call_recording_service_1.CallRecordingService(twClient);
// Initialize Call Transfer Service
const callTransferService = new simple_call_transfer_1.SimpleCallTransferService(twClient);
// Initialize Voicemail Service
const voicemailService = new voicemail_service_1.VoicemailService(twClient, bedrockClient);
// Initialize Voice Configuration Service with config voice ID
const voiceConfigService = new voice_config_1.VoiceConfigService(config.voice.voiceId);
// Initialize Transcript Storage Service
const transcriptService = new transcript_storage_service_1.TranscriptStorageService({
    localStorage: true,
    cloudStorage: false, // Set to true if you want cloud storage
    webhookDelivery: true,
    databaseStorage: false
});
// Set the voice in the Nova client from config
bedrockClient.setVoiceId(config.voice.voiceId);
const sipTwiml = `
<Response>
    <Say>Hang on for a moment while I forward the call to an agent</Say>
    <Pause length="1"/>
    <Dial>
    <Sip>${sipEndpoint}</Sip>
</Dial>
</Response>
`;
// Initialize Fastify
const fastify = (0, fastify_1.default)();
fastify.register(formbody_1.default);
fastify.register(websocket_1.default);
// Root Route
fastify.get('/', async (request, reply) => {
    reply.send({
        message: 'TempoVoice Phase 2 - Configurable AI Voice Agent is running!',
        version: '2.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
        deployment: {
            platform: 'AWS Fargate',
            region: config.aws.region || 'us-east-1',
            lastUpdated: new Date().toISOString()
        },
        features: {
            knowledgeBase: 'active',
            guardRails: 'active',
            callRecording: 'active',
            callTransfer: 'active',
            voicemail: 'active',
            voiceConfig: 'active',
            novaSonic: 'connected'
        },
        config: {
            voiceId: config.voice.voiceId,
            enableRecording: config.advanced.enableRecording,
            enableTranscription: config.advanced.enableTranscription
        }
    });
});
// Knowledge Base Test Route
fastify.get('/knowledge-base', async (request, reply) => {
    const kb = knowledgeBaseService.getKnowledgeBase();
    if (!kb) {
        reply.status(500).send({ error: 'Knowledge base not loaded' });
        return;
    }
    reply.send({
        message: 'Knowledge base loaded successfully',
        company: kb.company_info.name,
        vehicle_categories: Object.keys(kb.vehicle_fleet),
        total_faqs: Object.values(kb.frequently_asked_questions).flat().length
    });
});
// Knowledge Base Search Route
fastify.get('/search', async (request, reply) => {
    const { q } = request.query;
    if (!q) {
        reply.status(400).send({ error: 'Query parameter "q" is required' });
        return;
    }
    const results = knowledgeBaseService.searchKnowledgeBase(q);
    reply.send({
        query: q,
        results: results
    });
});
// Guard Rails Status Route
fastify.get('/guard-rails/status', async (request, reply) => {
    const stats = guardRailsService.getSessionStats();
    const config = guardRailsService.getConfig();
    reply.send({
        status: 'active',
        stats: stats,
        config: {
            maxConversationLength: config.maxConversationLength,
            maxSessionDuration: config.maxSessionDuration,
            maxInappropriateAttempts: config.maxInappropriateAttempts,
            rateLimitWindow: config.rateLimitWindow,
            maxRequestsPerWindow: config.maxRequestsPerWindow
        }
    });
});
// Guard Rails Configuration Route
fastify.post('/guard-rails/config', async (request, reply) => {
    try {
        const newConfig = request.body;
        guardRailsService.updateConfig(newConfig);
        reply.send({ message: 'Guard rails configuration updated successfully' });
    }
    catch (error) {
        reply.status(400).send({ error: 'Invalid configuration' });
    }
});
// Call Recording Status Route
fastify.get('/recordings/status', async (request, reply) => {
    const activeCalls = callRecordingService.getAllCallRecords();
    const analytics = callRecordingService.getCallAnalytics();
    reply.send({
        activeCalls: activeCalls.length,
        callRecords: activeCalls.map(call => ({
            callSid: call.callSid,
            sessionId: call.sessionId,
            startTime: call.startTime,
            duration: call.duration,
            status: call.status,
            phoneNumber: call.phoneNumber,
            hasTranscription: !!call.transcription
        })),
        analytics: analytics
    });
});
// Get Call Record Route
fastify.get('/recordings/:callSid', async (request, reply) => {
    const { callSid } = request.params;
    const callRecord = callRecordingService.getCallRecord(callSid);
    if (!callRecord) {
        reply.status(404).send({ error: 'Call record not found' });
        return;
    }
    reply.send(callRecord);
});
// Recording Callback Route (for Twilio webhooks)
fastify.post('/recording-callback', async (request, reply) => {
    const { CallSid, RecordingSid, RecordingStatus } = request.body;
    try {
        await callRecordingService.handleRecordingCallback(CallSid, RecordingSid, RecordingStatus);
        reply.send({ status: 'success' });
    }
    catch (error) {
        console.error('Error handling recording callback:', error);
        reply.status(500).send({ error: 'Failed to handle recording callback' });
    }
});
// Call Transfer Routes
fastify.post('/transfer/warm', async (request, reply) => {
    const { callSid, transferTo, reason } = request.body;
    if (!callSid || !transferTo) {
        reply.status(400).send({ error: 'callSid and transferTo are required' });
        return;
    }
    try {
        const result = await callTransferService.warmTransfer(callSid, transferTo, reason || 'Customer requested transfer');
        reply.send(result);
    }
    catch (error) {
        console.error('Error in warm transfer:', error);
        reply.status(500).send({ error: 'Failed to initiate warm transfer' });
    }
});
fastify.post('/transfer/cold', async (request, reply) => {
    const { callSid, transferTo, reason } = request.body;
    if (!callSid || !transferTo) {
        reply.status(400).send({ error: 'callSid and transferTo are required' });
        return;
    }
    try {
        const result = await callTransferService.coldTransfer(callSid, transferTo, reason || 'Direct transfer requested');
        reply.send(result);
    }
    catch (error) {
        console.error('Error in cold transfer:', error);
        reply.status(500).send({ error: 'Failed to initiate cold transfer' });
    }
});
fastify.post('/transfer/department', async (request, reply) => {
    const { callSid, department, reason } = request.body;
    if (!callSid || !department) {
        reply.status(400).send({ error: 'callSid and department are required' });
        return;
    }
    try {
        const result = await callTransferService.transferToDepartment(callSid, department, reason);
        reply.send(result);
    }
    catch (error) {
        console.error('Error in department transfer:', error);
        reply.status(500).send({ error: 'Failed to initiate department transfer' });
    }
});
fastify.post('/transfer/emergency', async (request, reply) => {
    const { callSid, emergencyNumber, reason } = request.body;
    if (!callSid || !emergencyNumber || !reason) {
        reply.status(400).send({ error: 'callSid, emergencyNumber, and reason are required' });
        return;
    }
    try {
        const result = await callTransferService.emergencyTransfer(callSid, emergencyNumber, reason);
        reply.send(result);
    }
    catch (error) {
        console.error('Error in emergency transfer:', error);
        reply.status(500).send({ error: 'Failed to initiate emergency transfer' });
    }
});
// Transfer Status and Analytics
fastify.get('/transfer/status/:callSid', async (request, reply) => {
    const { callSid } = request.params;
    try {
        const status = callTransferService.getTransferStatus(callSid);
        if (!status) {
            reply.status(404).send({ error: 'Transfer not found' });
            return;
        }
        reply.send(status);
    }
    catch (error) {
        console.error('Error getting transfer status:', error);
        reply.status(500).send({ error: 'Failed to get transfer status' });
    }
});
fastify.get('/transfer/stats', async (request, reply) => {
    try {
        const stats = callTransferService.getTransferStats();
        reply.send(stats);
    }
    catch (error) {
        console.error('Error getting transfer stats:', error);
        reply.status(500).send({ error: 'Failed to get transfer statistics' });
    }
});
// Voicemail Routes
fastify.post('/voicemail', async (request, reply) => {
    const { CallSid, From, RecordingUrl, TranscriptionText } = request.body;
    if (!CallSid || !From || !RecordingUrl) {
        reply.status(400).send({ error: 'CallSid, From, and RecordingUrl are required' });
        return;
    }
    try {
        const voicemail = await voicemailService.processVoicemail({
            callSid: CallSid,
            from: From,
            recordingUrl: RecordingUrl,
            transcription: TranscriptionText || 'No transcription available'
        });
        reply.send({
            status: 'success',
            voicemailId: voicemail.id,
            analysis: voicemail.aiAnalysis
        });
    }
    catch (error) {
        console.error('Error processing voicemail:', error);
        reply.status(500).send({ error: 'Failed to process voicemail' });
    }
});
fastify.post('/voicemail-transcribe', async (request, reply) => {
    const { CallSid, TranscriptionText, TranscriptionStatus } = request.body;
    console.log(`Voicemail transcription for call ${CallSid}: ${TranscriptionText}`);
    reply.send({ status: 'received' });
});
fastify.post('/voicemail-recording-status', async (request, reply) => {
    const { CallSid, RecordingStatus, RecordingUrl } = request.body;
    console.log(`Voicemail recording status for call ${CallSid}: ${RecordingStatus}`);
    reply.send({ status: 'received' });
});
// Voicemail Management Routes
fastify.get('/voicemail/list', async (request, reply) => {
    try {
        const voicemails = voicemailService.getAllVoicemails();
        reply.send(voicemails);
    }
    catch (error) {
        console.error('Error getting voicemails:', error);
        reply.status(500).send({ error: 'Failed to get voicemails' });
    }
});
fastify.get('/voicemail/urgent', async (request, reply) => {
    try {
        const urgentVoicemails = voicemailService.getUrgentVoicemails();
        reply.send(urgentVoicemails);
    }
    catch (error) {
        console.error('Error getting urgent voicemails:', error);
        reply.status(500).send({ error: 'Failed to get urgent voicemails' });
    }
});
fastify.get('/voicemail/stats', async (request, reply) => {
    try {
        const stats = voicemailService.getVoicemailStats();
        reply.send(stats);
    }
    catch (error) {
        console.error('Error getting voicemail stats:', error);
        reply.status(500).send({ error: 'Failed to get voicemail statistics' });
    }
});
fastify.get('/voicemail/:id', async (request, reply) => {
    const { id } = request.params;
    try {
        const voicemail = voicemailService.getVoicemail(id);
        if (!voicemail) {
            reply.status(404).send({ error: 'Voicemail not found' });
            return;
        }
        reply.send(voicemail);
    }
    catch (error) {
        console.error('Error getting voicemail:', error);
        reply.status(500).send({ error: 'Failed to get voicemail' });
    }
});
fastify.put('/voicemail/:id/status', async (request, reply) => {
    const { id } = request.params;
    const { status, notes } = request.body;
    try {
        const success = voicemailService.updateVoicemailStatus(id, status, notes);
        if (!success) {
            reply.status(404).send({ error: 'Voicemail not found' });
            return;
        }
        reply.send({ status: 'success' });
    }
    catch (error) {
        console.error('Error updating voicemail status:', error);
        reply.status(500).send({ error: 'Failed to update voicemail status' });
    }
});
fastify.get('/voicemail-twiML/:scenario', async (request, reply) => {
    const { scenario } = request.params;
    try {
        const twiml = voicemailService.createVoicemailTwiML(scenario);
        reply.type('text/xml').send(twiml);
    }
    catch (error) {
        console.error('Error creating voicemail TwiML:', error);
        reply.status(500).send({ error: 'Failed to create voicemail TwiML' });
    }
});
// Voice Configuration Routes
fastify.get('/voice/options', async (request, reply) => {
    try {
        const voices = voiceConfigService.getAllVoices();
        reply.send({
            current: voiceConfigService.getCurrentVoiceId(),
            available: voices
        });
    }
    catch (error) {
        console.error('Error getting voice options:', error);
        reply.status(500).send({ error: 'Failed to get voice options' });
    }
});
fastify.get('/voice/current', async (request, reply) => {
    try {
        const currentVoice = voiceConfigService.getVoiceInfo();
        const novaVoiceId = bedrockClient.getVoiceId();
        reply.send({
            voiceId: voiceConfigService.getCurrentVoiceId(),
            novaVoiceId: novaVoiceId,
            voiceInfo: currentVoice,
            isSynced: voiceConfigService.getCurrentVoiceId() === novaVoiceId
        });
    }
    catch (error) {
        console.error('Error getting current voice:', error);
        reply.status(500).send({ error: 'Failed to get current voice' });
    }
});
fastify.post('/voice/set', async (request, reply) => {
    const { voiceId } = request.body;
    if (!voiceId) {
        reply.status(400).send({ error: 'voiceId is required' });
        return;
    }
    try {
        const success = voiceConfigService.setVoiceId(voiceId);
        if (success) {
            // Update the Nova client with the new voice ID
            bedrockClient.setVoiceId(voiceId);
            const voiceInfo = voiceConfigService.getVoiceInfo();
            reply.send({
                success: true,
                voiceId: voiceConfigService.getCurrentVoiceId(),
                voiceInfo: voiceInfo,
                message: `Voice changed to ${voiceInfo?.name || voiceId}`
            });
        }
        else {
            reply.status(400).send({ error: 'Invalid voice ID' });
        }
    }
    catch (error) {
        console.error('Error setting voice:', error);
        reply.status(500).send({ error: 'Failed to set voice' });
    }
});
fastify.get('/voice/by-language/:language', async (request, reply) => {
    const { language } = request.params;
    try {
        const voices = voiceConfigService.getVoicesByLanguage(language);
        reply.send(voices);
    }
    catch (error) {
        console.error('Error getting voices by language:', error);
        reply.status(500).send({ error: 'Failed to get voices by language' });
    }
});
fastify.get('/voice/recommended/:useCase', async (request, reply) => {
    const { useCase } = request.params;
    try {
        const recommendedVoice = voiceConfigService.getRecommendedVoice(useCase);
        reply.send(recommendedVoice);
    }
    catch (error) {
        console.error('Error getting recommended voice:', error);
        reply.status(500).send({ error: 'Failed to get recommended voice' });
    }
});
// Route to initiate outbound calls to a phone number from Twilio
// Invoke this endpoint to initiate an outbound call (AWS Sample Implementation)
fastify.all('/outbound-call', async (request, reply) => {
    try {
        // Get the number to call from the request body
        const { toNumber } = request.body;
        // Validate that toNumber is provided
        if (!toNumber) {
            return reply.status(400).send({
                success: false,
                error: 'toNumber is required in request body'
            });
        }
        console.log(`🔍 DEBUG: Attempting outbound call from ${fromNumber} to ${toNumber}`);
        const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                              <Response>
                                  <Connect>
                                    <Stream url="wss://${request.headers.host}/media-stream" />
                                  </Connect>
                              </Response>`;
        console.log(`🔍 DEBUG: Environment variables - FROM: ${fromNumber}, TO: ${toNumber}`);
        const call = await twClient.calls.create({
            from: fromNumber,
            to: toNumber,
            twiml: twimlResponse,
        });
        console.log(`✅ SUCCESS: Call initiated with SID: ${call.sid}`);
        reply.type('application/json').send({
            success: true,
            callSid: call.sid,
            from: fromNumber,
            to: toNumber
        });
    }
    catch (error) {
        const { toNumber } = request.body;
        console.error(`❌ TWILIO ERROR:`, error);
        console.error(`❌ ERROR CODE: ${error.code}`);
        console.error(`❌ ERROR MESSAGE: ${error.message}`);
        console.error(`❌ FROM NUMBER: ${fromNumber}`);
        console.error(`❌ TO NUMBER: ${toNumber || 'unknown'}`);
        reply.status(400).send({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: `Attempted to call from ${fromNumber} to ${toNumber || 'unknown'}`
            }
        });
    }
});
// Debug endpoint to check Twilio number capabilities
fastify.get('/debug/twilio-numbers', async (request, reply) => {
    try {
        console.log('🔍 DEBUG: Fetching Twilio account and number information...');
        // Get all phone numbers
        const phoneNumbers = await twClient.incomingPhoneNumbers.list();
        // Get specific number details
        const targetNumber = fromNumber;
        const numberDetails = phoneNumbers.find(num => num.phoneNumber === targetNumber);
        const debugInfo = {
            environment: {
                fromNumber: fromNumber,
                accountSid: accountSid,
                apiSid: apiSid
            },
            targetNumber: numberDetails ? {
                sid: numberDetails.sid,
                phoneNumber: numberDetails.phoneNumber,
                friendlyName: numberDetails.friendlyName,
                capabilities: numberDetails.capabilities,
                voiceUrl: numberDetails.voiceUrl,
                voiceMethod: numberDetails.voiceMethod,
                statusCallback: numberDetails.statusCallback,
                statusCallbackMethod: numberDetails.statusCallbackMethod,
                origin: numberDetails.origin,
                trunkSid: numberDetails.trunkSid,
                emergencyStatus: numberDetails.emergencyStatus,
                emergencyAddressSid: numberDetails.emergencyAddressSid
            } : { error: 'Number not found in account' },
            allNumbers: phoneNumbers.map(num => ({
                phoneNumber: num.phoneNumber,
                friendlyName: num.friendlyName,
                capabilities: num.capabilities,
                origin: num.origin,
                voiceUrl: num.voiceUrl,
                trunkSid: num.trunkSid
            })),
            troubleshooting: {
                numberInList: phoneNumbers.some(num => num.phoneNumber === targetNumber),
                totalNumbers: phoneNumbers.length,
                possibleIssues: [
                    'Number not purchased from this account',
                    'Account requires verification',
                    'Trial account limitations',
                    'Geographic restrictions',
                    'API key permissions'
                ]
            }
        };
        console.log('✅ DEBUG: Successfully fetched Twilio information');
        reply.send(debugInfo);
    }
    catch (error) {
        console.error('❌ DEBUG ERROR:', error);
        reply.status(500).send({
            error: {
                message: error.message,
                code: error.code,
                details: 'Failed to fetch Twilio account information'
            }
        });
    }
});
// Register Transcript API Endpoints
(0, transcript_api_endpoints_1.registerTranscriptEndpoints)(fastify, transcriptService);
// Route for Twilio to handle incoming and outgoing calls
// <Say> punctuation to improve text-to-speech translation
fastify.all('/incoming-call', async (request, reply) => {
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                          <Response>
                              <Connect>
                                <Stream url="wss://${request.headers.host}/media-stream" />
                              </Connect>
                          </Response>`;
    reply.type('text/xml').send(twimlResponse);
});
// Route for Twilio to handle incoming and outgoing calls
// <Say> punctuation to improve text-to-speech translation
fastify.all('/failover', async (request, reply) => {
    reply.type('text/xml').send(sipTwiml);
});
// WebSocket route for media-stream
fastify.register(async (fastify) => {
    fastify.get('/media-stream', { websocket: true }, (connection, req) => {
        console.log('Client connected');
        //create a session
        const sessionId = (0, node_crypto_1.randomUUID)();
        const session = bedrockClient.createStreamSession(sessionId);
        sessionMap[sessionId] = session; //store the session in the map
        // Initialize guard rails for this session
        guardRailsService.initializeSession(sessionId);
        bedrockClient.initiateSession(sessionId); //initiate the session
        let callSid = '';
        let callRecord = null;
        // Handle incoming messages from Twilio
        connection.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                //use streamSid as session id. little complicated in conference scenarios
                switch (data.event) {
                    case 'connected':
                        console.log(`connected event ${message}`);
                        await session.setupPromptStart();
                        break;
                    case 'start':
                        await session.setupSystemPrompt(undefined, createSystemPrompt());
                        await session.setupStartAudio();
                        session.streamSid = data.streamSid;
                        callSid = data.start.callSid; //call sid to update while redirecting it to SIP endpoint
                        console.log(`Stream started streamSid: ${session.streamSid}, callSid: ${callSid}`);
                        // 🎤 NOVA SPEAKS FIRST: Send initial audio IMMEDIATELY after setup to trigger Nova response
                        console.log('🎤 NOVA SPEAKS FIRST: Call connected, triggering Nova to speak first...');
                        try {
                            await sendInitialAudio(session, callSid, sessionId);
                            // 🔗 WEBHOOK TRIGGER: Notify external workflow when Nova picks up
                            await triggerNovaPickupWebhook(callSid, sessionId, data.start);
                        }
                        catch (error) {
                            console.error('❌ NOVA SPEAKS FIRST: Error sending initial audio:', error);
                        }
                        // Start call recording if enabled
                        if (config.advanced.enableRecording) {
                            try {
                                callRecord = await callRecordingService.startCallRecording(callSid, sessionId);
                                console.log(`Started recording for call ${callSid}`);
                            }
                            catch (error) {
                                console.error('Failed to start call recording:', error);
                            }
                        }
                        break;
                    case 'media':
                        if (!(session.streamSid))
                            break;
                        //console.log(`Audio ${data.media.track} - sequence: ${data.sequenceNumber}`);
                        //convert from 8-bit mulaw to 16-bit LPCM
                        const audioInput = Buffer.from(data.media.payload, 'base64');
                        const pcmSamples = alawmulaw_1.mulaw.decode(audioInput);
                        const audioBuffer = Buffer.from(pcmSamples.buffer);
                        //send audio to nova client
                        //const audioBuffer = data.media.payload;                        
                        await session.streamAudio(audioBuffer);
                        break;
                    default:
                        console.log('Received non-media event:', data.event);
                        break;
                }
            }
            catch (error) {
                console.error('Error parsing message:', error, 'Message:', message);
                connection.close();
            }
        });
        // Handle connection close
        connection.on('close', async () => {
            console.log('Client disconnected.');
            // End call recording if it was started
            if (callRecord && callSid && config.advanced.enableRecording) {
                try {
                    await callRecordingService.endCallRecording(callSid);
                    console.log(`Ended recording for call ${callSid}`);
                    // 🔗 TRANSCRIPT STORAGE: Save complete transcript using new storage service
                    if (config.advanced.enableTranscription) {
                        try {
                            await transcriptService.saveTranscript(callRecord);
                            console.log(`✅ Transcript saved for call ${callSid}`);
                        }
                        catch (error) {
                            console.error('❌ Error saving transcript:', error);
                        }
                    }
                    // 🔗 TRANSCRIPT WEBHOOK: Send complete transcript to external system (legacy)
                    await triggerTranscriptWebhook(callSid, sessionId, callRecord);
                }
                catch (error) {
                    console.error('Error ending call recording:', error);
                }
            }
            // Clean up guard rails session
            guardRailsService.cleanupSession(sessionId);
            // Clean up initial audio tracking for this session
            sessionsWithInitialAudioSent.delete(sessionId);
            console.log(`🧹 NOVA SPEAKS FIRST: Cleaned up session ${sessionId} from initial audio tracking`);
        });
        /**
         * Handle all the Nova Sonic events
         */
        // Set up event handlers
        session.onEvent('contentStart', (data) => {
            console.log('contentStart:', data);
            //socket.emit('contentStart', data);
        });
        session.onEvent('textOutput', async (data) => {
            console.log('Text output:', data.content.substring(0, 50) + '...');
            // Capture transcripts for both user and AI if transcription is enabled
            if (callRecord && callSid && config.advanced.enableTranscription) {
                // Determine speaker based on role - USER role means user spoke, ASSISTANT role means AI spoke
                const speaker = data.role === 'USER' ? 'user' : 'ai';
                callRecordingService.addTranscriptSegment(callSid, speaker, data.content);
                console.log(`Added transcript segment for call ${callSid}: ${speaker} - ${data.content.substring(0, 30)}...`);
            }
            // Check if user wants to leave a voicemail
            const userWantsVoicemail = data.content.toLowerCase().includes('voicemail') ||
                data.content.toLowerCase().includes('leave a message') ||
                data.content.toLowerCase().includes('record a message') ||
                data.content.toLowerCase().includes('voice mail') ||
                data.content.toLowerCase().includes('leave a voicemail');
            if (userWantsVoicemail) {
                console.log('User wants to leave a voicemail - initiating voicemail recording');
                // Send voicemail prompt
                const voicemailPrompt = "Okay, I'll start recording now. Please speak your message and our team members will get back to you. Go ahead and start speaking.";
                // Convert text to audio using the same method as other responses
                const audioData = Buffer.from(voicemailPrompt, 'utf8');
                const pcmSamples = new Int16Array(audioData.length);
                for (let i = 0; i < audioData.length; i++) {
                    pcmSamples[i] = audioData[i];
                }
                const mulawAudio = alawmulaw_1.mulaw.encode(pcmSamples);
                const response = {
                    event: "media",
                    media: {
                        track: "outbound",
                        chunk: "1",
                        timestamp: "1694567890",
                        payload: Buffer.from(mulawAudio).toString('base64')
                    }
                };
                connection.send(JSON.stringify(response));
                // Start voicemail recording
                try {
                    const voicemailTwiML = voicemailService.createVoicemailTwiML('after-hours');
                    await twClient.calls(callSid).update({ twiml: voicemailTwiML });
                    console.log(`Voicemail recording started for call ${callSid}`);
                }
                catch (error) {
                    console.log('Error starting voicemail recording:', error);
                }
                return;
            }
            // BACKUP: Check if AI said goodbye but didn't call end_call tool
            const goodbyeKeywords = [
                'goodbye', 'bye', 'thank you for calling', 'have a great day',
                'that\'s all', 'i\'m done', 'thanks', 'talk to you later',
                'see you later', 'take care', 'farewell'
            ];
            const aiSaidGoodbye = goodbyeKeywords.some(keyword => data.content.toLowerCase().includes(keyword.toLowerCase()));
            // If AI said goodbye but we don't see end_call tool being used, trigger it manually
            if (aiSaidGoodbye && !data.content.includes('end_call')) {
                console.log('🚨 BACKUP: AI said goodbye but didn\'t call end_call tool - triggering manually');
                try {
                    // Log the backup action
                    if (callRecord && callSid) {
                        await callRecord.addTranscriptSegment('system', 'BACKUP: Auto-triggering end_call due to goodbye detection');
                    }
                    // Create TwiML to hang up the call
                    const hangupTwiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you for calling The Car Genie. Have a great day!</Say><Hangup/></Response>';
                    // Enhanced error handling with retry logic for backup detection
                    const maxRetries = 3;
                    let success = false;
                    for (let attempt = 1; attempt <= maxRetries; attempt++) {
                        try {
                            console.log(`🔄 BACKUP: Attempt ${attempt}/${maxRetries} to end call ${callSid}`);
                            await twClient.calls(callSid).update({ twiml: hangupTwiml });
                            console.log(`✅ BACKUP: Call ${callSid} ended via backup detection on attempt ${attempt}`);
                            success = true;
                            break;
                        }
                        catch (error) {
                            console.error(`❌ BACKUP: Attempt ${attempt} failed to end call:`, error);
                            if (attempt === maxRetries) {
                                console.error('🚨 BACKUP: All retry attempts failed, using fallback');
                                // Final fallback: force connection close
                                connection.close();
                                return;
                            }
                            // Wait before retry (exponential backoff)
                            const delay = 1000 * attempt;
                            console.log(`⏳ BACKUP: Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    }
                    if (success) {
                        // Dynamic delay based on message length
                        const messageLength = Math.max(data.content.length * 50, 2000);
                        const delay = Math.min(messageLength, 5000);
                        console.log(`⏰ BACKUP: Closing connection in ${delay}ms`);
                        setTimeout(() => {
                            connection.close();
                        }, delay);
                    }
                    return; // Exit early to prevent further processing
                }
                catch (error) {
                    console.error('🚨 BACKUP: Critical error in backup goodbye detection:', error);
                    // Ultimate fallback: just close the connection immediately
                    connection.close();
                    return;
                }
            }
            // Transcript segments are now captured above in the unified handler
            // Apply guard rails to AI response (with exception for tool responses)
            // Skip guard rails validation for end_call tool responses to prevent conflicts
            const isEndCallResponse = data.content.toLowerCase().includes('thank you for calling') ||
                data.content.toLowerCase().includes('have a great day') ||
                data.content.includes('end_call');
            let guardResult;
            if (isEndCallResponse) {
                console.log('🛡️ GUARD RAILS: Skipping validation for end_call tool response');
                guardResult = { allowed: true, action: 'continue' };
            }
            else {
                guardResult = guardRailsService.validateMessage(sessionId, data.content, callSid);
            }
            if (!guardResult.allowed) {
                console.log(`Guard rails blocked response: ${guardResult.reason}`);
                if (guardResult.action === 'escalate') {
                    guardRailsService.escalateSession(sessionId, guardResult.reason || 'Unknown');
                    // Log guard rails event
                    if (callRecord && callSid) {
                        callRecordingService.addGuardRailsEvent(callSid, 'escalation', guardResult.reason || 'Unknown', 'escalate');
                    }
                    // Use call transfer service for escalation
                    try {
                        const transferResult = await callTransferService.transferToDepartment(callSid, 'support', guardResult.reason || 'Guard rails escalation');
                        console.log(`Guard rails escalated call ${callSid} to support department:`, transferResult);
                    }
                    catch (error) {
                        console.log('Error escalating call via transfer:', error);
                        // Fallback to original method
                        try {
                            await twClient.calls(callSid).update({ twiml: sipTwiml });
                            console.log(`Fallback escalation for call ${callSid}`);
                        }
                        catch (fallbackError) {
                            console.log('Fallback escalation failed:', fallbackError);
                        }
                    }
                }
                else if (guardResult.action === 'terminate') {
                    // Send termination message and close connection
                    const terminationResponse = {
                        event: "media",
                        media: {
                            track: "outbound",
                            payload: Buffer.from(guardResult.message || 'Thank you for calling The Car Genie. Goodbye.').toString('base64')
                        },
                        streamSid: session.streamSid
                    };
                    connection.send(JSON.stringify(terminationResponse));
                    connection.close();
                    return;
                }
            }
            //socket.emit('textOutput', data);
        });
        session.onEvent('audioOutput', (data) => {
            //console.log('Audio output received, sending to client');
            //socket.emit('audioOutput', data);
            //send the audio back to twilio
            //console.log('audioOutput')
            // Decode base64 to get the PCM buffer
            const buffer = Buffer.from(data['content'], 'base64');
            // Convert to Int16Array (your existing code is correct here)
            const pcmSamples = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / Int16Array.BYTES_PER_ELEMENT);
            // Encode to mulaw (8-bit)
            const mulawSamples = alawmulaw_1.mulaw.encode(pcmSamples);
            // Convert to base64
            const payload = Buffer.from(mulawSamples).toString('base64');
            const audioResponse = {
                event: "media",
                media: {
                    track: "outbound",
                    payload
                },
                "streamSid": session.streamSid
            };
            connection.send(JSON.stringify(audioResponse));
        });
        session.onEvent('error', (data) => {
            console.error('Error in session:', data);
            //socket.emit('error', data);
            //optionally close the connection based on the error            
        });
        session.onEvent('toolUse', async (data) => {
            console.log('Tool use detected:', data.toolName);
            if (data.toolName == 'support') {
                console.log(`Transfering call id ${callSid}`);
                try {
                    // Use call transfer service for better tracking
                    const transferResult = await callTransferService.transferToDepartment(callSid, 'support', 'Customer requested human support');
                    console.log('Support transfer result:', transferResult);
                    // Log the transfer in call recording
                    if (callRecord) {
                        callRecordingService.addGuardRailsEvent(callSid, 'escalation', 'Customer requested support', 'transfer');
                    }
                }
                catch (error) {
                    console.log('Transfer error:', error);
                    // Fallback to original method
                    try {
                        await twClient.calls(callSid).update({ twiml: sipTwiml });
                    }
                    catch (fallbackError) {
                        console.log('Fallback transfer failed:', fallbackError);
                    }
                }
            }
            else if (data.toolName == 'end_call') {
                console.log(`🎯 TOOL: Ending call ${callSid} gracefully`);
                try {
                    // Log the call end in recording
                    if (callRecord) {
                        await callRecord.addTranscriptSegment('system', 'Call ended gracefully by customer request');
                    }
                    // Create TwiML to hang up the call
                    const hangupTwiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you for calling The Car Genie. Have a great day!</Say><Hangup/></Response>';
                    // Enhanced error handling with retry logic
                    const maxRetries = 3;
                    let success = false;
                    for (let attempt = 1; attempt <= maxRetries; attempt++) {
                        try {
                            console.log(`🔄 TOOL: Attempt ${attempt}/${maxRetries} to end call ${callSid}`);
                            await twClient.calls(callSid).update({ twiml: hangupTwiml });
                            console.log(`✅ TOOL: Call ${callSid} ended gracefully on attempt ${attempt}`);
                            success = true;
                            break;
                        }
                        catch (error) {
                            console.error(`❌ TOOL: Attempt ${attempt} failed to end call:`, error);
                            if (attempt === maxRetries) {
                                console.error('🚨 TOOL: All retry attempts failed, using fallback');
                                // Final fallback: force connection close
                                connection.close();
                                return;
                            }
                            // Wait before retry (exponential backoff)
                            const delay = 1000 * attempt;
                            console.log(`⏳ TOOL: Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    }
                    if (success) {
                        // Close the session after a short delay
                        const messageLength = Math.max(data.content.length * 50, 2000); // Dynamic delay based on message length
                        const delay = Math.min(messageLength, 5000); // Cap at 5 seconds
                        console.log(`⏰ TOOL: Closing connection in ${delay}ms`);
                        setTimeout(() => {
                            connection.close();
                        }, delay);
                    }
                }
                catch (error) {
                    console.error('🚨 TOOL: Critical error in end_call tool:', error);
                    // Ultimate fallback: just close the connection immediately
                    connection.close();
                }
            }
            else if (data.toolName == 'transfer_call') {
                console.log(`🔄 TOOL: Transfer call to department`);
                try {
                    const args = JSON.parse(data.toolArgs || '{}');
                    const department = args.department || 'support';
                    const reason = args.reason || 'Customer requested transfer';
                    console.log(`🔄 TOOL: Transferring call ${callSid} to ${department} department`);
                    // Use call transfer service
                    const transferResult = await callTransferService.transferToDepartment(callSid, department, reason);
                    console.log(`✅ TOOL: Transfer result:`, transferResult);
                    // Log the transfer in call recording
                    if (callRecord) {
                        await callRecord.addTranscriptSegment('system', `Call transferred to ${department} department: ${reason}`);
                    }
                }
                catch (error) {
                    console.error('❌ TOOL: Error in transfer_call tool:', error);
                    // Fallback: try basic transfer
                    try {
                        const sipTwiml = callTransferService.warmTransfer(callSid, '+17755935774', 'Customer requested transfer');
                        console.log('✅ TOOL: Fallback transfer successful');
                    }
                    catch (fallbackError) {
                        console.error('🚨 TOOL: Fallback transfer failed:', fallbackError);
                    }
                }
            }
            else if (data.toolName == 'warm_transfer') {
                console.log(`🔄 TOOL: Warm transfer with context`);
                try {
                    const args = JSON.parse(data.toolArgs || '{}');
                    const department = args.department || 'support';
                    const reason = args.reason || 'Customer requested warm transfer';
                    console.log(`🔄 TOOL: Warm transferring call ${callSid} to ${department}`);
                    // Use warm transfer service
                    const transferResult = await callTransferService.warmTransfer(callSid, '+17755935774', reason);
                    console.log(`✅ TOOL: Warm transfer result:`, transferResult);
                    // Log the transfer in call recording
                    if (callRecord) {
                        await callRecord.addTranscriptSegment('system', `Warm transfer to ${department}: ${reason}`);
                    }
                }
                catch (error) {
                    console.error('❌ TOOL: Error in warm_transfer tool:', error);
                    // Fallback: basic transfer
                    try {
                        await twClient.calls(callSid).update({ twiml: sipTwiml });
                        console.log('✅ TOOL: Fallback warm transfer successful');
                    }
                    catch (fallbackError) {
                        console.error('🚨 TOOL: Fallback warm transfer failed:', fallbackError);
                    }
                }
            }
            else if (data.toolName == 'cold_transfer') {
                console.log(`🔄 TOOL: Cold transfer (direct)`);
                try {
                    const args = JSON.parse(data.toolArgs || '{}');
                    const department = args.department || 'support';
                    const reason = args.reason || 'Customer requested direct transfer';
                    console.log(`🔄 TOOL: Cold transferring call ${callSid} to ${department}`);
                    // Use cold transfer service
                    const transferResult = await callTransferService.coldTransfer(callSid, '+17755935774', reason);
                    console.log(`✅ TOOL: Cold transfer result:`, transferResult);
                    // Log the transfer in call recording
                    if (callRecord) {
                        await callRecord.addTranscriptSegment('system', `Cold transfer to ${department}: ${reason}`);
                    }
                }
                catch (error) {
                    console.error('❌ TOOL: Error in cold_transfer tool:', error);
                    // Fallback: basic transfer
                    try {
                        await twClient.calls(callSid).update({ twiml: sipTwiml });
                        console.log('✅ TOOL: Fallback cold transfer successful');
                    }
                    catch (fallbackError) {
                        console.error('🚨 TOOL: Fallback cold transfer failed:', fallbackError);
                    }
                }
            }
            else if (data.toolName == 'voicemail') {
                console.log(`🎤 TOOL: Starting voicemail recording`);
                try {
                    // Log the voicemail initiation
                    if (callRecord) {
                        await callRecord.addTranscriptSegment('system', 'Customer requested to leave voicemail - recording started');
                    }
                    // Start voicemail recording
                    const voicemailTwiML = voicemailService.createVoicemailTwiML('after-hours');
                    await twClient.calls(callSid).update({ twiml: voicemailTwiML });
                    console.log(`✅ TOOL: Voicemail recording started for call ${callSid}`);
                }
                catch (error) {
                    console.error('❌ TOOL: Error starting voicemail recording:', error);
                }
            }
            else if (data.toolName == 'schedule_callback') {
                console.log(`📞 TOOL: Scheduling callback`);
                try {
                    const args = JSON.parse(data.toolArgs || '{}');
                    const customerPhone = args.customerPhone || 'Unknown';
                    const preferredTime = args.preferredTime || 'ASAP';
                    const reason = args.reason || 'Customer requested callback';
                    console.log(`📞 TOOL: Scheduling callback for ${customerPhone} at ${preferredTime}`);
                    // Log the callback scheduling
                    if (callRecord) {
                        await callRecord.addTranscriptSegment('system', `Callback scheduled: ${customerPhone} at ${preferredTime} - ${reason}`);
                    }
                    // In a real implementation, you would:
                    // 1. Store callback in database
                    // 2. Schedule reminder/notification
                    // 3. Send confirmation to customer
                    console.log(`✅ TOOL: Callback scheduled successfully`);
                }
                catch (error) {
                    console.error('❌ TOOL: Error scheduling callback:', error);
                }
            }
            //socket.emit('toolUse', data);
        });
        session.onEvent('toolResult', (data) => {
            console.log('Tool result received');
            //socket.emit('toolResult', data);
        });
        session.onEvent('contentEnd', (data) => {
            console.log('Content end received');
            //socket.emit('contentEnd', data);
        });
        session.onEvent('streamComplete', () => {
            console.log('Stream completed for client:', session.streamSid);
            //socket.emit('streamComplete');            
        });
    });
});
const PORT = process.env.PORT || 3000;
fastify.listen({
    port: Number(PORT),
    host: '0.0.0.0'
}, (err, address) => {
    if (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
    console.log(`Server is listening on ${address}`);
    console.log(`Health check available at: ${address}/`);
});
//# sourceMappingURL=server.js.map