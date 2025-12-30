/**
 * Base email template
 *
 * Provides common HTML structure and styling for all Zumik emails.
 * Follows the dark theme matching the app UI (Spotify-inspired).
 */

/**
 * Zumik branding colors
 */
export const colors = {
  background: "#121212",
  card: "#282828",
  primary: "#1DB954", // Spotify green
  textPrimary: "#ffffff",
  textSecondary: "#B3B3B3",
  border: "#404040",
} as const;

/**
 * Common CSS styles for all email templates
 */
export const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    background: ${colors.background};
    color: ${colors.textPrimary};
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  .logo {
    text-align: center;
    margin-bottom: 30px;
  }
  .logo h1 {
    color: ${colors.primary};
    font-size: 32px;
    margin: 0;
  }
  .content {
    background: ${colors.card};
    border-radius: 12px;
    padding: 40px;
    text-align: center;
  }
  .footer {
    text-align: center;
    color: ${colors.textSecondary};
    font-size: 12px;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid ${colors.border};
  }
  .footer p {
    margin: 5px 0;
  }
`;

/**
 * Render base HTML template with custom content
 *
 * @param content - HTML content to insert in the body
 * @param title - Email title/subject for metadata
 * @returns Complete HTML email
 */
export function renderBaseTemplate(content: string, title: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        ${baseStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>🎵 Zumik</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p><strong>Zumik</strong></p>
          <p>Collaborative Music Listening Platform</p>
        </div>
      </div>
    </body>
    </html>
  `.trim();
}

/**
 * Generate plain text footer for text-only emails
 */
export function renderTextFooter(): string {
  return `
---
Zumik - Collaborative Music Listening Platform
  `.trim();
}
