/**
 * Notification adapter interface
 *
 * Abstraction for sending notifications (email, SMS, push, etc.)
 */

export interface NotificationRecipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  pushToken?: string;
}

export interface NotificationPayload {
  subject: string;
  body: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Notification adapter interface
 */
export interface INotificationAdapter {
  /**
   * Send email notification
   */
  sendEmail(
    recipient: NotificationRecipient,
    payload: NotificationPayload
  ): Promise<NotificationResult>;

  /**
   * Send SMS notification
   */
  sendSMS(
    recipient: NotificationRecipient,
    payload: NotificationPayload
  ): Promise<NotificationResult>;

  /**
   * Send push notification
   */
  sendPush(
    recipient: NotificationRecipient,
    payload: NotificationPayload
  ): Promise<NotificationResult>;

  /**
   * Send to all available channels
   */
  sendMultiChannel(
    recipient: NotificationRecipient,
    payload: NotificationPayload,
    channels: ('email' | 'sms' | 'push')[]
  ): Promise<NotificationResult[]>;
}

/**
 * Console notification adapter (for development/testing)
 */
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async sendEmail(
    recipient: NotificationRecipient,
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    console.log(`[EMAIL] To: ${recipient.email || recipient.name}`);
    console.log(`        Subject: ${payload.subject}`);
    console.log(`        Body: ${payload.body}`);
    return { success: true, messageId: `email-${Date.now()}` };
  }

  async sendSMS(
    recipient: NotificationRecipient,
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    console.log(`[SMS] To: ${recipient.phone || recipient.name}`);
    console.log(`      Message: ${payload.body}`);
    return { success: true, messageId: `sms-${Date.now()}` };
  }

  async sendPush(
    recipient: NotificationRecipient,
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    console.log(`[PUSH] To: ${recipient.name}`);
    console.log(`       Title: ${payload.subject}`);
    console.log(`       Body: ${payload.body}`);
    return { success: true, messageId: `push-${Date.now()}` };
  }

  async sendMultiChannel(
    recipient: NotificationRecipient,
    payload: NotificationPayload,
    channels: ('email' | 'sms' | 'push')[]
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          results.push(await this.sendEmail(recipient, payload));
          break;
        case 'sms':
          results.push(await this.sendSMS(recipient, payload));
          break;
        case 'push':
          results.push(await this.sendPush(recipient, payload));
          break;
      }
    }

    return results;
  }
}

/**
 * No-op notification adapter (disables notifications)
 */
export class NoOpNotificationAdapter implements INotificationAdapter {
  async sendEmail(): Promise<NotificationResult> {
    return { success: true };
  }

  async sendSMS(): Promise<NotificationResult> {
    return { success: true };
  }

  async sendPush(): Promise<NotificationResult> {
    return { success: true };
  }

  async sendMultiChannel(): Promise<NotificationResult[]> {
    return [];
  }
}
