import { VoiceConfig } from './types';
export declare const AVAILABLE_VOICES: VoiceConfig[];
export declare class VoiceConfigService {
    private currentVoiceId;
    constructor(voiceId?: string);
    setVoice(voiceId: string): boolean;
    getCurrentVoice(): VoiceConfig | undefined;
    getCurrentVoiceId(): string;
    getAllVoices(): VoiceConfig[];
    getVoicesByLanguage(language: string): VoiceConfig[];
    getVoicesByGender(gender: 'male' | 'female'): VoiceConfig[];
    getVoiceById(voiceId: string): VoiceConfig | undefined;
    validateVoiceId(voiceId: string): boolean;
    getNovaVoiceConfig(voiceId?: string): any;
}
//# sourceMappingURL=voice-config.d.ts.map