export interface LineMessage {
  type: 'text' | 'image';
  text?: string;
  originalContentUrl?: string;
  previewImageUrl?: string;
}

export interface LineReplyRequest {
  replyToken: string;
  messages: LineMessage[];
}

export interface LinePushRequest {
  to: string;
  messages: LineMessage[];
}

export class LineBotClient {
  private channelAccessToken: string;
  private channelSecret: string;

  constructor(channelAccessToken: string, channelSecret: string) {
    this.channelAccessToken = channelAccessToken;
    this.channelSecret = channelSecret;
  }

  async replyMessage(replyToken: string, messages: LineMessage[]): Promise<void> {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.channelAccessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`LINE API error: ${response.status} ${response.statusText}`);
    }
  }

  async pushMessage(to: string, messages: LineMessage[]): Promise<void> {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.channelAccessToken}`,
      },
      body: JSON.stringify({
        to,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`LINE API error: ${response.status} ${response.statusText}`);
    }
  }
}
