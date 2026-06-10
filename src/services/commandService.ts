export function processCommand(command: string): {
  action: string;
  url?: string;
  isBrowserAction: boolean;
} {
  const lowerCmd = command.toLowerCase().trim();

  // Unified apps mapping with bilingual, sassy replies tailored for PC & Mobile
  const apps = [
    {
      name: "whatsapp",
      keys: ["whatsapp", "whats app", " wa ", "wa.me"],
      hindiKeys: ["whatsapp chalao", "whatsapp kholo", "wa kholo", "whatsapp open"],
      webUrl: "https://api.whatsapp.com/send",
      sassy: "Opening WhatsApp! Go ahead, reply to that risky text. 💬 WhatsApp khol rahi hoon, unhein jaldi aur achha reply karna!"
    },
    {
      name: "youtube",
      keys: ["youtube", "yt", "videos", "video"],
      hindiKeys: ["youtube kholo", "youtube chalao", "yt chalao", "youtube open"],
      webUrl: "https://www.youtube.com",
      sassy: "Opening YouTube. Try not to get lost in a 3-hour rabbit hole, okay? 📺 Dhyan se scroll karna, clickbait mein mat phas jana!"
    },
    {
      name: "spotify",
      keys: ["spotify", "music", "gaana", "sangeet", "song", "play list"],
      hindiKeys: ["spotify kholo", "spotify chalao", "gaana chalao", "sangeet sunao", "spotify open"],
      webUrl: "https://open.spotify.com",
      sassy: "Opening Spotify. Hope your playlist isn't as chaotic as your work-life balance. 🎵 Sangeet suno aur dimag shaant karo!"
    },
    {
      name: "instagram",
      keys: ["instagram", "insta", " ig "],
      hindiKeys: ["instagram kholo", "insta chalao", "ig kholo", "instagram open"],
      webUrl: "https://www.instagram.com",
      sassy: "Opening Instagram! Time to scroll endlessly and compare your raw life with curated highlights. 📸 Reels par bematlab ka timepass shuru!"
    },
    {
      name: "twitter",
      keys: ["twitter", " x.com", " tweet", " x kholo", " x chalao"],
      hindiKeys: ["twitter kholo", "twitter chalao", " x open"],
      webUrl: "https://x.com",
      sassy: "Opening Twitter... I mean, X! Ready for some spicy online drama and hot takes? 🐦 Thoda trending gossip padh lo!"
    },
    {
      name: "facebook",
      keys: ["facebook", " fb "],
      hindiKeys: ["facebook kholo", "fb chalao", "facebook open"],
      webUrl: "https://www.facebook.com",
      sassy: "Opening Facebook. Ready to see what your long-lost relatives are complaining about today? 👥 Status check kar lo!"
    },
    {
      name: "gmail",
      keys: ["gmail", "mail", "email", "inbox"],
      hindiKeys: ["mail kholo", "gmail chalao", "email check", "gmail open"],
      webUrl: "https://mail.google.com",
      sassy: "Opening Gmail. Ah, look at all those un-archived newsletters you'll never open... 📧 Kaam ki baat kam, promotional spam zyada milega!"
    },
    {
      name: "maps",
      keys: ["maps", "map", "location", "google maps", "rasta", "navigation"],
      hindiKeys: ["maps kholo", "location dikhao", "rasta batao", "google maps chalao", "maps open"],
      webUrl: "https://www.google.com/maps",
      sassy: "Opening Google Maps. Let's help you find your way, since you clearly get lost in your own thoughts. 🗺️ Bhatakti aatmaon ko naya raah dikhana zaroori hai!"
    },
    {
      name: "netflix",
      keys: ["netflix", "movie", "film"],
      hindiKeys: ["netflix kholo", "netflix chalao", "movie chalao", "netflix open"],
      webUrl: "https://www.netflix.com",
      sassy: "Opening Netflix! Let me guess, 'just one more episode' and you will sleep at 4 AM? 🍿 Picture chala di hai, enjoy!"
    },
    {
      name: "telegram",
      keys: ["telegram", " tg "],
      hindiKeys: ["telegram kholo", "telegram chalao", "telegram open"],
      webUrl: "https://web.telegram.org",
      sassy: "Opening Telegram. Hope it's for something productive and not just trading weird crypto memes! ✈️ Chats khol rahi hoon."
    },
    {
      name: "discord",
      keys: ["discord"],
      hindiKeys: ["discord kholo", "discord chalao", "discord open"],
      webUrl: "https://discord.com",
      sassy: "Opening Discord. Go hang out with your gaming friends. No toxicity allowed, Boss! 👾 Voice lobby join karo!"
    },
    {
      name: "linkedin",
      keys: ["linkedin", " naukri ", "job"],
      hindiKeys: ["linkedin kholo", "linkedin chalao", "linkedin open"],
      webUrl: "https://www.linkedin.com",
      sassy: "Opening LinkedIn. Prepare yourself for professional humblebrags and deep corporate poetry! 💼 Thoda networking badhao, boss."
    },
    {
      name: "snapchat",
      keys: ["snapchat", "snap"],
      hindiKeys: ["snapchat kholo", "snapchat chalao", "snap bhejo", "snapchat open"],
      webUrl: "https://www.snapchat.com",
      sassy: "Opening Snapchat. Send that streak before you lose it, standard procedure! 🤳 Filter laga kar photo kheencho!"
    },
    {
      name: "reddit",
      keys: ["reddit"],
      hindiKeys: ["reddit kholo", "reddit chalao", "reddit open"],
      webUrl: "https://www.reddit.com",
      sassy: "Opening Reddit. Welcome to the discussion forum of the universe. Don't believe everything you read! 🦁"
    },
    {
      name: "tiktok",
      keys: ["tiktok"],
      hindiKeys: ["tiktok kholo", "tiktok chalao", "tiktok open"],
      webUrl: "https://www.tiktok.com",
      sassy: "Opening TikTok... Keep scrolling, let's see what's trending. 🕺"
    },
    {
      name: "github",
      keys: ["github", "git", "repo"],
      hindiKeys: ["github kholo", "github chalao", "git kholo", "github open"],
      webUrl: "https://github.com",
      sassy: "Opening GitHub. Let's see how many bugs and merge conflicts you've committed today! 💻 Commit-ready ho jao!"
    },
    {
      name: "chatgpt",
      keys: ["chatgpt", "openai", "gpt", "ai help"],
      hindiKeys: ["chatgpt kholo", "gpt kholo", "chatgpt open"],
      webUrl: "https://chatgpt.com",
      sassy: "Opening ChatGPT. Oh, asking another AI for help? Don't worry, I won't tell anyone you're cheating! 🤖 Unse sawal pooch lo ab."
    },
    {
      name: "drive",
      keys: ["drive", "gdrive", "google drive"],
      hindiKeys: ["drive kholo", "google drive chalao", "drive open"],
      webUrl: "https://drive.google.com",
      sassy: "Opening Google Drive. Hope you can find that one file named Document_Final_Final_v3.pdf! 💾 Files loading..."
    },
    {
      name: "calendar",
      keys: ["calendar", "cal", "schedule", "meeting", "tarikh"],
      hindiKeys: ["calendar kholo", "meeting dekho", "tarikh batao", "calendar open"],
      webUrl: "https://calendar.google.com",
      sassy: "Opening Google Calendar. Let me witness your empty schedule or those meetings you wish were emails! 📅 Schedule check karlo."
    },
    {
      name: "slack",
      keys: ["slack", "office chat"],
      hindiKeys: ["slack kholo", "slack chalao", "slack open"],
      webUrl: "https://slack.com",
      sassy: "Opening Slack. Keep it cool, and remember to make those status indicators green! 💬 Office ping-pong shuru."
    },
    {
      name: "zoom",
      keys: ["zoom", "webinar"],
      hindiKeys: ["zoom kholo", "zoom chalao", "zoom open"],
      webUrl: "https://zoom.us",
      sassy: "Opening Zoom. Remember to double-check if your mic and camera are off when you cough! 🎥 Meeting launched."
    },
    {
      name: "chrome",
      keys: ["chrome", "browser", "internet", "google search"],
      hindiKeys: ["chrome kholo", "browser chalao", "google kholo", "chrome open"],
      webUrl: "https://www.google.com",
      sassy: "Opening Chrome. Time to browse the vast, beautiful, chaotic ocean of human knowledge! 🌐"
    },
    {
      name: "amazon",
      keys: ["amazon", "shopping", "dukaan", "buy stuff"],
      hindiKeys: ["amazon kholo", "shopping karo", "amazon chalao", "amazon open"],
      webUrl: "https://www.amazon.in",
      sassy: "Opening Amazon. Please don't add more useless, expensive gadgets to your cart... 🛒 Shopping mode on!"
    },
    {
      name: "flipkart",
      keys: ["flipkart"],
      hindiKeys: ["flipkart kholo", "flipkart chalao", "flipkart open"],
      webUrl: "https://www.flipkart.com",
      sassy: "Opening Flipkart! Let's scroll through discounts and deals. Web shopping chala rahi hoon. 🛍️"
    },
    {
      name: "playstore",
      keys: ["play store", "playstore"],
      hindiKeys: ["playstore kholo", "app store kholo", "play store open"],
      webUrl: "https://play.google.com",
      sassy: "Opening Google Play Store. Time to download app icons you'll click once and forget! 📱"
    },
    {
      name: "appstore",
      keys: ["app store", "appstore"],
      hindiKeys: ["app store kholo", "apple app store", "app store open"],
      webUrl: "https://apps.apple.com",
      sassy: "Opening Apple App Store. Let's find some premium, glossy iOS apps. 🍏"
    },
    {
      name: "calculator",
      keys: ["calculator", "calc", "hisab"],
      hindiKeys: ["calculator kholo", "calc kholo", "hisab lagao", "calculator open"],
      webUrl: "https://www.google.com/search?q=calculator",
      sassy: "Opening online calculator. Yes, let's solve those basic calculations... I won't judge your weak mental math! 🧮 Hisab kitab shuru."
    },
    {
      name: "weather",
      keys: ["weather", "mausam", "temp"],
      hindiKeys: ["weather kholo", "mausam dekho", "temp chalao", "weather open"],
      webUrl: "https://www.google.com/search?q=weather+forecast",
      sassy: "Opening Weather forecast. Let's check if the skies are as bright and clear as your brilliant future! 🌤️ Mausam ki khabar lo!"
    }
  ];

  // Specific Actions: Play [song] on YouTube
  const ytMatch = lowerCmd.match(/^play\s+(.+?)\s+on\s+youtube$/) || lowerCmd.match(/^youtube\s+par\s+(.+?)\s+(?:kholo|chalao|play\s+karo)$/);
  if (ytMatch) {
    const query = encodeURIComponent(ytMatch[1].trim());
    return {
      action: `Playing ${ytMatch[1]} on YouTube for you, Investors. Don't judge my algorithm recommendation! 📺`,
      url: `https://www.youtube.com/results?search_query=${query}`,
      isBrowserAction: true
    };
  }

  // Specific Actions: Search [query] on Spotify
  const spotifyMatch = lowerCmd.match(/^search\s+(.+?)\s+on\s+spotify$/) || lowerCmd.match(/^spotify\s+par\s+(.+?)\s+(?:kholo|chalao|dhundo|search\s+karo)$/);
  if (spotifyMatch) {
    const query = encodeURIComponent(spotifyMatch[1].trim());
    return {
      action: `Searching '${spotifyMatch[1]}' on Spotify. Hope it's an absolute banger! 🎵`,
      url: `https://open.spotify.com/search/${query}`,
      isBrowserAction: true
    };
  }

  // Specific Actions: Send a WhatsApp message to [number] saying [message]
  const waMatch = lowerCmd.match(
    /^send\s+a\s+whatsapp\s+message\s+to\s+([\d\+\s]+)\s+saying\s+(.+)$/
  );
  if (waMatch) {
    const number = waMatch[1].replace(/\s+/g, "");
    const message = encodeURIComponent(waMatch[2].trim());
    return {
      action: `Sending your WhatsApp message to ${waMatch[1]}. Let's hope they reply! 💬`,
      url: `https://api.whatsapp.com/send?phone=${number}&text=${message}`,
      isBrowserAction: true
    };
  }

  // Universal Call Matcher: "call [number]" or "[number] ko call lagao"
  const dialMatch = lowerCmd.match(/^(?:call|dial|phone|contact)\s+([\d\+\s\-]+)$/) ||
                    lowerCmd.match(/^([\d\+\s\-]+)\s*(?:ko call karo|par phone milao|phone karo)$/);
  if (dialMatch) {
    const phone = dialMatch[1].replace(/\s+/g, "");
    return {
      action: `Opening dialer with number ${dialMatch[1]}! 📱 Ex ko galti se phone mat laga dena!`,
      url: `tel:${phone}`,
      isBrowserAction: true
    };
  }

  // General Matching iteration for all mapped apps
  for (const app of apps) {
    const exactNameMatch = lowerCmd === app.name || lowerCmd === `${app.name} app`;
    const matchedKey = exactNameMatch || 
                       app.keys.some(k => lowerCmd === k || lowerCmd.includes(`open ${k}`) || lowerCmd.includes(`${k} kholo`) || lowerCmd.includes(`${k} chalao`) || lowerCmd.includes(`${k} open`)) ||
                       app.hindiKeys.some(hk => lowerCmd.includes(hk));
    
    if (matchedKey) {
      return {
        action: app.sassy,
        url: app.webUrl,
        isBrowserAction: true
      };
    }
  }

  // general website matcher "open [something].[domain]"
  const openMatch = lowerCmd.match(/^open\s+(.+)$/) || lowerCmd.match(/^(.+?)\s+(?:kholo|chalao|open\s+karo)$/);
  if (openMatch) {
    let website = openMatch[1].trim().replace(/\s+/g, "");
    if (!website.includes(".")) {
      website += ".com";
    }
    return {
      action: `Opening ${openMatch[1]} in a new tab! 🌐 Custom link loaded.`,
      url: `https://www.${website}`,
      isBrowserAction: true
    };
  }

  return { action: "", isBrowserAction: false };
}

