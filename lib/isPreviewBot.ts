/**
 * Detects if a request is from a link preview bot (iMessage, Slack, etc.)
 * These bots fetch pages to generate rich link previews but shouldn't count as real views.
 */
export function isPreviewBot(userAgent: string | null): boolean {
  if (!userAgent) return false;

  const botPatterns = [
    // Apple/iMessage link previews
    /Applebot/i,
    /AppleCoreMedia/i,

    // Facebook/Meta (used by iMessage, Facebook, Instagram, WhatsApp link previews)
    /facebookexternalhit/i,
    /Facebot/i,

    // Social media & messaging platforms
    /Slackbot/i,
    /Slack-ImgProxy/i,
    /TelegramBot/i,
    /WhatsApp/i,
    /Twitterbot/i,
    /LinkedInBot/i,
    /Discordbot/i,
    /Pinterestbot/i,
    /Snapchat/i,

    // Email clients that preview links
    /Outlook/i,
    /Thunderbird.*LinkPreview/i,
    /GoogleImageProxy/i,
    /YahooMailProxy/i,

    // Search engine crawlers
    /Googlebot/i,
    /bingbot/i,
    /Baiduspider/i,
    /YandexBot/i,
    /DuckDuckBot/i,

    // Generic bot/crawler patterns
    /bot\b/i,
    /crawler/i,
    /spider/i,
    /preview/i,
    /^curl\//i,
    /^wget\//i,
    /^python-requests/i,
    /^axios/i,
    /^node-fetch/i,
    /^Go-http-client/i,
    /HeadlessChrome/i,
    /PhantomJS/i,
    /Puppeteer/i,
    /Playwright/i,

    // SEO/monitoring tools
    /SemrushBot/i,
    /AhrefsBot/i,
    /MJ12bot/i,
    /DotBot/i,
    /PetalBot/i,
    /Screaming Frog/i,
    /UptimeRobot/i,
    /StatusCake/i,
    /Pingdom/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}
