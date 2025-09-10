// FIX: Create type definitions for the application.
export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

export enum Sender {
  System = 'System',
  Tom = 'Tom', // Optimist
  Mark = 'Mark', // Skeptic
  Sam = 'Sam', // Pragmatist
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
}

export interface Settings {
  contextTurns: number;
  charLimit: number;
  speechVolume: number;
  speechRate: number;
  autoPlay: boolean;
  debateRounds: number;
  tomVoice: string;
  markVoice: string;
  samVoice: string;
}

export type TurnStatus = 'pending_text' | 'text_ready' | 'pending_audio' | 'audio_ready' | 'playing' | 'done';

export interface Turn {
  id: string;
  sender: Sender;
  text: string | null;
  audioSrc: string | null;
  status: TurnStatus;
}
