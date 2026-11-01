/* ============================================================
   AI VERSE SITE SETTINGS
   Your one AI Verse server (Cloudflare Worker) runs Ask AIV, Build AI, live AIs,
   the admin page, the free app AI and AIV API keys.
   ============================================================ */
window.AIV_SITE = {
  // Build AI, live AIs, the admin page, the apps and the API page
  server: 'https://ask-aiv.domhasaball.workers.dev',

  // Ask AIV (the same server)
  askAiv: 'https://ask-aiv.domhasaball.workers.dev',

  // Stripe payment link for buying an AI on the Build AI page ($150, one-time).
  // Leave empty to send buyers to the Business order form instead.
  aiCheckout: 'https://buy.stripe.com/test_8x2dRaehH9DU5aJ9pu1Fe03',   // TEST mode link: replace with the live link when going live

  // The API address shown to customers (self-host kit and API examples).
  // Set it to 'https://api.aiverse.it.com' once that custom domain is added to the ask-aiv worker.
  apiPublic: ''
};
