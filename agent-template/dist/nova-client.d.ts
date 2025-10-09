import { BedrockRuntimeClientConfig } from "@aws-sdk/client-bedrock-runtime";
import { NodeHttp2HandlerOptions } from "@smithy/node-http-handler";
import { Provider } from "@smithy/types";
import { Buffer } from "node:buffer";
import { InferenceConfig } from "./types";
import { DefaultAudioInputConfiguration, DefaultTextConfiguration } from "./consts";
export interface S2SBidirectionalStreamClientConfig {
    requestHandlerConfig?: NodeHttp2HandlerOptions | Provider<NodeHttp2HandlerOptions | void>;
    clientConfig: Partial<BedrockRuntimeClientConfig>;
    inferenceConfig?: InferenceConfig;
}
export declare class StreamSession {
    private sessionId;
    private client;
    private audioBufferQueue;
    private maxQueueSize;
    private isProcessingAudio;
    private isActive;
    streamSid: string;
    constructor(sessionId: string, client: S2SBidirectionalStreamClient);
    onEvent(eventType: string, handler: (data: any) => void): StreamSession;
    setupPromptStart(): Promise<void>;
    setupSystemPrompt(textConfig?: typeof DefaultTextConfiguration, systemPromptContent?: string): Promise<void>;
    setupStartAudio(audioConfig?: typeof DefaultAudioInputConfiguration): Promise<void>;
    streamAudio(audioData: Buffer): Promise<void>;
    private processAudioQueue;
    getSessionId(): string;
    endAudioContent(): Promise<void>;
    endPrompt(): Promise<void>;
    close(): Promise<void>;
}
export declare class S2SBidirectionalStreamClient {
    private bedrockRuntimeClient;
    private inferenceConfig;
    private activeSessions;
    private sessionLastActivity;
    private sessionCleanupInProgress;
    private voiceId;
    constructor(config: S2SBidirectionalStreamClientConfig);
    setVoiceId(voiceId: string): void;
    getVoiceId(): string;
    getAudioOutputConfiguration(): {
        voiceId: string;
        sampleRateHertz: number;
        audioType: InferenceConfig;
        encoding: string;
        mediaType: InferenceConfig;
        sampleSizeBits: number;
        channelCount: number;
    };
    isSessionActive(sessionId: string): boolean;
    getActiveSessions(): string[];
    getLastActivityTime(sessionId: string): number;
    private updateSessionActivity;
    isCleanupInProgress(sessionId: string): boolean;
    createStreamSession(sessionId?: string, config?: S2SBidirectionalStreamClientConfig): StreamSession;
    initiateSession(sessionId: string): Promise<void>;
    private dispatchEventForSession;
    private createSessionAsyncIterable;
    private processResponseStream;
    private addEventToSessionQueue;
    private setupSessionStartEvent;
    setupPromptStartEvent(sessionId: string): void;
    setupSystemPromptEvent(sessionId: string, textConfig?: typeof DefaultTextConfiguration, systemPromptContent?: string): void;
    setupStartAudioEvent(sessionId: string, audioConfig?: typeof DefaultAudioInputConfiguration): void;
    streamAudioChunk(sessionId: string, audioData: Buffer): Promise<void>;
    private sendToolResult;
    sendContentEnd(sessionId: string): Promise<void>;
    sendPromptEnd(sessionId: string): Promise<void>;
    sendSessionEnd(sessionId: string): Promise<void>;
    registerEventHandler(sessionId: string, eventType: string, handler: (data: any) => void): void;
    private dispatchEvent;
    closeSession(sessionId: string): Promise<void>;
    forceCloseSession(sessionId: string): void;
}
//# sourceMappingURL=nova-client.d.ts.map