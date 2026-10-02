export type Conversation = {
  id: string;
  title: string;
  provider: 'gemini';
  updatedAt: Date | null;
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
};
