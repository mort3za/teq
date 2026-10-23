// Demo data for the store screenshots. Run it on an extension page:
//   agent-browser --session teq eval "$(cat store/tools/seed.js)"
// It replaces the rules, the collected list, the block log and the ignored list.
// All accounts are made up.
(() => {
  const now = Date.now();
  const min = 60_000;

  // [name, handle, reason, lang, tweet]
  const collected = [
    ["DeFi Yield 🌾", "defi_yield_farm", "defi", "en", "Earn 40% APY with our new DeFi pool. Link in bio."],
    ["Lambo Soon 🏎️", "lambo_soon_xyz", "free crypto", "en", "Free crypto for the first 100 people who reply 🏎️"],
    ["Signals VIP 💹", "vip_signals_247", "signal", "en", "Today's VIP signal: +38% in 2 hours. Join now."],
    ["ایردراپ روزانه", "airdrop_iran_1", "ایردراپ", "fa", "ایردراپ جدید امروز، فقط تا ساعت ۱۲ شب"],
    ["Meme Coin King 👑", "memecoin_king1", "dm me for", "en", "DM me for the next 1000x meme coin 👑"],
    ["Free Crypto Daily", "freecrypto_dly", "crypto", "en", "Daily free crypto drops. Turn on notifications!"],
    ["Hodl Gang 💎🙌", "hodl_gang_club", "💎", "en", "Diamond hands only 💎🙌"],
    ["Bitcoin Mentor ₿", "btc_mentor_pro", "dm me for", "en", "I turned $500 into $25k. DM me for my strategy."],
    ["Token Hunter", "token_hunter_88", "token", "en", "Found a new token before launch. Thread 🧵"],
    ["Pump Alerts 🚀", "pump_alerts_now", "🚀", "en", "Next pump starts in 10 minutes 🚀"],
    ["Elon Giveaway 2x", "giveaway_2x_btc", "giveaway", "en", "Send 0.1 BTC, get 0.2 BTC back. Giveaway ends today!"],
    ["Web3 Rewards 🪙", "w3_reward_hub", "free crypto", "en", "Claim your free crypto rewards now 🪙"],
    ["Daily Forex Profit", "fx_profit_guru", "forex", "en", "Forex signals with 95% win rate. Join free."],
    ["کریپتو سیگنال 🚀", "signal_fa_2024", "🚀", "fa", "سیگنال رایگان امروز 🚀 لینک کانال در بیو"],
    ["NFT Giveaway 🎁", "nft_drop_giver", "giveaway", "en", "Giveaway! Follow + RT + tag 3 friends to win a free NFT"],
    ["Moon Boy 🌕", "moonboy_9921", "🌕", "en", "To the moon 🌕🌕 this one is going 50x easy"],
    ["Crypto Signals 💎", "gem_signals_404", "💎", "en", "100x gem incoming 💎 Join my channel for early signals"],
    ["Free Airdrop 🚀🚀", "airdrop_daily_x7", "airdrop", "en", "🚀 FREE AIRDROP is live! Claim your tokens before midnight. DM me for the link 👇"],
  ].map(([name, handle, reason, lang, tweet]) => ({ name, handle, reason, lang, tweet }));

  // [name, handle, reason, minutes ago]; newest first, like the extension stores it
  const blocked = [
    ["Crypto Whale 🐳", "crypto_whale_77", "crypto", 3],
    ["Airdrop Hunter", "airdrop_hunter", "airdrop", 4],
    ["Forex King", "forexking_fx", "forex", 5],
    ["Gem Finder 💎", "gemfinder_100x", "💎", 6],
    ["Signal Room", "signal_room_vip", "signal", 7],
    ["Rocket Coin 🚀", "rocketcoin_io", "🚀", 8],
    ["Free Token Drop", "free_token_drop", "token", 9],
    ["Daily Giveaway 🎁", "daily_giveaway", "giveaway", 10],
    ["Moon Shot 🌕", "moonshot_alpha", "🌕", 52],
    ["DeFi Daddy", "defi_daddy_eth", "defi", 53],
    ["سیگنال طلایی", "golden_signal_ir", "signal", 54],
    ["Crypto Queen 👸", "cryptoqueen_x", "crypto", 55],
    ["Pump King", "pumpking_alerts", "dm me for", 56],
    ["Airdrop Daily 2", "airdrop_daily_2", "airdrop", 57],
    ["NFT Mint Now", "nft_mint_now", "free crypto", 58],
    ["Forex Signals Pro", "fx_signals_pro", "forex", 59],
  ].map(([name, handle, reason, ago]) => ({ name, handle, reason, at: now - ago * min }));

  // [name, handle, minutes ago]; oldest first, like the extension stores it
  const ignored = [
    ["Token Design Studio", "tokendesign", 600],
    ["Anna Signal", "anna_signal_dev", 240],
    ["Crypto Research Lab", "crl_research", 120],
  ].map(([name, handle, ago]) => ({ name, handle, at: now - ago * min }));

  return Promise.all([
    chrome.storage.sync.set({
      words: ["airdrop", "crypto", "giveaway", "forex", "signal", "defi", "token", "ایردراپ", "💎", "🚀", "🌕"],
      tweetWords: ["free crypto", "dm me for"],
      autoCollect: true,
      lang: "en",
    }),
    chrome.storage.local.remove(["blockProgress", "blockQueue", "lastError"]),
    chrome.storage.local.set({ collected, blockLog: blocked, ignored }),
  ]).then(() => "seeded");
})();
