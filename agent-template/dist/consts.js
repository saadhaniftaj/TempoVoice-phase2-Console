"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultAudioOutputConfiguration = exports.DefaultSystemPrompt = exports.DefaultTextConfiguration = exports.DefaultToolSchema = exports.DefaultAudioInputConfiguration = exports.DefaultInferenceConfiguration = void 0;
exports.DefaultInferenceConfiguration = {
    maxTokens: 1024,
    topP: 0.9,
    temperature: 0.7,
};
exports.DefaultAudioInputConfiguration = {
    audioType: "SPEECH",
    encoding: "base64",
    mediaType: "audio/lpcm",
    sampleRateHertz: 8000,
    sampleSizeBits: 16,
    channelCount: 1,
};
exports.DefaultToolSchema = JSON.stringify({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {},
    "required": []
});
exports.DefaultTextConfiguration = { mediaType: "text/plain" };
exports.DefaultSystemPrompt = "You are a friend. The user and you will engage in a spoken " +
    "dialog exchanging the transcripts of a natural real-time conversation. Keep your responses short, " +
    "generally two or three sentences for chatty scenarios.";
// Default to Tiffany (female voice) for better customer service experience
exports.DefaultAudioOutputConfiguration = {
    ...exports.DefaultAudioInputConfiguration,
    sampleRateHertz: 8000,
    voiceId: "tiffany", // Female voice for customer service
};
//# sourceMappingURL=consts.js.map