import type {
  IMailerService,
  SendEmailOptions,
} from "../interfaces/mailerService.js";
import { uuidv7 } from "../db/utils/uuidv7.js";

/**
 * Console Mailer for development and testing
 * Logs emails to terminal and retains sent emails in memory for test assertions
 */
export class ConsoleMailer implements IMailerService {
  private sentEmails: Array<SendEmailOptions & { id: string; sentAt: Date }> =
    [];

  public async send(options: SendEmailOptions): Promise<{ id: string }> {
    const id = uuidv7();
    const sentRecord = { ...options, id, sentAt: new Date() };
    this.sentEmails.push(sentRecord);

    if (process.env.NODE_ENV !== "test") {
      console.log(`\n📬 [DEV MAILER] ---------------------------------------------`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Text: ${options.text || "(no plain text)"}`);
      console.log(`------------------------------------------------------------\n`);
    }

    return { id };
  }

  public async sendVerificationEmail(
    to: string,
    token: string
  ): Promise<void> {
    const verifyUrl = `http://localhost:5173/web/verify?token=${token}`;
    await this.send({
      to,
      subject: "Verify your email address - LetsMarkNow",
      text: `Welcome to LetsMarkNow! Please verify your email: ${verifyUrl}`,
      html: `<h2>Welcome to LetsMarkNow</h2><p>Please verify your email address by clicking <a href="${verifyUrl}">here</a>.</p>`,
    });
  }

  public async sendPasswordResetEmail(
    to: string,
    token: string
  ): Promise<void> {
    const resetUrl = `http://localhost:5173/web/reset-password?token=${token}`;
    await this.send({
      to,
      subject: "Reset your password - LetsMarkNow",
      text: `Reset your password by visiting: ${resetUrl}`,
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your LetsMarkNow password.</p>`,
    });
  }

  public async sendOrgInviteEmail(
    to: string,
    orgName: string,
    inviteToken: string
  ): Promise<void> {
    const inviteUrl = `http://localhost:5173/web/invite/${inviteToken}`;
    await this.send({
      to,
      subject: `You've been invited to join ${orgName} on LetsMarkNow`,
      text: `You have been invited to collaborate in ${orgName}. Accept invite: ${inviteUrl}`,
      html: `<p>You've been invited to <strong>${orgName}</strong>. Click <a href="${inviteUrl}">here</a> to join.</p>`,
    });
  }

  public getSentEmails() {
    return [...this.sentEmails];
  }

  public clear(): void {
    this.sentEmails = [];
  }
}

export const consoleMailer = new ConsoleMailer();
