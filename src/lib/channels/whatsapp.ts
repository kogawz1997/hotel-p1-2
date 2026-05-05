import axios from 'axios';
import crypto from 'crypto';
import type { ChannelAdapter, ChannelMessage, SendMessageOptions } from './types';

const WHATSAPP_API_VERSION = 'v21.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';

export const whatsappAdapter: ChannelAdapter = {
  channel: 'whatsapp',

  async sendMessage(opts: SendMessageOptions) {
    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

    let payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: opts.channelUserId,
    };

    if (opts.type === 'template' && opts.templateName) {
      payload.type = 'template';
      payload.template = {
        name: opts.templateName,
        language: { code: 'en_US' },
        components: opts.templateVariables ? [{
          type: 'body',
          parameters: Object.values(opts.templateVariables).map(v => ({ type: 'text', text: v })),
        }] : [],
      };
    } else if (opts.type === 'image' && opts.mediaUrl) {
      payload.type = 'image';
      payload.image = { link: opts.mediaUrl, caption: opts.text };
    } else {
      payload.type = 'text';
      payload.text = { body: opts.text };
    }

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      messageId: response.data.messages?.[0]?.id || `wa-${Date.now()}`,
      status: 'sent',
    };
  },

  async parseWebhook(body: any): Promise<ChannelMessage[]> {
    const messages: ChannelMessage[] = [];

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        const value = change.value;

        for (const msg of value.messages || []) {
          let text = '';
          let type: ChannelMessage['type'] = 'text';
          let mediaUrl: string | undefined;

          if (msg.type === 'text') text = msg.text.body;
          else if (msg.type === 'image') {
            text = msg.image.caption || '[image]';
            type = 'image';
            mediaUrl = msg.image.id;
          } else if (msg.type === 'audio') {
            text = '[voice message]';
            type = 'audio';
            mediaUrl = msg.audio.id;
          } else if (msg.type === 'location') {
            text = `[location: ${msg.location.latitude}, ${msg.location.longitude}]`;
            type = 'location';
          } else {
            text = `[${msg.type}]`;
          }

          messages.push({
            channelUserId: msg.from,
            channelMessageId: msg.id,
            text,
            type,
            mediaUrl,
            timestamp: new Date(parseInt(msg.timestamp) * 1000),
            metadata: { contactName: value.contacts?.[0]?.profile?.name },
          });
        }
      }
    }

    return messages;
  },

  verifyWebhook(body: string, signature: string): boolean {
    if (!APP_SECRET) return true; // skip in dev
    const expected = 'sha256=' + crypto
      .createHmac('sha256', APP_SECRET)
      .update(body)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  },
};

export function verifyWebhookChallenge(mode: string, token: string): boolean {
  return mode === 'subscribe' && token === VERIFY_TOKEN;
}
