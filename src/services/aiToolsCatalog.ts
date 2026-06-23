export interface AITool {
  name: string;
  url: string;
  description: string;
  category: "Design" | "Development" | "Deployment" | "Content" | "Team" | "Research" | "Misc";
}

export const AI_TOOLS_CATEGORIES = {
  All: "All Tools",
  Design: "Design & Creative",
  Development: "Development & Coding",
  Deployment: "Deployment & Infrastructure",
  Content: "Content & Copywriting",
  Team: "Team & Collaboration",
  Research: "Research & Science",
  Misc: "Utilities & Miscellaneous"
};

export const AI_TOOLS_CATALOG: AITool[] = [
  // Design
  {
    name: "Remove.bg",
    url: "https://www.remove.bg/",
    description: "Automatically remove backgrounds from images using AI in 5 seconds with a single click.",
    category: "Design"
  },
  {
    name: "Canva",
    url: "https://www.canva.com/",
    description: "AI-powered graphic design platform featuring Magic Studio for quick creation of social graphics, videos, presentation materials, and artwork layouts.",
    category: "Design"
  },
  {
    name: "Deep Dream Generator",
    url: "https://deepdreamgenerator.com/",
    description: "An AI-powered digital art tool that uses deep learning algorithms to morph your photos into high-fidelity generative artworks.",
    category: "Design"
  },
  {
    name: "Artbreeder",
    url: "https://www.artbreeder.com/",
    description: "Collaborative and creative tools for collaging, prompt blending, and producing high-quality landscapes, portraits, and characters.",
    category: "Design"
  },
  {
    name: "Designhill",
    url: "https://www.designhill.com/tools",
    description: "AI-powered creative assets tool featuring instant business card suites, logo builders, and custom apparel illustrations.",
    category: "Design"
  },
  {
    name: "Clideo",
    url: "https://www.clideo.com/",
    description: "Online AI-driven video studio toolkit built for making, resizing, joining, cropping, and subtitle management.",
    category: "Design"
  },
  {
    name: "Lumen5",
    url: "https://lumen5.com/",
    description: "Turn text scripts or high-quality blog posts into premium videos in minutes with a robust, AI-powered sequence creator.",
    category: "Design"
  },
  {
    name: "Fotor",
    url: "https://www.fotor.com/",
    description: "Full-stack image enhancer and premium editing canvas carrying neural filters, face retouchers, and object erasers.",
    category: "Design"
  },
  {
    name: "Vectr",
    url: "https://vectr.com/",
    description: "Free online vector graphics editor configured with AI workflow suggestions for standard UI designs and illustrations.",
    category: "Design"
  },
  {
    name: "AI Boost",
    url: "https://boost.pictures/",
    description: "All-in-one image studio for upscaling, styling, outfit testing, face swapping, body contour modifications, tattoo simulation, and background changes.",
    category: "Design"
  },

  // Development
  {
    name: "Supermemory",
    url: "https://github.com/supermemoryai/supermemory?hl=en-IN",
    description: "Memory and context engine + app that is extremely fast, scalable, and can be run fully locally. The Memory API for the AI era.",
    category: "Development"
  },
  {
    name: "Observer AI",
    url: "https://github.com/Roy3838/Observer?hl=en-IN",
    description: "Build powerful micro-agents that observe, log and react, so you don't have to.",
    category: "Development"
  },
  {
    name: "The Delegation",
    url: "https://github.com/arturitu/the-delegation",
    description: "A no-code 3D playground to explore, design, and interact with Agentic AI systems.",
    category: "Development"
  },
  {
    name: "DeepCode",
    url: "https://www.deepcode.ai/",
    description: "Security-focused semantic code scanner that searches for hidden vulnerabilities and code smells using advanced static analysis AI.",
    category: "Development"
  },
  {
    name: "Tabnine",
    url: "https://www.tabnine.com/",
    description: "AI code assistant for elite developers providing context-aware inline code completions and refactoring templates across numerous IDEs.",
    category: "Development"
  },
  {
    name: "Codota",
    url: "https://www.codota.com/",
    description: "Java and Kotlin specialized code completion companion bringing verified library usage samples directly into your coding workflow.",
    category: "Development"
  },
  {
    name: "Kite",
    url: "https://www.kite.com/",
    description: "Engineered code completion plugin delivering intelligent Python lookups, automated library imports, and instant API documentation.",
    category: "Development"
  },
  {
    name: "Deep Learning Studio",
    url: "https://deepcognition.ai/",
    description: "Rapid development pipeline utilizing drag-and-drop neural architectures for modeling, training, and building deep learning frameworks.",
    category: "Development"
  },
  {
    name: "ModelDepot",
    url: "https://modeldepot.io/",
    description: "Open hub for exploring, testing, downloading, and implementing pre-trained neural networks and machine learning models.",
    category: "Development"
  },
  {
    name: "Weights & Biases",
    url: "https://wandb.ai/site",
    description: "Mangement and tracking platform for ML teams offering experiment logs, model checkpoint visualizers, and dataset versioning logs.",
    category: "Development"
  },

  // Deployment
  {
    name: "TensorFlow Serving",
    url: "https://www.tensorflow.org/tfx/guide/serving",
    description: "Flexible, high-performance production serving framework designed for machine learning models running on high-load clusters.",
    category: "Deployment"
  },
  {
    name: "TensorFlow Lite",
    url: "https://www.tensorflow.org/lite",
    description: "Lightweight runtime library structured for compiling, running, and deploying ML models on embedded chips, microcontrollers, and Android/iOS.",
    category: "Deployment"
  },
  {
    name: "Heroku",
    url: "https://www.heroku.com/",
    description: "PaaS cloud platform loaded with smart pipeline deployments, one-click add-ons, and container scaling workflows.",
    category: "Deployment"
  },
  {
    name: "Google Cloud AI Platform",
    url: "https://cloud.google.com/ai-platform",
    description: "Fully-featured enterprise Google ecosystem that accelerates model training, evaluation, and distributed microservice deployment.",
    category: "Deployment"
  },
  {
    name: "Microsoft Azure AI",
    url: "https://azure.microsoft.com/en-us/services/machine-learning/",
    description: "Cloud suite with Azure Machine Learning Studio, ready-made translation APIs, cognitive services, and low-code deployments.",
    category: "Deployment"
  },
  {
    name: "Amazon SageMaker",
    url: "https://aws.amazon.com/sagemaker/",
    description: "End-to-end cloud environment for developers and scientists to map, train, fine-tune, and deploy serverless ML models at scale.",
    category: "Deployment"
  },

  // Content Writing
  {
    name: "Grammarly",
    url: "https://www.grammarly.com/",
    description: "Leading AI-powered typing assistant refining vocabulary, fixing active voice, polishing sentence structure, and correcting grammatical layouts.",
    category: "Content"
  },
  {
    name: "Hemingway Editor",
    url: "http://www.hemingwayapp.com/",
    description: "Writers' readability optimizer pointing out complex sentences, unnecessary adverbs, passive voices, and structural bottlenecks in real-time.",
    category: "Content"
  },
  {
    name: "Surfer SEO",
    url: "https://surferseo.com/",
    description: "SEO optimization tool recommending content length, semantic keyword clustering, heading layout structures, and density targets.",
    category: "Content"
  },
  {
    name: "Copy.ai",
    url: "https://www.copy.ai/",
    description: "Text generator creating landing page scripts, marketing copy, newsletters, social copy, and product highlights cleanly.",
    category: "Content"
  },
  {
    name: "Writesonic",
    url: "https://www.writesonic.com/",
    description: "Content writer with SEO-integrated blog builders, landing page generators, copy templates, and custom fine-tuned text workflows.",
    category: "Content"
  },
  {
    name: "Outwrite",
    url: "https://outwrite.com/",
    description: "Strategic writing companion focused on paraphrasing sentences, tightening style configurations, and tracking spelling accuracy.",
    category: "Content"
  },

  // Team Management
  {
    name: "Trello",
    url: "https://trello.com/",
    description: "Visual Kanban board mapping project progress carrying automated butler rules, card reminders, and streamlined action triggers.",
    category: "Team"
  },
  {
    name: "Asana",
    url: "https://asana.com/",
    description: "Team productivity suite highlighting workflow charts, task lists, goal dependencies, and interactive schedule boards.",
    category: "Team"
  },
  {
    name: "Slack",
    url: "https://slack.com/",
    description: "Enterprise messaging network integrated with smart channels, huddles, automation builders, canvas logs, and app connector hubs.",
    category: "Team"
  },
  {
    name: "Monday.com",
    url: "https://monday.com/",
    description: "Aesthetic OS for project tracking, layout planning, and task synchronization carrying helpful automation presets.",
    category: "Team"
  },
  {
    name: "Notion",
    url: "https://www.notion.so/",
    description: "An AI-charged hybrid workspace combining structured database wikis, smart summary outlines, interactive docs, and planning logs.",
    category: "Team"
  },

  // Research Work
  {
    name: "Semantic Scholar",
    url: "https://www.semanticscholar.org/",
    description: "AI-driven scientific indexing search engine that extracts paper abstracts, citation links, references, and relevant studies.",
    category: "Research"
  },
  {
    name: "Mendeley",
    url: "https://www.mendeley.com/",
    description: "Modern academic citation compiler allowing research teams to store, annotate, coordinate, and references papers smoothly.",
    category: "Research"
  },
  {
    name: "Zotero",
    url: "https://www.zotero.org/",
    description: "Free, open-source citations hub that gathers scientific articles, maps metadata, formats bibliographies, and syncs file libraries.",
    category: "Research"
  },
  {
    name: "PubPeer",
    url: "https://pubpeer.com/",
    description: "Scientific review database letting academic communities leave post-publication comments, flag study issues, and peer-review prints.",
    category: "Research"
  },
  {
    name: "ResearchGate",
    url: "https://www.researchgate.net/",
    description: "Scientific network portal facilitating paper shares, project collaborations, statistical citations, and academic Q&A.",
    category: "Research"
  },

  // Miscellaneous
  {
    name: "IFTTT",
    url: "https://ifttt.com/",
    description: "Automated trigger platform for pairing smart plugs, social pipelines, mailing systems, and calendars.",
    category: "Misc"
  },
  {
    name: "Zapier",
    url: "https://zapier.com/",
    description: "Integration platform creating multi-step automated workflows across thousands of public web services without code.",
    category: "Misc"
  },
  {
    name: "Wolfram Alpha",
    url: "https://www.wolframalpha.com/",
    description: "Computational knowledge engine doing calculus, physical analytics, molecular maps, history graphs, and mathematical explanations.",
    category: "Misc"
  },
  {
    name: "DeepL",
    url: "https://www.deepl.com/",
    description: "High-precision AI document translation engine powered by deep neural systems translating languages naturally with dialect tuning.",
    category: "Misc"
  },
  {
    name: "Otter.ai",
    url: "https://otter.ai/",
    description: "Real-time meeting transcriber translating vocal notes, identifying different speakers, and capturing screens automatically.",
    category: "Misc"
  },
  {
    name: "Google Photos",
    url: "https://photos.google.com/",
    description: "Cloud image locker configured with automatic tag generation, smart group identification, search indexing, and auto-edits.",
    category: "Misc"
  },
  {
    name: "Shazam",
    url: "https://www.shazam.com/",
    description: "Acoustic audio matching app identifying playing songs, lyrics, artists, and playlists in seconds through neural indexing.",
    category: "Misc"
  },
  {
    name: "Adobe Scan",
    url: "https://acrobat.adobe.com/us/en/mobile/scanner-app.html",
    description: "Mobile PDF scanning app carrying OCR tools for turning whiteboard pics and physical sheets into digital clear text databases.",
    category: "Misc"
  },
  {
    name: "Deepgram",
    url: "https://www.deepgram.com/",
    description: "Extremely fast, enterprise API for converting audio recordings into readable transcripts carrying smart formatting and diarization.",
    category: "Misc"
  },
  {
    name: "SpeechText.AI",
    url: "https://speechtext.ai/",
    description: "Domain-specific transcription service tailoring speech outputs into optimized medical, legal, or technical texts.",
    category: "Misc"
  },
  {
    name: "Speechmatics",
    url: "https://www.speechmatics.com/",
    description: "Real-time, multi-dialect transcription SDK built with deep neural clusters for outstanding accuracy across accents.",
    category: "Misc"
  },
  {
    name: "OpenAI GPT-3 / ChatGPT",
    url: "https://openai.com/",
    description: "Generative AI service built on advanced transformers generating human-like creative passages, code scripts, summaries, and answers.",
    category: "Misc"
  }
];
