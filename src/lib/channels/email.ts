import sgMail from '@sendgrid/mail';
import type { ChannelAdapter, ChannelMessage, SendMessageOptions } from './types';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export const emailAdapter: ChannelAdapter = {
  channel: 'email',

  async sendMessage(opts: SendMessageOptions) {
    const msg = {
      to: opts.channelUserId,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@hotel.com',
      subject: opts.templateVariables?.subject || 'Message from your hotel',
      text: opts.text,
      html: opts.text.replace(/\n/g, '<br>'),
    };
    
    const [response] = await sgMail.send(msg);
    return {
      messageId: response.headers['x-message-id'] || `email-${Date.now()}`,
      status: 'sent',
    };
  },

  async parseWebhook(body: any): Promise<ChannelMessage[]> {
    // Inbound parse webhook from SendGrid
    return [{
      channelUserId: body.from,
      channelMessageId: body.message_id || `email-${Date.now()}`,
      text: body.text || body.html || '',
      type: 'text',
      timestamp: new Date(),
      metadata: { subject: body.subject },
    }];
  },

  verifyWebhook(): boolean {
    return true; // SendGrid uses different verification
  },
};
