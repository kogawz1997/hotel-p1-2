import { lineAdapter } from './line';
import { whatsappAdapter } from './whatsapp';
import { emailAdapter } from './email';
import { wechatAdapter } from './wechat';
import type { ChannelAdapter } from './types';

export const channels: Record<string, ChannelAdapter> = {
  line: lineAdapter,
  whatsapp: whatsappAdapter,
  email: emailAdapter,
  wechat: wechatAdapter,
  // TODO: messenger, instagram, kakao, sms - same pattern
};

export function getChannel(name: string): ChannelAdapter {
  const adapter = channels[name];
  if (!adapter) throw new Error(`Channel not supported: ${name}`);
  return adapter;
}

export * from './types';
