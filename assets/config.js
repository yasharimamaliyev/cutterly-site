/**
 * config.js — the one place for prices, the current version and links.
 *
 * No page repeats these values: the HTML only carries placeholders
 * (data-site="…") and site.js fills them in. Change a price or release a
 * version here and every page and language follows.
 *
 * Plans must match what the server sells (server/accounts.py PLANS) —
 * a customer who reads $29 here must be issued a $29 key.
 */
window.CUTTERLY = {
  // Shown next to the download button. The file is served from this site
  // (download/Cutterly.dmg), never from the code host: customers should not
  // land on the repository. A release replaces that file and bumps this.
  version: "1.0.13",
  downloadUrl: "https://cutterlyai.com/download/Cutterly.dmg",
  // Same idea, Windows installer: served from this site, never from the code host.
  windowsDownloadUrl: "https://cutterlyai.com/download/Cutterly-Setup.exe",

  supportEmail: "support@cutterlyai.com",

  // Website chat (assets/chat.js). Empty = the widget offers email instead of answers.
  // POST { lang, messages:[{role,text}] } → { reply }. 500 messages a day for the whole site.
  chatEndpoint: "https://api.cutterlyai.com/site-chat",
  // Telegram bot username (without @) for "Chat with support". Empty = email.
  telegramBot: "CutterlySupportBot",

  // Monthly price in US dollars and hours of analysed audio per month.
  plans: {
    personal: { name: "Personal", price: 29, hours: 20 },
    business: { name: "Business", price: 100, hours: 80 },
  },

  // Typical episode length used for the "≈ N episodes" line on the pricing cards.
  episodeMinutes: 45,
};
