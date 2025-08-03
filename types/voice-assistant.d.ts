// Web Speech API の型定義
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechSynthesis extends EventTarget {
  speak(utterance: SpeechSynthesisUtterance): void
  cancel(): void
  pause(): void
  resume(): void
  getVoices(): SpeechSynthesisVoice[]
}

interface SpeechSynthesisUtterance extends EventTarget {
  text: string
  lang: string
  voice: SpeechSynthesisVoice | null
  volume: number
  rate: number
  pitch: number
  onstart: ((this: SpeechSynthesisUtterance, ev: Event) => any) | null
  onend: ((this: SpeechSynthesisUtterance, ev: Event) => any) | null
  onerror: ((this: SpeechSynthesisUtterance, ev: Event) => any) | null
}

interface SpeechSynthesisVoice {
  voiceURI: string
  name: string
  lang: string
  localService: boolean
  default: boolean
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

declare var SpeechSynthesis: {
  prototype: SpeechSynthesis
  new(): SpeechSynthesis
}

declare var SpeechSynthesisUtterance: {
  prototype: SpeechSynthesisUtterance
  new(text?: string): SpeechSynthesisUtterance
}

interface Window {
  SpeechRecognition: typeof SpeechRecognition
  webkitSpeechRecognition: typeof webkitSpeechRecognition
  SpeechSynthesis: typeof SpeechSynthesis
  SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance
  speechSynthesis: SpeechSynthesis
} 

// MiniMax API型定義
interface MiniMaxVoiceResponse {
  audio: string; // base64 encoded audio data
  usage: {
    total_tokens: number;
  };
}

interface MiniMaxVoiceRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  stream: boolean;
  voice_id: string;
  voice_type: string;
} 