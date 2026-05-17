export interface Language {
  code: string
  label: string
  flag: string
}

export const LANGUAGES: Language[] = [
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'hi-IN', label: 'Hindi', flag: '🇮🇳' },
  { code: 'en-IN', label: 'Hinglish 🔥', flag: '🇮🇳' },
  { code: 'fr-FR', label: 'French', flag: '🇫🇷' },
  { code: 'de-DE', label: 'German', flag: '🇩🇪' },
  { code: 'es-ES', label: 'Spanish', flag: '🇪🇸' },
  { code: 'it-IT', label: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru-RU', label: 'Russian', flag: '🇷🇺' },
  { code: 'ja-JP', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', label: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'ar-SA', label: 'Arabic', flag: '🇸🇦' },
  { code: 'bn-BD', label: 'Bengali', flag: '🇧🇩' },
  { code: 'ta-IN', label: 'Tamil', flag: '🇮🇳' },
  { code: 'te-IN', label: 'Telugu', flag: '🇮🇳' },

]