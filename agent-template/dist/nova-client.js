"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S2SBidirectionalStreamClient = exports.StreamSession = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const node_http_handler_1 = require("@smithy/node-http-handler");
const node_crypto_1 = require("node:crypto");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const rxjs_2 = require("rxjs");
const consts_1 = require("./consts");
const mock_tools_1 = require("./mock-tools");
class StreamSession {
    constructor(sessionId, client) {
        this.sessionId = sessionId;
        this.client = client;
        this.audioBufferQueue = [];
        this.maxQueueSize = 200; // Maximum number of audio chunks to queue
        this.isProcessingAudio = false;
        this.isActive = true;
        this.streamSid = ""; //for twilio stream
    }
    // Register event handlers for this specific session
    onEvent(eventType, handler) {
        this.client.registerEventHandler(this.sessionId, eventType, handler);
        return this; // For chaining
    }
    async setupPromptStart() {
        this.client.setupPromptStartEvent(this.sessionId);
    }
    async setupSystemPrompt(textConfig = consts_1.DefaultTextConfiguration, systemPromptContent = consts_1.DefaultSystemPrompt) {
        this.client.setupSystemPromptEvent(this.sessionId, textConfig, systemPromptContent);
    }
    async setupStartAudio(audioConfig = consts_1.DefaultAudioInputConfiguration) {
        this.client.setupStartAudioEvent(this.sessionId, audioConfig);
    }
    // Stream audio for this session
    async streamAudio(audioData) {
        // Check queue size to avoid memory issues
        if (this.audioBufferQueue.length >= this.maxQueueSize) {
            // Queue is full, drop oldest chunk
            this.audioBufferQueue.shift();
            console.log("Audio queue full, dropping oldest chunk");
        }
        // Queue the audio chunk for streaming
        this.audioBufferQueue.push(audioData);
        this.processAudioQueue();
    }
    // Process audio queue for continuous streaming
    async processAudioQueue() {
        if (this.isProcessingAudio || this.audioBufferQueue.length === 0 || !this.isActive)
            return;
        this.isProcessingAudio = true;
        try {
            // Process all chunks in the queue, up to a reasonable limit
            let processedChunks = 0;
            const maxChunksPerBatch = 5; // Process max 5 chunks at a time to avoid overload
            while (this.audioBufferQueue.length > 0 && processedChunks < maxChunksPerBatch && this.isActive) {
                const audioChunk = this.audioBufferQueue.shift();
                if (audioChunk) {
                    await this.client.streamAudioChunk(this.sessionId, audioChunk);
                    processedChunks++;
                }
            }
        }
        finally {
            this.isProcessingAudio = false;
            // If there are still items in the queue, schedule the next processing using setTimeout
            if (this.audioBufferQueue.length > 0 && this.isActive) {
                setTimeout(() => this.processAudioQueue(), 0);
            }
        }
    }
    // Get session ID
    getSessionId() {
        return this.sessionId;
    }
    async endAudioContent() {
        if (!this.isActive)
            return;
        await this.client.sendContentEnd(this.sessionId);
    }
    async endPrompt() {
        if (!this.isActive)
            return;
        await this.client.sendPromptEnd(this.sessionId);
    }
    async close() {
        if (!this.isActive)
            return;
        this.isActive = false;
        this.audioBufferQueue = []; // Clear any pending audio
        await this.client.sendSessionEnd(this.sessionId);
        console.log(`Session ${this.sessionId} close completed`);
    }
}
exports.StreamSession = StreamSession;
class S2SBidirectionalStreamClient {
    constructor(config) {
        this.activeSessions = new Map();
        this.sessionLastActivity = new Map();
        this.sessionCleanupInProgress = new Set();
        this.voiceId = "tiffany"; // Default to Tiffany (female voice)
        const http2Client = new node_http_handler_1.NodeHttp2Handler({
            requestTimeout: 300000,
            sessionTimeout: 300000,
            disableConcurrentStreams: false,
            maxConcurrentStreams: 20,
            ...config.requestHandlerConfig,
        });
        if (!config.clientConfig.credentials) {
            throw new Error("No credentials provided");
        }
        this.bedrockRuntimeClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
            ...config.clientConfig,
            credentials: config.clientConfig.credentials,
            region: config.clientConfig.region || "us-east-1",
            requestHandler: http2Client
        });
        this.inferenceConfig = config.inferenceConfig ?? {
            maxTokens: 1024,
            topP: 0.9,
            temperature: 0.7,
        };
    }
    // Voice configuration methods
    setVoiceId(voiceId) {
        this.voiceId = voiceId;
        console.log(`Voice ID changed to: ${voiceId}`);
    }
    getVoiceId() {
        return this.voiceId;
    }
    getAudioOutputConfiguration() {
        return {
            ...consts_1.DefaultAudioOutputConfiguration,
            voiceId: this.voiceId
        };
    }
    isSessionActive(sessionId) {
        const session = this.activeSessions.get(sessionId);
        return !!session && session.isActive;
    }
    getActiveSessions() {
        return Array.from(this.activeSessions.keys());
    }
    getLastActivityTime(sessionId) {
        return this.sessionLastActivity.get(sessionId) || 0;
    }
    updateSessionActivity(sessionId) {
        this.sessionLastActivity.set(sessionId, Date.now());
    }
    isCleanupInProgress(sessionId) {
        return this.sessionCleanupInProgress.has(sessionId);
    }
    // Create a new streaming session
    createStreamSession(sessionId = (0, node_crypto_1.randomUUID)(), config) {
        if (this.activeSessions.has(sessionId)) {
            throw new Error(`Stream session with ID ${sessionId} already exists`);
        }
        const session = {
            queue: [],
            queueSignal: new rxjs_1.Subject(),
            closeSignal: new rxjs_1.Subject(),
            responseSubject: new rxjs_1.Subject(),
            toolUseContent: null,
            toolUseId: "",
            toolName: "",
            responseHandlers: new Map(),
            promptName: (0, node_crypto_1.randomUUID)(),
            inferenceConfig: config?.inferenceConfig ?? this.inferenceConfig,
            isActive: true,
            isPromptStartSent: false,
            isAudioContentStartSent: false,
            audioContentId: (0, node_crypto_1.randomUUID)(),
        };
        this.activeSessions.set(sessionId, session);
        return new StreamSession(sessionId, this);
    }
    // Stream audio for a specific session
    async initiateSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Stream session ${sessionId} not found`);
        }
        try {
            // Set up initial events for this session
            this.setupSessionStartEvent(sessionId);
            // Create the bidirectional stream with session-specific async iterator
            const asyncIterable = this.createSessionAsyncIterable(sessionId);
            console.log(`Starting bidirectional stream for session ${sessionId}...`);
            const response = await this.bedrockRuntimeClient.send(new client_bedrock_runtime_1.InvokeModelWithBidirectionalStreamCommand({
                modelId: "amazon.nova-sonic-v1:0",
                body: asyncIterable,
            }));
            console.log(`Stream established for session ${sessionId}, processing responses...`);
            // Process responses for this session
            await this.processResponseStream(sessionId, response);
        }
        catch (error) {
            console.error(`Error in session ${sessionId}:`, error);
            this.dispatchEventForSession(sessionId, 'error', {
                source: 'bidirectionalStream',
                error
            });
            // Make sure to clean up if there's an error
            if (session.isActive) {
                this.closeSession(sessionId);
            }
        }
    }
    // Dispatch events to handlers for a specific session
    dispatchEventForSession(sessionId, eventType, data) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return;
        const handler = session.responseHandlers.get(eventType);
        if (handler) {
            try {
                handler(data);
            }
            catch (e) {
                console.error(`Error in ${eventType} handler for session ${sessionId}:`, e);
            }
        }
        // Also dispatch to "any" handlers
        const anyHandler = session.responseHandlers.get('any');
        if (anyHandler) {
            try {
                anyHandler({ type: eventType, data });
            }
            catch (e) {
                console.error(`Error in 'any' handler for session ${sessionId}:`, e);
            }
        }
    }
    createSessionAsyncIterable(sessionId) {
        if (!this.isSessionActive(sessionId)) {
            console.log(`Cannot create async iterable: Session ${sessionId} not active`);
            return {
                [Symbol.asyncIterator]: () => ({
                    next: async () => ({ value: undefined, done: true })
                })
            };
        }
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Cannot create async iterable: Session ${sessionId} not found`);
        }
        let eventCount = 0;
        return {
            [Symbol.asyncIterator]: () => {
                console.log(`AsyncIterable iterator requested for session ${sessionId}`);
                return {
                    next: async () => {
                        try {
                            // Check if session is still active
                            if (!session.isActive || !this.activeSessions.has(sessionId)) {
                                console.log(`Iterator closing for session ${sessionId}, done=true`);
                                return { value: undefined, done: true };
                            }
                            // Wait for items in the queue or close signal
                            if (session.queue.length === 0) {
                                try {
                                    await Promise.race([
                                        (0, rxjs_2.firstValueFrom)(session.queueSignal.pipe((0, operators_1.take)(1))),
                                        (0, rxjs_2.firstValueFrom)(session.closeSignal.pipe((0, operators_1.take)(1))).then(() => {
                                            throw new Error("Stream closed");
                                        })
                                    ]);
                                }
                                catch (error) {
                                    if (error instanceof Error) {
                                        if (error.message === "Stream closed" || !session.isActive) {
                                            // This is an expected condition when closing the session
                                            if (this.activeSessions.has(sessionId)) {
                                                console.log(`Session \${sessionId} closed during wait`);
                                            }
                                            return { value: undefined, done: true };
                                        }
                                    }
                                    else {
                                        console.error(`Error on event close`, error);
                                    }
                                }
                            }
                            // If queue is still empty or session is inactive, we're done
                            if (session.queue.length === 0 || !session.isActive) {
                                console.log(`Queue empty or session inactive: ${sessionId}`);
                                return { value: undefined, done: true };
                            }
                            // Get next item from the session's queue
                            const nextEvent = session.queue.shift();
                            eventCount++;
                            //console.log(`Sending event #${eventCount} for session ${sessionId}: ${JSON.stringify(nextEvent).substring(0, 100)}...`);
                            return {
                                value: {
                                    chunk: {
                                        bytes: new TextEncoder().encode(JSON.stringify(nextEvent))
                                    }
                                },
                                done: false
                            };
                        }
                        catch (error) {
                            console.error(`Error in session ${sessionId} iterator:`, error);
                            session.isActive = false;
                            return { value: undefined, done: true };
                        }
                    },
                    return: async () => {
                        console.log(`Iterator return() called for session ${sessionId}`);
                        session.isActive = false;
                        return { value: undefined, done: true };
                    },
                    throw: async (error) => {
                        console.log(`Iterator throw() called for session ${sessionId} with error:`, error);
                        session.isActive = false;
                        throw error;
                    }
                };
            }
        };
    }
    // Process the response stream from AWS Bedrock
    async processResponseStream(sessionId, response) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return;
        try {
            for await (const event of response.body) {
                if (!session.isActive) {
                    console.log(`Session ${sessionId} is no longer active, stopping response processing`);
                    break;
                }
                if (event.chunk?.bytes) {
                    try {
                        this.updateSessionActivity(sessionId);
                        const textResponse = new TextDecoder().decode(event.chunk.bytes);
                        try {
                            const jsonResponse = JSON.parse(textResponse);
                            if (jsonResponse.event?.contentStart) {
                                this.dispatchEvent(sessionId, 'contentStart', jsonResponse.event.contentStart);
                            }
                            else if (jsonResponse.event?.textOutput) {
                                this.dispatchEvent(sessionId, 'textOutput', jsonResponse.event.textOutput);
                            }
                            else if (jsonResponse.event?.audioOutput) {
                                this.dispatchEvent(sessionId, 'audioOutput', jsonResponse.event.audioOutput);
                            }
                            else if (jsonResponse.event?.toolUse) {
                                this.dispatchEvent(sessionId, 'toolUse', jsonResponse.event.toolUse);
                                // Store tool use information for later
                                session.toolUseContent = jsonResponse.event.toolUse;
                                session.toolUseId = jsonResponse.event.toolUse.toolUseId;
                                session.toolName = jsonResponse.event.toolUse.toolName;
                            }
                            else if (jsonResponse.event?.contentEnd &&
                                jsonResponse.event?.contentEnd?.type === 'TOOL') {
                                // Process tool use
                                console.log(`Processing tool use for session ${sessionId}`);
                                this.dispatchEvent(sessionId, 'toolEnd', {
                                    toolUseContent: session.toolUseContent,
                                    toolUseId: session.toolUseId,
                                    toolName: session.toolName
                                });
                                console.log("calling tooluse");
                                // Call external model
                                //const externalModelResult = await this.processToolUse(session.toolName, session.toolUseContent);
                                const externalModelResult = await (0, mock_tools_1.toolProcessor)(session.toolName.toLowerCase(), session.toolUseContent.content);
                                // Send tool result
                                this.sendToolResult(sessionId, session.toolUseId, externalModelResult);
                                // Also dispatch event about tool result
                                this.dispatchEvent(sessionId, 'toolResult', {
                                    toolUseId: session.toolUseId,
                                    result: externalModelResult
                                });
                            }
                            else {
                                // Handle other events
                                const eventKeys = Object.keys(jsonResponse.event || {});
                                console.log(`Event keys for session ${sessionId}:`, eventKeys);
                                console.log(`Handling other events`);
                                if (eventKeys.length > 0) {
                                    this.dispatchEvent(sessionId, eventKeys[0], jsonResponse.event[eventKeys[0]]);
                                }
                                else if (Object.keys(jsonResponse).length > 0) {
                                    this.dispatchEvent(sessionId, 'unknown', jsonResponse);
                                }
                            }
                        }
                        catch (e) {
                            console.log(`Raw text response for session ${sessionId} (parse error):`, textResponse);
                        }
                    }
                    catch (e) {
                        console.error(`Error processing response chunk for session ${sessionId}:`, e);
                    }
                }
                else if (event.modelStreamErrorException) {
                    console.error(`Model stream error for session ${sessionId}:`, event.modelStreamErrorException);
                    this.dispatchEvent(sessionId, 'error', {
                        type: 'modelStreamErrorException',
                        details: event.modelStreamErrorException
                    });
                }
                else if (event.internalServerException) {
                    console.error(`Internal server error for session ${sessionId}:`, event.internalServerException);
                    this.dispatchEvent(sessionId, 'error', {
                        type: 'internalServerException',
                        details: event.internalServerException
                    });
                }
            }
            console.log(`Response stream processing complete for session ${sessionId}`);
            this.dispatchEvent(sessionId, 'streamComplete', {
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error(`Error processing response stream for session ${sessionId}:`, error);
            this.dispatchEvent(sessionId, 'error', {
                source: 'responseStream',
                message: 'Error processing response stream',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    }
    // Add an event to a session's queue
    addEventToSessionQueue(sessionId, event) {
        const session = this.activeSessions.get(sessionId);
        if (!session || !session.isActive)
            return;
        this.updateSessionActivity(sessionId);
        session.queue.push(event);
        session.queueSignal.next();
    }
    // Set up initial events for a session
    setupSessionStartEvent(sessionId) {
        console.log(`Setting up initial events for session ${sessionId}...`);
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return;
        // Session start event
        this.addEventToSessionQueue(sessionId, {
            event: {
                sessionStart: {
                    inferenceConfiguration: session.inferenceConfig
                }
            }
        });
    }
    setupPromptStartEvent(sessionId) {
        console.log(`Setting up prompt start event for session ${sessionId}...`);
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return;
        // Prompt start event
        this.addEventToSessionQueue(sessionId, {
            event: {
                promptStart: {
                    promptName: session.promptName,
                    textOutputConfiguration: {
                        mediaType: "text/plain",
                    },
                    audioOutputConfiguration: this.getAudioOutputConfiguration(),
                    toolUseOutputConfiguration: {
                        mediaType: "application/json",
                    },
                    toolConfiguration: {
                        tools: mock_tools_1.availableTools
                    },
                },
            }
        });
        session.isPromptStartSent = true;
    }
    setupSystemPromptEvent(sessionId, textConfig = consts_1.DefaultTextConfiguration, systemPromptContent = consts_1.DefaultSystemPrompt) {
        console.log(`Setting up systemPrompt events for session ${sessionId}...`);
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return;
        // Text content start
        const textPromptID = (0, node_crypto_1.randomUUID)();
        this.addEventToSessionQueue(sessionId, {
            event: {
                contentStart: {
                    promptName: session.promptName,
                    contentName: textPromptID,
                    type: "TEXT",
                    interactive: true,
                    textInputConfiguration: textConfig,
                },
            }
        });
        // Text input content
        this.addEventToSessionQueue(sessionId, {
            event: {
                textInput: {
                    promptName: session.promptName,
                    contentName: textPromptID,
                    content: systemPromptContent,
                    role: "SYSTEM",
                },
            }
        });
        // Text content end
        this.addEventToSessionQueue(sessionId, {
            event: {
                contentEnd: {
                    promptName: session.promptName,
                    contentName: textPromptID,
                },
            }
        });
    }
    setupStartAudioEvent(sessionId, audioConfig = consts_1.DefaultAudioInputConfiguration) {
        console.log(`Setting up startAudioContent event for session ${sessionId}...`);
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return;
        console.log(`Using audio content ID: ${session.audioContentId}`);
        // Audio content start
        this.addEventToSessionQueue(sessionId, {
            event: {
                contentStart: {
                    promptName: session.promptName,
                    contentName: session.audioContentId,
                    type: "AUDIO",
                    interactive: true,
                    audioInputConfiguration: audioConfig,
                },
            }
        });
        session.isAudioContentStartSent = true;
        console.log(`Initial events setup complete for session ${sessionId}`);
    }
    // Stream an audio chunk for a session
    async streamAudioChunk(sessionId, audioData) {
        const session = this.activeSessions.get(sessionId);
        if (!session || !session.isActive || !session.audioContentId) {
            throw new Error(`Invalid session ${sessionId} for audio streaming`);
        }
        // Convert audio to base64
        const base64Data = audioData.toString('base64');
        this.addEventToSessionQueue(sessionId, {
            event: {
                audioInput: {
                    promptName: session.promptName,
                    contentName: session.audioContentId,
                    content: base64Data,
                    role: "USER",
                },
            }
        });
    }
    // Send tool result back to the model
    async sendToolResult(sessionId, toolUseId, result) {
        const session = this.activeSessions.get(sessionId);
        console.log("inside tool result");
        if (!session || !session.isActive)
            return;
        console.log(`Sending tool result for session ${sessionId}, tool use ID: ${toolUseId}`);
        const contentId = (0, node_crypto_1.randomUUID)();
        // Tool content start
        this.addEventToSessionQueue(sessionId, {
            event: {
                contentStart: {
                    promptName: session.promptName,
                    contentName: contentId,
                    interactive: false,
                    type: "TOOL",
                    toolResultInputConfiguration: {
                        toolUseId: toolUseId,
                        type: "TEXT",
                        textInputConfiguration: {
                            mediaType: "text/plain"
                        }
                    }
                }
            }
        });
        // Tool content input
        const resultContent = typeof result === 'string' ? result : JSON.stringify(result);
        this.addEventToSessionQueue(sessionId, {
            event: {
                toolResult: {
                    promptName: session.promptName,
                    contentName: contentId,
                    content: resultContent,
                    role: "TOOL"
                }
            }
        });
        // Tool content end
        this.addEventToSessionQueue(sessionId, {
            event: {
                contentEnd: {
                    promptName: session.promptName,
                    contentName: contentId
                }
            }
        });
        console.log(`Tool result sent for session ${sessionId}`);
    }
    async sendContentEnd(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session || !session.isAudioContentStartSent)
            return;
        await this.addEventToSessionQueue(sessionId, {
            event: {
                contentEnd: {
                    promptName: session.promptName,
                    contentName: session.audioContentId,
                }
            }
        });
        // Wait to ensure it's processed
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    async sendPromptEnd(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session || !session.isPromptStartSent)
            return;
        await this.addEventToSessionQueue(sessionId, {
            event: {
                promptEnd: {
                    promptName: session.promptName
                }
            }
        });
        // Wait to ensure it's processed
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    async sendSessionEnd(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return;
        await this.addEventToSessionQueue(sessionId, {
            event: {
                sessionEnd: {}
            }
        });
        // Wait to ensure it's processed
        await new Promise(resolve => setTimeout(resolve, 300));
        // Now it's safe to clean up
        session.isActive = false;
        session.closeSignal.next();
        session.closeSignal.complete();
        this.activeSessions.delete(sessionId);
        this.sessionLastActivity.delete(sessionId);
        console.log(`Session ${sessionId} closed and removed from active sessions`);
    }
    // Register an event handler for a session
    registerEventHandler(sessionId, eventType, handler) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        session.responseHandlers.set(eventType, handler);
    }
    // Dispatch an event to registered handlers
    dispatchEvent(sessionId, eventType, data) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return;
        const handler = session.responseHandlers.get(eventType);
        if (handler) {
            try {
                handler(data);
            }
            catch (e) {
                console.error(`Error in ${eventType} handler for session ${sessionId}:`, e);
            }
        }
        // Also dispatch to "any" handlers
        const anyHandler = session.responseHandlers.get('any');
        if (anyHandler) {
            try {
                anyHandler({ type: eventType, data });
            }
            catch (e) {
                console.error(`Error in 'any' handler for session ${sessionId}:`, e);
            }
        }
    }
    async closeSession(sessionId) {
        if (this.sessionCleanupInProgress.has(sessionId)) {
            console.log(`Cleanup already in progress for session ${sessionId}, skipping`);
            return;
        }
        this.sessionCleanupInProgress.add(sessionId);
        try {
            console.log(`Starting close process for session ${sessionId}`);
            await this.sendContentEnd(sessionId);
            await this.sendPromptEnd(sessionId);
            await this.sendSessionEnd(sessionId);
            console.log(`Session ${sessionId} cleanup complete`);
        }
        catch (error) {
            console.error(`Error during closing sequence for session ${sessionId}:`, error);
            // Ensure cleanup happens even if there's an error
            const session = this.activeSessions.get(sessionId);
            if (session) {
                session.isActive = false;
                this.activeSessions.delete(sessionId);
                this.sessionLastActivity.delete(sessionId);
            }
        }
        finally {
            // Always clean up the tracking set
            this.sessionCleanupInProgress.delete(sessionId);
        }
    }
    // Same for forceCloseSession:
    forceCloseSession(sessionId) {
        if (this.sessionCleanupInProgress.has(sessionId) || !this.activeSessions.has(sessionId)) {
            console.log(`Session ${sessionId} already being cleaned up or not active`);
            return;
        }
        this.sessionCleanupInProgress.add(sessionId);
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session)
                return;
            console.log(`Force closing session ${sessionId}`);
            // Immediately mark as inactive and clean up resources
            session.isActive = false;
            session.closeSignal.next();
            session.closeSignal.complete();
            this.activeSessions.delete(sessionId);
            this.sessionLastActivity.delete(sessionId);
            console.log(`Session ${sessionId} force closed`);
        }
        finally {
            this.sessionCleanupInProgress.delete(sessionId);
        }
    }
}
exports.S2SBidirectionalStreamClient = S2SBidirectionalStreamClient;
//# sourceMappingURL=nova-client.js.map