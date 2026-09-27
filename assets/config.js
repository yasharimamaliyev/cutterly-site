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
  // Shown next to the download button. The file itself always comes from
  // the latest GitHub release, so this is the only thing a release changes here.
  version: "1.0.6",
  downloadUrl: "https://github.com/yasharimamaliyev/cutterly-site/releases/latest/download/Cutterly.dmg",
  releasesUrl: "https://github.com/yasharimamaliyev/cutterly-site/releases",

  supportEmail: "support@cutterlyai.com",

  // Monthly price in US dollars and hours of analysed audio per month.
  plans: {
    personal: { name: "Personal", price: 29, hours: 20 },
    business: { name: "Business", price: 100, hours: 80 },
  },

  // Typical episode length used for the "≈ N episodes" line on the pricing cards.
  episodeMinutes: 45,
};
