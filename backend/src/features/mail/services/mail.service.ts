import nodemailer from "nodemailer";
import { gmailConfig, senderConfig } from "@/features/mail/mail.config.js";
import { EmailOptions, TemplateName, TemplateData } from "@/features/mail/mail.types.js";
import { TemplateRendererService } from "./template-renderer.service.js";
import { formatSenderAddress } from "@/features/mail/utils/mail.helpers.js";
import { logger } from "@/shared/utils/logger.js";
import { AppError } from "@/shared/middleware/error-handler.js";

/**
 * Mail service
 *
 * Main service for sending emails via Gmail SMTP.
 * Supports template-based emails with HTML and plain text versions.
 */
export class MailService {
  private transporter: nodemailer.Transporter;
  private templateRenderer: TemplateRendererService;

  constructor() {
    // Create Gmail SMTP transporter
    this.transporter = nodemailer.createTransport(gmailConfig);
    this.templateRenderer = new TemplateRendererService();
  }

  /**
   * Send email using a template
   *
   * @param to - Recipient email address
   * @param templateName - Name of the email template
   * @param data - Data to pass to the template
   * @throws AppError if sending fails
   */
  async sendTemplatedEmail(
    to: string,
    templateName: TemplateName,
    data: TemplateData,
  ): Promise<void> {
    try {
      // Render template
      const template = this.templateRenderer.render(templateName, data);

      // Send email
      await this.sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info("Templated email sent successfully", {
        to,
        templateName,
      });
    } catch (error) {
      logger.error("Failed to send templated email", {
        to,
        templateName,
        error,
      });
      throw error;
    }
  }

  /**
   * Send email with custom content (raw HTML/text)
   *
   * @param options - Email options (to, subject, HTML, text)
   * @throws AppError if sending fails
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const { to, subject, html, text } = options;

      await this.transporter.sendMail({
        from: formatSenderAddress(senderConfig.name, senderConfig.email),
        to,
        subject,
        html,
        text,
      });

      logger.info("Email sent successfully", {
        to,
        subject,
      });
    } catch (error) {
      logger.error("Failed to send email", {
        to: options.to,
        subject: options.subject,
        error,
      });
      throw new AppError(
        500,
        "Failed to send email. Please try again later.",
        "EMAIL_SEND_ERROR",
      );
    }
  }

  /**
   * Verify Gmail SMTP connection (health check)
   *
   * @returns True if connection successful, false otherwise
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info("Gmail SMTP connection verified successfully");
      return true;
    } catch (error) {
      logger.error("Gmail SMTP connection failed", { error });
      return false;
    }
  }

  /**
   * Get list of available templates
   */
  getAvailableTemplates(): TemplateName[] {
    return this.templateRenderer.getAvailableTemplates();
  }
}
