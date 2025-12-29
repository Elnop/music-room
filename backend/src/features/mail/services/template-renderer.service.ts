import {
  EmailTemplate,
  TemplateName,
  TemplateData,
  TemplateRenderer,
} from "@/features/mail/mail.types.js";
import { renderVerificationEmail } from "@/features/mail/templates/verification-email.template.js";
import { AppError } from "@/shared/middleware/error-handler.js";

/**
 * Template renderer service
 *
 * Registry and orchestrator for email templates.
 * Provides type-safe template rendering with extensibility for future email types.
 */
export class TemplateRendererService {
  /**
   * Template registry mapping template names to renderer functions
   */
  private readonly templates: Map<
    TemplateName,
    TemplateRenderer<TemplateData>
  > = new Map([
    ["verification-email", renderVerificationEmail as TemplateRenderer<TemplateData>],
  ]);

  /**
   * Render an email template by name
   *
   * @param templateName - Name of the template to render
   * @param data - Data to pass to the template
   * @returns Rendered email template (subject, HTML, text)
   * @throws AppError if template not found
   */
  render(templateName: TemplateName, data: TemplateData): EmailTemplate {
    const renderer = this.templates.get(templateName);

    if (!renderer) {
      throw new AppError(
        500,
        `Email template '${templateName}' not found`,
        "TEMPLATE_NOT_FOUND",
      );
    }

    return renderer(data);
  }

  /**
   * Check if a template exists
   */
  hasTemplate(templateName: string): boolean {
    return this.templates.has(templateName as TemplateName);
  }

  /**
   * Get all available template names
   */
  getAvailableTemplates(): TemplateName[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Register a new template (for future extensibility)
   *
   * @param name - Template name
   * @param renderer - Template renderer function
   */
  registerTemplate<T extends TemplateData>(
    name: TemplateName,
    renderer: TemplateRenderer<T>,
  ): void {
    this.templates.set(name, renderer as TemplateRenderer<TemplateData>);
  }
}
