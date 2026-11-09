/* ============================================================
   AI VERSE SITE SETTINGS
   Your one AI Verse server (Cloudflare Worker) runs Ask AIV, AI Business, live AIs,
   the admin page, the free app AI and AIV API keys.
   ============================================================ */
window.AIV_SITE = {
  // AI Business, live AIs, the admin page, the apps and the API page
  server: 'https://api.aiverse.it.com',

  // Ask AIV (the same server)
  askAiv: 'https://api.aiverse.it.com',

  // Stripe payment link for buying an AI on the AI Business page ($150, one-time).
  // Leave empty to send buyers to the Business order form instead.
  aiCheckout: 'https://buy.stripe.com/test_8x2dRaehH9DU5aJ9pu1Fe03',   // TEST mode link: replace with the live link when going live

  // Stripe payment link for AIV-X ($50/month). TEST mode link: replace with the live link when going live.
  aivxCheckout: 'https://buy.stripe.com/test_00w3cwddD03kcDb9pu1Fe04',

  // The API address shown to customers (self-host kit and API examples).
  // api.aiverse.it.com is the custom domain on the ask-aiv worker.
  apiPublic: 'https://api.aiverse.it.com',

  // Connections in the AI apps (the plug button). Every link, import and export works without these.
  // Sign-ins turn on when you paste a free developer ID here. These IDs are public, so they are safe in this file.
  // Never put a client SECRET here: secrets go on the Cloudflare worker.
  // Redirect address to register with each service: https://aiverse.it.com/oauth-callback.html
  connect: {
    spotifyClientId: '',   // developer.spotify.com/dashboard → Create app → Client ID   (AI Music)
    googleClientId: '',    // console.cloud.google.com → Credentials → OAuth client ID (Web) (Tasks, Docs, Sheets, Drive)
    stravaClientId: '',    // strava.com/settings/api → Client ID. Secret goes on the worker as STRAVA_CLIENT_SECRET (AI Health and Fitness)
    dropboxAppKey: '',     // dropbox.com/developers/apps → App key (AI Photo)
    appleMusic: false      // true after adding APPLE_TEAM_ID, APPLE_MUSIC_KEY_ID and APPLE_MUSIC_PRIVATE_KEY to the worker (AI Music)
  }
};
