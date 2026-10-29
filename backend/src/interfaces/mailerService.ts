/**
 * Abstract Mailer Service Port
 * Spec: 02-spec/21-app/22-infrastructure/11-email-provider.md
 */
export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export interface IMailerService {
  /**
   * Send a general transactional email
   */
  send(options: SendEmailOptions): Promise<{ id: string }>;

  /**
   * Send email verification link
   */
  sendVerificationEmail(to: string, token: string): Promise<void>;

  /**
   * Send password reset link
   */
  sendPasswordResetEmail(to: string, token: string): Promise<void>;

  /**
   * Send organization member invitation
   */
  sendOrgInviteEmail(
    to: string,
    orgName: string,
    inviteToken: string
  ): Promise<void>;
}
