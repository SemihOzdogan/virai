export type ChatMode = 'general' | 'interview' | 'jobApplication';

export type Conversation = {
  id: string;
  title: string;
  provider: 'gemini';
  updatedAt: Date | null;
  mode?: ChatMode;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sequence: number;
  createdAt: Date | null;
  status: 'complete' | 'failed';
  error?: string;
  provider?: 'gemini';
  attachment?: ChatAttachment;
};

export type ChatAttachment = {
  name: string;
  mimeType:
    | 'application/pdf'
    | 'text/plain'
    | 'image/jpeg'
    | 'image/png'
    | 'image/webp';
  size: number;
};
