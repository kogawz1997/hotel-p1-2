// Common interface for all communication channels (LINE, WhatsApp, WeChat, etc.)

export interface ChannelMessage {
  channelUserId: string;
  channelMessageId: string;
  text: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker';
  mediaUrl?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface SendMessageOptions {
  channelUserId: string;
  text: string;
  type?: 'text' | 'image' | 'template';
  mediaUrl?: string;
  templateName?: string;
  templateVariables?: Record<string, string>;
}

export interface ChannelAdapter {
  channel: string;
  sendMessage(opts: SendMessageOptions): Promise<{ messageId: string; status: string }>;
  parseWebhook(body: any, headers: Record<string, string>): Promise<ChannelMessage[]>;
  verifyWebhook(body: string, signature: string): boolean;
  getUserProfile?(userId: string): Promise<{ name?: string; avatarUrl?: string; language?: string }>;
}
