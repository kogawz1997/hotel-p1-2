import { Client, validateSignature } from '@line/bot-sdk';
import type { ChannelAdapter, ChannelMessage, SendMessageOptions } from './types';

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const client = new Client(lineConfig);

export const lineAdapter: ChannelAdapter = {
  channel: 'line',

  async sendMessage(opts: SendMessageOptions) {
    const message = opts.type === 'image' && opts.mediaUrl
      ? { type: 'image' as const, originalContentUrl: opts.mediaUrl, previewImageUrl: opts.mediaUrl }
      : { type: 'text' as const, text: opts.text };

    await client.pushMessage(opts.channelUserId, message);
    return { messageId: `line-${Date.now()}`, status: 'sent' };
  },

  async parseWebhook(body: any): Promise<ChannelMessage[]> {
    if (!body.events) return [];

    const messages: ChannelMessage[] = [];
    for (const event of body.events) {
      if (event.type !== 'message') continue;

      const msg = event.message;
      messages.push({
        channelUserId: event.source.userId,
        channelMessageId: msg.id,
        text: msg.type === 'text' ? msg.text : `[${msg.type}]`,
        type: msg.type === 'text' ? 'text' : msg.type,
        mediaUrl: msg.type === 'image' || msg.type === 'video' ? `line:${msg.id}` : undefined,
        timestamp: new Date(event.timestamp),
        metadata: { replyToken: event.replyToken },
      });
    }
    return messages;
  },

  verifyWebhook(body: string, signature: string): boolean {
    return validateSignature(body, lineConfig.channelSecret, signature);
  },

  async getUserProfile(userId: string) {
    try {
      const profile = await client.getProfile(userId);
      return {
        name: profile.displayName,
        avatarUrl: profile.pictureUrl,
        language: profile.language,
      };
    } catch {
      return {};
    }
  },
};
