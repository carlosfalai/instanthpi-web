const TIMELINE_DATA = [
  {
    date: "2026-03-30",
    summary: "South America expansion — 38 organizations contacted across 10 countries (Brazil, Colombia, Peru, Ecuador, Bolivia, Venezuela, Argentina, Chile, Uruguay, Paraguay). Wave 5 hit hospital associations, medical colleges, health ministries, telemedicine orgs, and NGOs. Plus Wave 6: Africa CDC, ACHAP, IAKMI Indonesia, IntraHealth, Medicus Mundi, ACHEST Uganda. Total orgs contacted: 92+. Total emails sent: 126+.",
    entries: [
      {
        project: "InstantHPI — Wave 5: South America Expansion (38 orgs, 10 countries)",
        folder: "instanthpi-site/",
        category: "business",
        status: "completed",
        action: "Researched and emailed 38 organizations across all 10 South American countries. Brazil: CREMERJ, CRM-MG, FBH (4,500 hospitals), ANAHP, Hospital Albert Einstein (#1 in Latin America), HC-FMUSP, CONASS, CONASEMS (5,570 municipal secretaries), SBIS, ABTMS. Colombia: Colegio Médico, ACSC, ACHC (300+ hospitals), Santa Fe, LaCardio, Ministerio de Salud. Peru: Colegio Médico, MINSA Hospital Digital, ACP, PAHO Peru. Ecuador: Colegio Médico Pichincha, ACHPE (83 hospitals), PAHO Ecuador. Bolivia: Colegio Médico, PROSALUD, PAHO Bolivia, Ministry of Health/Telesalud (340+ rural points). Venezuela: Médicos Venezolanos Online (diaspora telemedicine), IMC (3.7M reached), Médicos del Mundo, PAHO Venezuela. Argentina: AMA (50K physicians), ADECRA+CEDIM (420+ clinics), UBA Medicine. Chile: UC Chile, CIMT U. de Chile. Uruguay: SMU, ASSE (1.5M users), AGESIC (Salud.uy). Paraguay: Círculo de Médicos, FCM-UNA, MSPyBS DGTIC. All emails customized per org in Portuguese (Brazil) or Spanish.",
        url: "https://instanthpi.com/story.html"
      },
      {
        project: "InstantHPI — Wave 6: Africa + SE Asia + Global Networks (6 orgs)",
        folder: "instanthpi-site/",
        category: "business",
        status: "completed",
        action: "Emailed 6 organizations: Africa CDC (55 member states), ACHAP (Sub-Saharan faith-based clinic networks), IAKMI Indonesia (17,000 islands, 270M people), IntraHealth International (30+ countries, CHW programs), Medicus Mundi International (19-member global network), ACHEST Uganda (health policy + research).",
        url: "https://instanthpi.com/story.html"
      },
      {
        project: "InstantHPI — Follow-up Waves 1-3 (Day 5 reminders)",
        folder: "instanthpi-site/",
        category: "business",
        status: "completed",
        action: "Sent Day 5 follow-up reminders to all Wave 1 (18 orgs), Wave 2+3 (14 orgs) non-responders. Also sent partnership follow-ups to J-PAL (3), IDRC (2), NFRF (1), McGill (1), UOttawa (1). Total follow-ups: 32+.",
        url: "https://instanthpi.com/story.html"
      }
    ]
  },
  {
    date: "2026-03-28",
    summary: "Pro page rebuilt for physicians — workflow automation pitch with 7 sample PDFs, clinic branding preview, privacy-by-design section. Live impact dashboard wired to real bot data (18 consultations, 9 completed, 6 users). Mega dropdown nav (Fiverr-style) added to all pages. 10 AI-in-medicine video campaign launched for LinkedIn/Twitter/Instagram/TikTok. Grants pipeline active (15+ programs). Total orgs contacted: 34.",
    entries: [
      {
        project: "InstantHPI Pro — Physician Workflow Page",
        folder: "instanthpi-site/",
        category: "frontend",
        status: "launched",
        action: "Complete rewrite of instanthpi.com/pro from signup wizard to physician-focused product page. Sections: 4-step workflow (Patient→Bot→AI Docs→Doctor Reviews), 7 document types with downloadable sample PDFs, clinic branding customization (logo, physician name, license number, digital signature, patient ID added manually), privacy-by-design (no patient data stored, HIPAA-ready), time savings comparison (45 min→2 min per patient), demo CTA.",
        url: "https://instanthpi.com/pro"
      },
      {
        project: "InstantHPI — Live Impact Dashboard",
        folder: "instanthpi-site/",
        category: "frontend",
        status: "launched",
        action: "Wired instanthpi.com/impact to real bot analytics via nginx proxy on EC2 → Netlify _redirects. Removed all fake fallback data (14,728 was made up). Now shows real numbers: 18 consultations, 9 completed, 50% completion rate, 6 users, 3 countries. Added conversion funnel visualization (Started→Language→Intake→Follow-up→Report). Languages section now dynamic from API. Auto-refreshes every 60 seconds.",
        url: "https://instanthpi.com/impact"
      },
      {
        project: "InstantHPI — Mega Dropdown Navigation",
        folder: "instanthpi-site/",
        category: "frontend",
        status: "launched",
        action: "Built Fiverr-style mega dropdown nav for instanthpi.com. Three dropdown menus: Medical AI (bot, how it works, AI vs doctors, impact, pro), Projects (medical, language bots, spiritual, dev tools), About (story, journey, timeline, inevitable future, partner). Each item has colored icon badge + title + description. Mobile hamburger menu with organized sections. Replaces flat nav where sub-pages were hidden.",
        url: "https://instanthpi.com"
      },
      {
        project: "InstantHPI — Sample PDF Documents",
        folder: "instanthpi-site/",
        category: "content",
        status: "launched",
        action: "Generated 7 sample PDFs using pdfkit matching the bot's actual output format. Case: 28-year-old female with migraine with aura. Documents: Case Summary, SOAP Note, Referral, Prescription, Imaging Requisition, Lab Orders, Work Leave Certificate. Each has InstantHPI header, educational disclaimer, and footer. Added download links to both medical-sequence.html and pro.html.",
        url: "https://instanthpi.com/medical-sequence"
      },
      {
        project: "InstantHPI — Grants & Competitions Pipeline",
        folder: "instanthpi-site/",
        category: "business",
        status: "in-progress",
        action: "Launched systematic grants pipeline targeting 15+ programs across April-June 2026. Urgent: EVAH (Gates/Wellcome/Novo Nordisk, Apr 1, $1-3M for AI in health evidence), Google.org AI for Government (Apr 3, $1-3M). Also targeting: CHISEL Healthcare InnoMatch (Apr 13, S$500K), Falling Walls Science (Apr 15), Google.org AI for Science (Apr 17, $500K-3M), Gates Grand Challenges (Apr 28, $750K), Kraft Prize (Apr 30), MIT Solve 10th Anniversary (May 21, $100K-150K), TechCrunch Battlefield 200 (May 27, $100K), IDRC Canada (Jun 9, CAD $125-250K). Rolling programs: NVIDIA Inception (10K inference credits), AWS Activate ($100K cloud credits), Microsoft AI for Health, Meta Llama Impact Grants ($500K). Competitions: Harvard HSIL Hackathon (Apr 10-11), AI for Good (ITU/Geneva), Seedstars World ($500K equity).",
        url: "https://instanthpi.com/partner.html"
      },
      {
        project: "InstantHPI — Wave 3 Global Outreach (Medical Associations & Universities)",
        folder: "instanthpi-site/",
        category: "business",
        status: "completed",
        action: "Emailed 10 organizations — Wave 3 targets medical associations and global health research institutions. Nigerian Medical Association, Kenya Medical Association, Indian Medical Association, Bangladesh Medical Association, the provincial medical board (French), Canadian Medical Association, Direct Relief, Reach Digital Health (Praekelt Foundation, South Africa), LSHTM London School of Hygiene & Tropical Medicine, Johns Hopkins Bloomberg School of Public Health. Total orgs contacted across all waves: 34. Follow-up due March 31 for Wave 1 non-responders.",
        url: "https://instanthpi.com/story.html"
      },
      {
        project: "InstantHPI — Public Support & Advocacy Page",
        folder: "instanthpi-site/",
        category: "frontend",
        status: "launched",
        action: "Added support section to instanthpi.com showing how the public can help accelerate free AI healthcare access: 1) Share the Telegram bot link (t.me/instanthpibot) with communities in underserved areas, 2) Contact local representatives and health ministries to advocate for AI-assisted healthcare adoption, 3) Sign and share petitions for AI healthcare access in countries with extreme physician shortages, 4) Support on social media — amplify the message that $0.003/consult AI is available NOW while governments debate, 5) Volunteer for translation — help bring the bot to more languages. Message: 'Governments move slowly. People don't have to.'",
        url: "https://instanthpi.com/partner.html#support"
      },
      {
        project: "Glittering Prizes — Warcraft 2 Moissanite Store",
        folder: "moissanite-store/",
        category: "ecommerce",
        status: "in-progress",
        action: "Built complete Shopify store themed as a Warcraft 2 orc village marketplace. 21 AI-generated 4K images (Nano Banana Pro), full interactive theme with Peon click quotes ('Me not that kind of orc!'), goblin toast notifications, Diablo-style rarity system, cheat console entry. 17-product catalog from 6 confirmed dropship suppliers. Contacted 14 Alibaba moissanite suppliers — 8 confirmed dropshipping. MUSHAN and YOYO YU are top partners (full catalogs received, blind shipping confirmed). Each product has a tragic Alliance backstory narrated by a clueless Peon.",
        url: "https://glitteringprizes.shop"
      }
    ]
  },
  {
    date: "2026-03-26",
    summary: "Massive outreach day — CV sent to 8 AI healthcare companies (Doctronic, OpenEvidence, Nabla, Suki, Heidi, Felix, Freed, Sully). Personal pitch to Doctronic CEO. Telegram bot card added to instanthpi.com. 20 Remotion videos posted across LinkedIn/Twitter/Instagram/TikTok in 7 languages featuring doctor shortage stats from 6 countries.",
    entries: [
      {
        project: "InstantHPI — AI Healthcare Job Outreach",
        folder: "Desktop/",
        category: "business",
        status: "completed",
        action: "Sent updated CV (with AI skills) to 8 companies building AI for physician practice automation: Doctronic ($40M raised, first AI legally authorized to practice medicine), OpenEvidence (40% of US physicians), Nabla ($70M raised), Suki, Heidi Health (190 countries), Felix Health (async prescriptions), Freed AI, Sully AI (YC-backed). Personal pitch to Doctronic CEO Matt Pavelle highlighting t.me/instanthpibot as proof of capability.",
        url: "https://doctronic.ai"
      },
      {
        project: "InstantHPI — Telegram Bot Page",
        folder: "instanthpi-site/",
        category: "frontend",
        status: "launched",
        action: "Added dedicated Telegram Bot card to instanthpi.com Medical section. Full-width featured card with Telegram logo, FREE/TELEGRAM/AI DOCTOR badges, stats grid (24/7, 90% automated, Claude, Free), and direct link to t.me/instanthpibot. Deployed to Netlify.",
        url: "https://instanthpi.com/#medical"
      },
      {
        project: "InstantHPI — Country Shortage Video Series",
        folder: "instanthpi-videos/src/compositions/",
        category: "marketing",
        status: "launched",
        action: "Created CountryShortage.tsx Remotion composition — 6 videos highlighting countries with impossible physician ratios: South Sudan (1:65,000), Tanzania (1:50,000), Niger (1:45,000), Somalia (1:45,000), Malawi (1:40,000), Haiti (1:8,000). Each video shows real symptoms in the local language (English, Kiswahili, French, Arabic, Kreyol) with the AI responding. Message: 'The missing link between AI and universal healthcare.'",
        url: "https://instanthpi.ai/videos/Country-SouthSudan.mp4"
      },
      {
        project: "InstantHPI — Global Content Blast",
        folder: "instanthpi-videos/",
        category: "marketing",
        status: "completed",
        action: "Posted 20 videos across LinkedIn (14), Twitter (1), Instagram (1 reel), TikTok (1), plus 3 scheduled. Videos in 7 languages: English, French, Spanish, Hindi, Arabic, Portuguese, Swahili. Each with real medical example cases. All driving to t.me/instanthpibot.",
        url: "https://linkedin.com/in/centremedicalfont"
      },
      {
        project: "InstantHPI — CV & PDF Generation",
        folder: "Desktop/",
        category: "business",
        status: "completed",
        action: "Updated CV highlighting AI development skills (15+ production apps, Claude/GPT/Gemini APIs, AWS, full-stack). Generated PDF via Playwright. Added live project links and Telegram bot. Saved as Desktop/CV-Dr-Carlos-Faviel-Font.pdf.",
        url: "https://instanthpi.com"
      }
    ]
  },
  {
    date: "2026-03-26",
    summary: "Predictive History video engine — 10 Remotion videos on Jiang's top subjects, rendered, uploaded to S3, scheduled across Instagram/TikTok/YouTube/Twitter/LinkedIn (50 posts total over 2 days).",
    entries: [
      {
        project: "Predictive History — Video Engine",
        folder: "instanthpi-videos/src/compositions/predictive-history/",
        category: "marketing",
        status: "launched",
        action: "Built full Predictive History video pipeline: brand styles (cyan/amber/red), PredictiveHistoryShort Remotion template (5 phases: hook, timeline dots, Jiang quote, takeaway, CTA), 10 video specs: Game Theory, Rome, Elite Overproduction, Capitalism, Dollar, Athens, WW3, Eschatology, Alexander, Meritocracy. All rendered as 1080x1920 vertical MP4s.",
        url: "https://predictivehistory.ca"
      },
      {
        project: "Predictive History — Social Scheduling",
        folder: "instanthpi-videos/",
        category: "marketing",
        status: "completed",
        action: "Uploaded 10 videos to AWS S3. Scheduled 50 posts via Blotato: 5 videos/day across Instagram Reels, TikTok, YouTube, Twitter/X, LinkedIn. Day 1 (Mar 27): Game Theory, Rome, Elite Overproduction, Capitalism, Dollar. Day 2 (Mar 28): Athens, WW3, Eschatology, Alexander, Meritocracy. Each with platform-optimized captions.",
        url: "https://instanthpi-content-agent.s3.amazonaws.com/videos/predictive-history/"
      }
    ]
  },
  {
    date: "2026-03-22",
    summary: "InstantHPI Content Agent built — AI social media manager that sees all projects, makes videos, posts to 5 platforms. AWS S3 backend. Social dashboard live at instanthpi.com/social.html.",
    entries: [
      {
        project: "InstantHPI Content Agent",
        folder: "instanthpi-site/_scripts/",
        category: "infrastructure",
        status: "launched",
        action: "Built the Content Agent system: CLI that scans git activity, picks projects to feature, generates Remotion videos, posts via Blotato to Instagram/TikTok/X/LinkedIn/YouTube, and records everything to AWS S3. Hybrid strategy: active work gets priority, quiet days showcase least-covered projects. 5 videos/day target.",
        url: "https://instanthpi.com/social.html"
      },
      {
        project: "InstantHPI Social Dashboard",
        folder: "instanthpi-site/social.html",
        category: "frontend",
        status: "launched",
        action: "Built public social media dashboard page on instanthpi.com. Shows recent posts with platform links, all 17 projects with category filters, social account links. Fetches data from AWS S3 bucket. Added Social link to main site navigation.",
        url: "https://instanthpi.com/social.html"
      },
      {
        project: "AWS S3 Content Backend",
        folder: "instanthpi-site/_scripts/aws-backend/",
        category: "infrastructure",
        status: "completed",
        action: "Created S3 bucket instanthpi-content-agent on AWS (us-east-1) with public read, CORS, and JSON data files. Stores posts.json and projects.json — serves as the API for the social dashboard. No Render, no Supabase — pure AWS.",
        url: "https://instanthpi-content-agent.s3.amazonaws.com/posts.json"
      }
    ]
  },
  {
    date: "2026-03-20",
    summary: "FixDrop launched. InstantHPI content creation system set up — Remotion video skill, Blotato MCP for social media posting, brand voice + design kit + project roster created. Daily video diary pipeline ready.",
    entries: [
      {
        project: "InstantHPI — Content Creation System",
        folder: "instanthpi-site/content/",
        category: "marketing",
        status: "completed",
        action: "Set up full content creation pipeline for InstantHPI as umbrella brand. Installed 7 skills: Remotion (video creation), Blotato scheduler, content-creator, video-analyzer, video-style-cloner, video-thumbnail-generator, youtube-shorts-creator. Connected Blotato MCP for cross-posting to Instagram, TikTok, YouTube Shorts. Created brand voice guide, design kit (colors/fonts from instanthpi.com), and projects roster with 15 active projects for daily video rotation.",
        url: "https://instanthpi.com"
      },
      {
        project: "InstantHPI — Blotato MCP Integration",
        folder: "instanthpi-site/",
        category: "infrastructure",
        status: "completed",
        action: "Connected Blotato MCP server (HTTP transport) to Claude Code for scheduling and publishing social media posts directly from the terminal. Supports Instagram Reels, TikTok, YouTube Shorts, Twitter/X, LinkedIn — all from one command.",
        url: "https://blotato.com"
      }
    ]
  },
  {
    date: "2026-03-20",
    summary: "FixDrop — Reverse-auction repair platform built from scratch. AI crowdfunding concept. Google OAuth + GA4 analytics. 25 AI-generated demo images.",
    entries: [
      {
        project: "FixDrop",
        folder: "fixdrop/",
        category: "startup",
        status: "launched",
        action: "Built full reverse-auction platform for repairs from zero to live in one session. Customers upload repair estimate photos, AI (Claude) scans and itemizes them, nearby shops submit blind bids, customer picks the best deal. Supports split repairs across multiple shops. 25 demo cases with AI-generated photos (trucks, motorcycles, school buses, coach buses, taxis, cars, plumbing, electrical, HVAC, roofing). Backend: Node.js/Express with Stripe, PostGIS GPS matching, auto-bidder. Frontend: SPA with Untitled UI. Database: Supabase with full RLS + blind bidding policies. Google OAuth login. GA4 analytics. Coming Soon section with 9 future features. Global — no country restrictions.",
        url: "https://fixdrop.shop"
      },
      {
        project: "FixDrop — AI Image Generation",
        folder: "fixdrop/_scripts/",
        category: "ai",
        status: "completed",
        action: "Generated 25 photorealistic demo images using Gemini 3.1 Flash Image Preview (Nano Banana 2) — one for each repair case. Truck DPF filters, Peterbilt brakes, Freightliner transmissions, Harley engines, school bus diesels, coach bus suspensions, taxi hybrids, Tesla suspensions, sewer repairs, roof shingles, basement waterproofing, and more.",
        url: "https://fixdrop.shop/#/feed"
      },
      {
        project: "FixDrop — Google OAuth + Supabase",
        folder: "fixdrop/",
        category: "infrastructure",
        status: "completed",
        action: "Created GCP project fixdrop-app, Web Application OAuth client (not IAP-locked), consent screen published as External/In Production. Created Supabase project cxlwrhmgdqwrioezrqxa with Google auth provider configured. Auth trigger syncs Google users to public.users table.",
        url: "https://fixdrop.shop"
      },
      {
        project: "FixDrop — Google Analytics 4",
        folder: "fixdrop/",
        category: "analytics",
        status: "completed",
        action: "Set up GA4 property (G-EMYDRZGVTV) with web data stream. Added SEO meta tags (Open Graph, Twitter Cards, keywords). Event tracking on page views, login attempts, uploads. Enhanced measurement enabled (scrolls, outbound clicks, video engagement).",
        url: "https://analytics.google.com"
      },
      {
        project: "AI Crowdfunder Concept",
        folder: "fixdrop/",
        category: "startup",
        status: "research",
        action: "Researched crowdfunding platform APIs (Kickstarter, Indiegogo, GoFundMe, Patreon, Gumroad, Stripe). None allow campaign creation via API. Best path: custom Stripe-powered funding page built directly into projects — no middleman, 97% revenue (vs 90% on Kickstarter). Concept applicable to all future projects.",
        url: null
      }
    ]
  },
  {
    date: "2026-03-19",
    summary: "Absolute Brahmacharya — 120-section spiritual journey website published on instanthpi.com",
    entries: [
      {
        project: "Absolute Brahmacharya",
        folder: "absolute-brahmacharya/",
        category: "spiritual",
        status: "launched",
        action: "Built and published 120-section cinematic scroll website on brahmacharya, lust, women, men, relationships, prayer, and the soul. Full-screen parallax sections with AI-generated backgrounds (Nano Banana 2). Covers: the seed, the waste, prostitution, complementarity, the self-evident truth, women's mirage, the tax collector, Satya Yuga, the elements, the small breath, and more. Deployed to instanthpi.com/brahmacharya/",
        url: "https://instanthpi.com/brahmacharya/"
      }
    ]
  },
  {
    date: "2026-03-18",
    summary: "InstantHPI Free Healthcare Education Bot launched — Telegram bot + medical sequence subpage + abuse protection",
    entries: [
      {
        project: "InstantHPI Bot",
        folder: "instanthpi-bot/",
        category: "medical",
        status: "launched",
        action: "Built and deployed @instanthpibot on Telegram — free AI-powered medical education using DeepSeek ($0.003/consult). Full OPQRST intake, HPI confirmation, 10 follow-up questions, clinical reasoning with timeline and decision tree, patient explanation, document templates. Rate limited: 3/user/day, 500 global/day cap.",
        url: "https://t.me/instanthpibot"
      },
      {
        project: "InstantHPI Medical Sequence",
        folder: "instanthpi-site/",
        category: "medical",
        status: "launched",
        action: "Created medical-sequence.html — 10-step clinical pipeline explained with CSS mockups, OPQRST form questions, fake patient examples, cost breakdown, automation overview. Deployed to instanthpi.com.",
        url: "https://instanthpi.com/medical-sequence.html"
      },
      {
        project: "InstantHPI Portfolio",
        folder: "instanthpi-site/",
        category: "tools",
        status: "active",
        action: "Multiple iterations — removed Dr Font references, region-specific references, fixed cost consistency ($0.003 everywhere), changed to 'Healthcare Education' framing, doctor review starts at reasoning step",
        url: "https://instanthpi.com"
      }
    ]
  },
  {
    date: "2026-03-16",
    summary: "6 projects touched — GOD visual journey, CottonCandyGod marathon, Orbital Frames game, Lingo Blur extension, ArrangedSuccess desktop, InstantHPI portfolio site",
    entries: [
      {
        project: "GOD — Sacred Gita Visual Journey",
        folder: "god/",
        category: "spiritual",
        status: "active",
        action: "Updated image generation scripts, UI refinements",
        url: "https://sacredgita.com"
      },
      {
        project: "CottonCandyGod — Siddhanath Yoga Marathon",
        folder: "cottoncandygod/",
        category: "spiritual",
        status: "active",
        action: "Updated seva services module",
        url: "https://cottoncandygod.com"
      },
      {
        project: "Orbital Frames Game",
        folder: "orbital-frames-game/",
        category: "gaming",
        status: "active",
        action: "Modified main.js game logic",
        url: "https://orbitalframes.com"
      },
      {
        project: "Lingo Blur",
        folder: "lingo-blur/",
        category: "language",
        status: "active",
        action: "Updated background.js extension logic",
        url: null
      },
      {
        project: "ArrangedSuccess Desktop",
        folder: "arrangedsuccess-desktop/",
        category: "social",
        status: "active",
        action: "Multiple file modifications — desktop app development",
        url: "https://arrangedsuccess.com"
      },
      {
        project: "InstantHPI Portfolio",
        folder: "instanthpi-site/",
        category: "tools",
        status: "active",
        action: "Added project timeline feature — daily activity tracker",
        url: "https://instanthpi.com"
      }
    ]
  },
  {
    date: "2026-03-15",
    summary: "Portfolio site created — instanthpi.com launched on Netlify with 22+ project cards",
    entries: [
      {
        project: "InstantHPI Portfolio",
        folder: "instanthpi-site/",
        category: "tools",
        status: "launched",
        action: "Full portfolio site built and deployed to Netlify — 22+ project cards, hero section, language bots section",
        url: "https://instanthpi.com"
      }
    ]
  },
  {
    date: "2026-03-01",
    summary: "DockStation prep, Garapiña brand site, HIPAA migration completed",
    entries: [
      {
        project: "DockStation",
        folder: "dockstation/",
        category: "tools",
        status: "active",
        action: "Stripped personal data from default buttons, prepped for distribution",
        url: null
      },
      {
        project: "Garapiña Faviel",
        folder: "guarapina-faviel/",
        category: "brand",
        status: "active",
        action: "Added kombucha comparison page + brand phrases",
        url: null
      },
      {
        project: "Truck Stop Santé AI",
        folder: "truck-stop-sante-ai/",
        category: "medical",
        status: "active",
        action: "Completed HIPAA migration — fax processor moved to AWS Bedrock",
        url: null
      }
    ]
  },
  {
    date: "2026-02-27",
    summary: "Kriya Yoga Trainer Chrome extension updates",
    entries: [
      {
        project: "Kriya Yoga Trainer",
        folder: "kriya-yoga-trainer/",
        category: "spiritual",
        status: "submitted",
        action: "v1.1.1 — CSP fixes for Chrome Web Store compliance",
        url: null
      }
    ]
  }
];
