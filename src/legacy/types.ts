export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface CaptionData {
  words: WordTiming[];
}

export interface Topic {
  label: string;
  icon: string; // Path to image file
  seconds: number;
  captions?: CaptionData;
}

export interface VideoData {
  title: string;
  topics: Topic[];
  voiceover?: string; // Path to audio file
  thumbnail?: string; // Path to thumbnail image
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}






