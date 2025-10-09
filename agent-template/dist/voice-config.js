"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceConfigService = exports.AVAILABLE_VOICES = void 0;
// 🎙️ Voice Configuration Service
exports.AVAILABLE_VOICES = [
    {
        id: 'tiffany',
        name: 'Tiffany',
        gender: 'female',
        language: 'English',
        locale: 'en-US',
        description: 'Feminine-sounding voice, warm and professional'
    },
    {
        id: 'matthew',
        name: 'Matthew',
        gender: 'male',
        language: 'English',
        locale: 'en-US',
        description: 'Masculine-sounding voice, clear and authoritative'
    },
    {
        id: 'amy',
        name: 'Amy',
        gender: 'female',
        language: 'English',
        locale: 'en-GB',
        description: 'British feminine voice, elegant and sophisticated'
    },
    {
        id: 'ambre',
        name: 'Ambre',
        gender: 'female',
        language: 'French',
        locale: 'fr-FR',
        description: 'French feminine voice, melodic and expressive'
    },
    {
        id: 'florian',
        name: 'Florian',
        gender: 'male',
        language: 'French',
        locale: 'fr-FR',
        description: 'French masculine voice, smooth and engaging'
    },
    {
        id: 'beatrice',
        name: 'Beatrice',
        gender: 'female',
        language: 'Italian',
        locale: 'it-IT',
        description: 'Italian feminine voice, passionate and lively'
    },
    {
        id: 'lorenzo',
        name: 'Lorenzo',
        gender: 'male',
        language: 'Italian',
        locale: 'it-IT',
        description: 'Italian masculine voice, charismatic and expressive'
    },
    {
        id: 'greta',
        name: 'Greta',
        gender: 'female',
        language: 'German',
        locale: 'de-DE',
        description: 'German feminine voice, clear and professional'
    },
    {
        id: 'lennart',
        name: 'Lennart',
        gender: 'male',
        language: 'German',
        locale: 'de-DE',
        description: 'German masculine voice, strong and reliable'
    },
    {
        id: 'lupe',
        name: 'Lupe',
        gender: 'female',
        language: 'Spanish',
        locale: 'es-ES',
        description: 'Spanish feminine voice, warm and inviting'
    },
    {
        id: 'carlos',
        name: 'Carlos',
        gender: 'male',
        language: 'Spanish',
        locale: 'es-ES',
        description: 'Spanish masculine voice, confident and friendly'
    }
];
class VoiceConfigService {
    constructor(voiceId = 'tiffany') {
        this.currentVoiceId = voiceId;
    }
    setVoice(voiceId) {
        const voice = exports.AVAILABLE_VOICES.find(v => v.id === voiceId);
        if (voice) {
            this.currentVoiceId = voiceId;
            return true;
        }
        return false;
    }
    getCurrentVoice() {
        return exports.AVAILABLE_VOICES.find(v => v.id === this.currentVoiceId);
    }
    getCurrentVoiceId() {
        return this.currentVoiceId;
    }
    getAllVoices() {
        return exports.AVAILABLE_VOICES;
    }
    getVoicesByLanguage(language) {
        return exports.AVAILABLE_VOICES.filter(v => v.language.toLowerCase() === language.toLowerCase());
    }
    getVoicesByGender(gender) {
        return exports.AVAILABLE_VOICES.filter(v => v.gender === gender);
    }
    getVoiceById(voiceId) {
        return exports.AVAILABLE_VOICES.find(v => v.id === voiceId);
    }
    validateVoiceId(voiceId) {
        return exports.AVAILABLE_VOICES.some(v => v.id === voiceId);
    }
    // Get voice configuration for Nova Sonic
    getNovaVoiceConfig(voiceId) {
        const voice = voiceId ? this.getVoiceById(voiceId) : this.getCurrentVoice();
        if (!voice) {
            throw new Error(`Voice not found: ${voiceId || this.currentVoiceId}`);
        }
        return {
            voice_id: voice.id,
            voice_name: voice.name,
            language: voice.language,
            locale: voice.locale,
            gender: voice.gender,
            description: voice.description
        };
    }
}
exports.VoiceConfigService = VoiceConfigService;
//# sourceMappingURL=voice-config.js.map