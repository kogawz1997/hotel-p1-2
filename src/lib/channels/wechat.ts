import type { ChannelAdapter } from './types';

// WeChat Official Account adapter
// SETUP REQUIRED:
// 1. Register WeChat Official Account at mp.weixin.qq.com (need Chinese business)
// 2. Get App ID and App Secret
// 3. Configure server URL for webhook
//
// Documentation: https://developers.weixin.qq.com/doc/offiaccount/en/

export const wechatAdapter: ChannelAdapter = {
  channel: 'wechat',

  async sendMessage(opts) {
    // TODO: Implement after WeChat Official Account approved
    // const accessToken = await getWeChatAccessToken();
    // const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
    // ...
    console.warn('[WeChat] Not configured. Setup required.');
    return { messageId: `wechat-stub-${Date.now()}`, status: 'pending_setup' };
  },

  async parseWebhook() {
    return [];
  },

  verifyWebhook() {
    return true;
  },
};
