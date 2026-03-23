import { normalizeList, safeText } from './utils.js';

const TEMPLATE_PREMIUM_PROPOSAL = 'pitch-proposal';
const DEFAULT_LAYOUT_PRESET = 'notso-premium-v1';

const TEMPLATE_DEFINITIONS = {
  [TEMPLATE_PREMIUM_PROPOSAL]: {
    id: TEMPLATE_PREMIUM_PROPOSAL,
    label: 'Notso Premium Proposal',
    description: '15-slide premium pitch deck for animated chatbot proposals.',
    version: '2.0.0',
    slides: [
      { id: 'cover', label: 'Cover', type: 'cover', field: 'projectTitle', required: true, optional: false, defaultIncluded: true },
      { id: 'problem', label: 'The Problem', type: 'problem', field: 'problemPoints', required: true, optional: false, defaultIncluded: true },
      { id: 'opportunity', label: 'The Opportunity', type: 'opportunity', field: 'opportunityPoints', required: false, optional: true, defaultIncluded: true },
      { id: 'solution', label: 'The Solution', type: 'solution', field: 'solutionPillars', required: true, optional: false, defaultIncluded: true },
      { id: 'what-notso-does', label: 'What Notso AI Does', type: 'what-notso-does', field: 'whatNotsoCards', required: false, optional: true, defaultIncluded: true },
      { id: 'meet-buddy', label: 'Meet The Buddy', type: 'meet-buddy', field: 'buddyDescription', required: false, optional: true, defaultIncluded: true },
      { id: 'experience-concept', label: 'Experience Concept', type: 'experience-concept', field: 'experienceConcept', required: false, optional: true, defaultIncluded: true },
      { id: 'chat-flow', label: 'Chat Flow', type: 'chat-flow', field: 'chatFlow', required: false, optional: true, defaultIncluded: true },
      { id: 'example-interaction', label: 'Example Interaction', type: 'example-interaction', field: 'interactionExample', required: false, optional: true, defaultIncluded: true },
      { id: 'business-impact', label: 'Business Impact', type: 'business-impact', field: 'businessImpact', required: false, optional: true, defaultIncluded: true },
      { id: 'data-analytics', label: 'Data & Analytics', type: 'data-analytics', field: 'analyticsBullets', required: false, optional: true, defaultIncluded: true },
      { id: 'what-you-get', label: 'What You Get', type: 'what-you-get', field: 'deliverables', required: false, optional: true, defaultIncluded: true },
      { id: 'pricing', label: 'Pricing', type: 'pricing', field: 'pricing', required: true, optional: false, defaultIncluded: true },
      { id: 'timeline', label: 'Timeline', type: 'timeline', field: 'timeline', required: false, optional: true, defaultIncluded: true },
      { id: 'closing', label: 'Closing', type: 'closing', field: 'closingText', required: true, optional: false, defaultIncluded: true }
    ]
  }
};

export const EDITABLE_FIELD_DEFINITIONS = [
  { name: 'projectTitle', label: 'Project title' },
  { name: 'coverOneLiner', label: 'Cover one-liner' },
  { name: 'subtitle', label: 'Subtitle' },
  { name: 'proposalDate', label: 'Proposal date' },
  { name: 'mascotName', label: 'Mascot name' },
  { name: 'problemPoints', label: 'Problem points' },
  { name: 'opportunityPoints', label: 'Opportunity points' },
  { name: 'solutionPillars', label: 'Solution pillars' },
  { name: 'whatNotsoIntro', label: 'What Notso intro' },
  { name: 'whatNotsoCards', label: 'What Notso cards' },
  { name: 'buddyDescription', label: 'Buddy description' },
  { name: 'buddyPersonality', label: 'Buddy personality bullets' },
  { name: 'toneSliders', label: 'Tone sliders' },
  { name: 'experienceConcept', label: 'Experience concept' },
  { name: 'chatFlow', label: 'Chat flow' },
  { name: 'interactionExample', label: 'Example interaction' },
  { name: 'businessImpact', label: 'Business impact' },
  { name: 'analyticsDescription', label: 'Analytics description' },
  { name: 'analyticsBullets', label: 'Analytics bullets' },
  { name: 'deliverables', label: 'Deliverables' },
  { name: 'pricing', label: 'Pricing' },
  { name: 'timeline', label: 'Timeline' },
  { name: 'closingText', label: 'Closing text' },
  { name: 'teamCards', label: 'Team cards' },
  { name: 'characterAssets', label: 'Character assets' },
  { name: 'imagePrompts', label: 'Image prompts' },
  { name: 'layoutPreset', label: 'Layout preset' },
  { name: 'layoutPresetLock', label: 'Layout preset lock' },
  { name: 'primaryColor', label: 'Deck primary' },
  { name: 'accentColor', label: 'Deck accent' },
  { name: 'secondaryColor', label: 'Deck secondary' },
  { name: 'backgroundColor', label: 'Deck background' },
  { name: 'textColor', label: 'Deck text' },
  { name: 'headingFont', label: 'Deck heading font' },
  { name: 'bodyFont', label: 'Deck body font' }
];

const LAYOUT_PRESETS = {
  [DEFAULT_LAYOUT_PRESET]: {
    id: DEFAULT_LAYOUT_PRESET,
    label: 'Notso Premium v1',
    slideLayoutByType: {
      cover: 'hook-cover',
      problem: 'problem-grid',
      opportunity: 'opportunity-split',
      solution: 'solution-centered',
      'what-notso-does': 'capability-grid',
      'meet-buddy': 'buddy-hero',
      'experience-concept': 'concept-split',
      'chat-flow': 'flow-split',
      'example-interaction': 'interaction-hero',
      'business-impact': 'impact-dark',
      'data-analytics': 'analytics-split',
      'what-you-get': 'deliverables-dark',
      pricing: 'pricing-3cards',
      timeline: 'timeline-horizontal',
      closing: 'closing-dark'
    },
    imageRatioByType: {
      cover: '16:9',
      problem: '4:3',
      opportunity: '4:3',
      solution: '1:1',
      'what-notso-does': '1:1',
      'meet-buddy': '1:1',
      'experience-concept': '4:3',
      'chat-flow': '4:3',
      'example-interaction': '16:9',
      'business-impact': '1:1',
      'data-analytics': '4:3',
      'what-you-get': '1:1',
      pricing: '4:3',
      timeline: '16:9',
      closing: '4:3'
    },
    backgroundModeByType: {
      cover: 'light',
      problem: 'light',
      opportunity: 'light',
      solution: 'light',
      'what-notso-does': 'light',
      'meet-buddy': 'light',
      'experience-concept': 'light',
      'chat-flow': 'light',
      'example-interaction': 'light',
      'business-impact': 'dark',
      'data-analytics': 'light',
      'what-you-get': 'dark',
      pricing: 'light',
      timeline: 'light',
      closing: 'dark'
    }
  }
};

function normalizeHex(input, fallback) {
  let value = safeText(input, fallback).toUpperCase();
  if (!value.startsWith('#')) value = `#${value}`;
  return value;
}

function asBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

function parseExcludedSlides(value) {
  if (Array.isArray(value)) return value.map((item) => safeText(item).toLowerCase()).filter(Boolean);
  if (typeof value === 'string') return value.split(/[,\n]/g).map((item) => safeText(item).toLowerCase()).filter(Boolean);
  return [];
}

function parsePairs(value, fallback = [], separator = '::', limit = 8) {
  return normalizeList(value, fallback)
    .slice(0, limit)
    .map((line) => {
      const [left, ...rest] = String(line).split(separator);
      return {
        title: safeText(left, line),
        description: safeText(rest.join(separator), '')
      };
    })
    .filter((item) => item.title);
}

function parseTriples(value, fallback = [], separator = '::', limit = 6) {
  return normalizeList(value, fallback)
    .slice(0, limit)
    .map((line) => {
      const [a, b, ...rest] = String(line).split(separator).map((part) => safeText(part));
      return {
        name: a || 'Tier',
        price: b || 'On request',
        description: safeText(rest.join(' '), 'Scope details provided in proposal.')
      };
    });
}

function parseTone(value, fallback = []) {
  return parsePairs(value, fallback, '::', 4).map((item) => {
    const score = Number.parseInt(item.description, 10);
    return {
      label: item.title,
      value: Number.isFinite(score) ? Math.max(15, Math.min(score, 100)) : 70
    };
  });
}

function parseDeliverables(value, fallback = []) {
  return parsePairs(value, fallback, '::', 4).map((item) => ({
    title: item.title,
    bullets: item.description
      .split(/[;,]\s*/)
      .map((line) => safeText(line))
      .filter(Boolean)
      .slice(0, 4)
  }));
}

function parseCharacterAssets(value, limit = 10) {
  let list = value;

  if (typeof value === 'string') {
    try {
      list = JSON.parse(value);
    } catch {
      list = [];
    }
  }

  if (!Array.isArray(list)) return [];

  return list
    .slice(0, limit)
    .map((item, index) => {
      const id = safeText(item?.id, `asset-${index + 1}`);
      const name = safeText(item?.name, `Character asset ${index + 1}`);
      const dataUrl = safeText(item?.dataUrl || item?.url, '');
      const placement = safeText(item?.placement, 'all-mascot').toLowerCase();

      if (!dataUrl) return null;
      if (!(dataUrl.startsWith('data:image/') || dataUrl.startsWith('/generated/') || /^https?:\/\//i.test(dataUrl))) {
        return null;
      }

      return { id, name, dataUrl, placement };
    })
    .filter(Boolean);
}

function resolveImageAssetForSlide(slideId, assets = []) {
  if (!Array.isArray(assets) || !assets.length) return null;

  const id = safeText(slideId, '').toLowerCase();
  const mascotSlides = new Set(['cover', 'meet-buddy', 'example-interaction', 'closing']);

  const exact = assets.find((asset) => asset.placement === id);
  if (exact) return exact;

  if (mascotSlides.has(id)) {
    return assets.find((asset) => asset.placement === 'all-mascot' || asset.placement === 'mascot') || assets[0];
  }

  return assets.find((asset) => asset.placement === 'all') || null;
}

function withSlide(id, type, title, subtitle, purpose, sourceField, extra = {}) {
  return { id, type, title, subtitle, purpose, sourceField, ...extra };
}

function defaultImagePrompt(type, project, mascotName) {
  switch (type) {
    case 'cover': return `Hero composition with ${mascotName} overlapping device UI for ${project.clientName}.`;
    case 'problem': return `Clean problem-state visual showing friction in support journey for ${project.clientName}.`;
    case 'opportunity': return `Optimistic before/after visual of user support improvement with ${mascotName}.`;
    case 'solution': return 'Three-block solution visual: character, AI intelligence, interaction layer.';
    case 'what-notso-does': return '2x2 capability card visual with product-style iconography and mascot accents.';
    case 'meet-buddy': return `${mascotName} full-body hero render with expressive personality variations.`;
    case 'experience-concept': return `Concept diagram with ${mascotName} moving between key product moments.`;
    case 'chat-flow': return 'Structured chat funnel visual with simple step transitions.';
    case 'example-interaction': return 'Large phone/tablet mockup with realistic chat bubbles and mascot overlap.';
    case 'business-impact': return 'Bold dark-slide impact icons for conversion, support, engagement, and brand lift.';
    case 'data-analytics': return 'Dashboard mockup with clean charts and mascot helper element.';
    case 'what-you-get': return 'Four-column product deliverable visual with icons and concise labels.';
    case 'pricing': return 'Premium SaaS three-tier pricing card visual with highlighted recommended tier.';
    case 'timeline': return 'Horizontal three-phase timeline visual with milestones.';
    case 'closing': return `${mascotName} closing hero visual with confident CTA atmosphere.`;
    default: return `Premium visual for ${project.clientName} proposal slide.`;
  }
}

function resolveTemplateId(rawTemplateId) {
  const candidate = safeText(rawTemplateId, TEMPLATE_PREMIUM_PROPOSAL);
  return TEMPLATE_DEFINITIONS[candidate] ? candidate : TEMPLATE_PREMIUM_PROPOSAL;
}

function resolveLayoutPreset(rawPresetId) {
  const candidate = safeText(rawPresetId, DEFAULT_LAYOUT_PRESET);
  return LAYOUT_PRESETS[candidate] || LAYOUT_PRESETS[DEFAULT_LAYOUT_PRESET];
}

export function getTemplateDefinitions() {
  return Object.values(TEMPLATE_DEFINITIONS).map((template) => ({
    id: template.id,
    label: template.label,
    description: template.description,
    version: template.version,
    slides: template.slides
  }));
}

export function getEditableFieldDefinitions() {
  return EDITABLE_FIELD_DEFINITIONS;
}

export function buildDeckModel(rawData = {}) {
  const templateId = resolveTemplateId(rawData.templateId);
  const template = TEMPLATE_DEFINITIONS[templateId];
  const excludedSlides = new Set(parseExcludedSlides(rawData.excludedSlides));
  const layoutPreset = resolveLayoutPreset(rawData.layoutPreset);
  const layoutPresetLock = asBoolean(rawData.layoutPresetLock, true);

  const appTheme = {
    surfaceTop: '#EAF4FF',
    surfaceBottom: '#F8FBFF',
    card: '#FFFFFF',
    line: '#CFDDFF',
    text: '#102347',
    muted: '#4F5F83',
    primaryColor: '#0B1F4D',
    accentColor: '#00C4CC',
    secondaryColor: '#7D2AE8'
  };

  const deckTheme = {
    brandName: safeText(rawData.brandName, 'Notso AI'),
    primaryColor: normalizeHex(rawData.primaryColor, '#004B49'),
    accentColor: normalizeHex(rawData.deckAccentColor || rawData.accentColor, '#30D89E'),
    secondaryColor: normalizeHex(rawData.deckSecondaryColor || rawData.secondaryColor, '#0B6E6C'),
    backgroundColor: normalizeHex(rawData.deckBackgroundColor || rawData.backgroundColor, '#F2F4F6'),
    textColor: normalizeHex(rawData.deckTextColor || rawData.textColor, '#0B1D2E'),
    headingFont: safeText(rawData.deckHeadingFont || rawData.headingFont, 'Sora'),
    bodyFont: safeText(rawData.deckBodyFont || rawData.bodyFont, 'Inter')
  };

  const project = {
    clientName: safeText(rawData.clientName, 'Acme Client'),
    clientUrl: safeText(rawData.clientUrl, 'https://www.acme-client.com'),
    projectTitle: safeText(rawData.projectTitle, 'AI Mascot Proposal'),
    coverOneLiner: safeText(rawData.coverOneLiner, 'A playful, premium chatbot experience that converts and delights.'),
    subtitle: safeText(rawData.subtitle, 'A reusable digital buddy concept tailored to your brand.'),
    proposalDate: safeText(rawData.proposalDate, 'June 2026'),
    mascotName: safeText(rawData.mascotName, 'Sven'),
    deckVersion: safeText(rawData.deckVersion, 'v1.0'),
    contactName: safeText(rawData.contactName, 'Max Kowalski'),
    contactEmail: safeText(rawData.contactEmail, 'max@notso.ai'),
    contactPhone: safeText(rawData.contactPhone, '+31 6 40450599'),
    characterAssets: parseCharacterAssets(rawData.characterAssets)
  };

  const content = {
    problemPoints: normalizeList(rawData.problemPoints, [
      `${project.clientName} loses momentum when visitors do not get instant answers.`,
      'Support teams repeat the same pre-sales and service responses manually.',
      'Current automation lacks brand personality and emotional connection.'
    ]).slice(0, 4),
    opportunityPoints: normalizeList(rawData.opportunityPoints, [
      'Convert static support into guided, interactive discovery.',
      'Reduce service load with intelligent first-line responses.',
      `Create a memorable branded assistant with ${project.mascotName}.`
    ]).slice(0, 4),
    solutionPillars: parsePairs(rawData.solutionPillars, [
      'Character :: A custom digital buddy with recognizable personality.',
      'AI :: Smart intent handling and dynamic guidance.',
      'Interaction :: Conversational UI for web, mobile, and campaign touchpoints.'
    ], '::', 3),
    whatNotsoIntro: safeText(rawData.whatNotsoIntro, 'At Notso AI, we design and deploy animated AI characters that turn support and sales conversations into premium experiences.'),
    whatNotsoCards: parsePairs(rawData.whatNotsoCards, [
      'Strategy & Personality :: We define tone, role, and emotional behavior.',
      'Design & Animation :: High-quality mascot animation and motion direction.',
      'Smart Conversations :: Structured chat logic with conversion intent.',
      'Measurable Impact :: Analytics visibility for performance and optimization.'
    ], '::', 4),
    buddyDescription: safeText(rawData.buddyDescription, `${project.mascotName} is a playful but practical assistant that guides users with empathy, clarity, and speed.`),
    buddyPersonality: normalizeList(rawData.buddyPersonality, [
      'Friendly and professional tone',
      'Emotion-aware replies',
      'Brand-consistent language',
      'Conversion-focused prompts'
    ]).slice(0, 5),
    toneSliders: parseTone(rawData.toneSliders, [
      'Friendly :: 88',
      'Professional :: 74',
      'Playful :: 69',
      'Direct :: 82'
    ]),
    experienceConcept: normalizeList(rawData.experienceConcept, [
      'User starts on website, greeted by mascot assistant.',
      'Assistant routes intent to product, support, or booking path.',
      'Recommendations adapt to user behavior and preference.',
      'Outcome-driven CTA closes loop with conversion or handoff.'
    ]).slice(0, 6),
    chatFlow: normalizeList(rawData.chatFlow, [
      'Greeting',
      'Discovery',
      'Suggestions',
      'Personalization',
      'Conversion'
    ]).slice(0, 6),
    interactionExample: normalizeList(rawData.interactionExample, [
      'User: I need help picking the best chair.',
      'Buddy: Great, do you prefer ergonomic or lounge style?',
      'User: Ergonomic for long work sessions.',
      'Buddy: I recommend Comfort LX006, would you like a quick comparison?'
    ]).slice(0, 8),
    businessImpact: normalizeList(rawData.businessImpact, [
      'Increase conversion rate',
      'Reduce support load',
      'Improve engagement',
      'Strengthen branded recall'
    ]).slice(0, 4),
    analyticsDescription: safeText(rawData.analyticsDescription, 'Every interaction is tracked and analyzed to improve messaging, product guidance, and conversion outcomes.'),
    analyticsBullets: normalizeList(rawData.analyticsBullets, [
      'Live dashboard for conversation and conversion metrics',
      'Top questions and topic trends',
      'Interaction volume and dwell-time tracking',
      'Exportable monthly reports'
    ]).slice(0, 7),
    deliverables: parseDeliverables(rawData.deliverables, [
      'Deployment-ready mascot :: Branded character; 40+ expressions; campaign-ready assets',
      'Multichannel access :: Website widget; mobile support; campaign microsites',
      'Performance insights :: Dashboard access; reporting cadence; optimization recommendations',
      'Brand activation media :: Social visuals; video loops; launch pack templates'
    ]),
    pricing: parseTriples(rawData.pricing, [
      'Basic - Chat :: EUR 2.600,- :: 3D mascot based on template;Template rig;Emotion based',
      'Premium - Chat :: EUR 24.000,- :: Custom-designed mascot;Full rig 40+ animations;Advanced LLM integration',
      'Pro - Chat & Voice :: EUR 38.000,- :: Custom mascot;Voice support;Advanced analytics'
    ]),
    timeline: parsePairs(rawData.timeline, [
      'Month 1 :: Discovery, concept alignment, and storyboard.',
      'Month 2 :: Design production, conversation flow build.',
      'Month 3 :: Integration, launch readiness, optimization kickoff.'
    ], '::', 3),
    closingText: safeText(rawData.closingText, `Let's build ${project.mascotName} together and launch a premium conversational experience.`),
    teamCards: parsePairs(rawData.teamCards, [
      'Strategy Lead :: Vision, scope, and decision alignment',
      'Conversation Designer :: Dialog logic and flow quality',
      'Motion Designer :: Character and animation polish',
      'Implementation Engineer :: Integration and launch delivery'
    ], '::', 4),
    characterAssets: project.characterAssets,
    imagePrompts: normalizeList(rawData.imagePrompts, [
      `Cover hero visual with ${project.mascotName} and tablet mockup for ${project.clientName}.`,
      'Problem-state visual with fragmented customer support journey.',
      'Opportunity visual showing before/after support transformation.',
      'Solution visual with 3 modular pillars: character, AI, interaction.',
      'Capability grid visual with icon-based cards and mascot accents.',
      `${project.mascotName} full character hero render with expressions.`,
      'Experience concept visual flow with mascot between touchpoints.',
      'Chat funnel visual with step-by-step conversation blocks.',
      'Large interaction mockup with realistic chat bubbles and mascot.',
      'Dark impact slide with bold conversion/support/engagement icons.',
      'Analytics dashboard visual with clean charts and KPIs.',
      'Four-column deliverables visual with productized sections.',
      'Premium SaaS pricing comparison cards with highlighted tier.',
      'Horizontal 3-phase timeline with milestones.',
      `Closing hero visual for ${project.mascotName} with confident CTA.`
    ]).slice(0, 30)
  };

  const allSlides = [
    withSlide('cover', 'cover', project.projectTitle, project.coverOneLiner, 'Create immediate emotional impact and context.', 'projectTitle', {
      oneLiner: project.coverOneLiner,
      proposalDate: project.proposalDate,
      mascotName: project.mascotName,
      clientName: project.clientName
    }),
    withSlide('problem', 'problem', 'The Problem', 'What is blocking growth today.', 'Create tension and urgency.', 'problemPoints', {
      points: content.problemPoints
    }),
    withSlide('opportunity', 'opportunity', 'The Opportunity', 'What becomes possible with the right assistant.', 'Shift from friction to possibility.', 'opportunityPoints', {
      points: content.opportunityPoints
    }),
    withSlide('solution', 'solution', 'The Solution', 'Character + AI + interaction model.', 'Provide simple clarity of approach.', 'solutionPillars', {
      pillars: content.solutionPillars
    }),
    withSlide('what-notso-does', 'what-notso-does', 'What Notso AI Does', 'A productized approach to animated AI assistants.', 'Build credibility with clear capability blocks.', 'whatNotsoCards', {
      intro: content.whatNotsoIntro,
      cards: content.whatNotsoCards
    }),
    withSlide('meet-buddy', 'meet-buddy', `Meet ${project.mascotName}`, 'Personality and tone profile.', 'Create emotional connection with the mascot.', 'buddyDescription', {
      mascotName: project.mascotName,
      description: content.buddyDescription,
      personality: content.buddyPersonality,
      toneSliders: content.toneSliders
    }),
    withSlide('experience-concept', 'experience-concept', 'Experience Concept', 'How the assistant moves across product moments.', 'Show interaction concept and visual journey.', 'experienceConcept', {
      points: content.experienceConcept
    }),
    withSlide('chat-flow', 'chat-flow', 'Chat Flow', 'The logic behind each conversation.', 'Explain the operational conversation steps.', 'chatFlow', {
      steps: content.chatFlow
    }),
    withSlide('example-interaction', 'example-interaction', 'Example Interaction', 'How it feels in a real user moment.', 'Make the concept tangible with a realistic interaction.', 'interactionExample', {
      messages: content.interactionExample,
      mascotName: project.mascotName
    }),
    withSlide('business-impact', 'business-impact', 'Business Impact', 'The commercial outcome of this assistant.', 'Sell business value in one glance.', 'businessImpact', {
      impacts: content.businessImpact
    }),
    withSlide('data-analytics', 'data-analytics', 'Data & Analytics', 'Insights that improve performance over time.', 'Show the intelligence and measurable layer.', 'analyticsBullets', {
      description: content.analyticsDescription,
      bullets: content.analyticsBullets
    }),
    withSlide('what-you-get', 'what-you-get', 'What You Get', 'Deliverables packaged for deployment and growth.', 'Clarify exactly what is included.', 'deliverables', {
      sections: content.deliverables
    }),
    withSlide('pricing', 'pricing', 'Pricing', 'Flexible solutions based on ambition and scope.', 'Make decision-making easy.', 'pricing', {
      packages: content.pricing
    }),
    withSlide('timeline', 'timeline', 'Timeline', 'A clear 3-month execution path.', 'Reduce risk with transparent phasing.', 'timeline', {
      phases: content.timeline
    }),
    withSlide('closing', 'closing', 'Let’s Build This Together', 'From concept to launch-ready experience.', 'Drive commitment and next action.', 'closingText', {
      headline: `Let's build ${project.mascotName}`,
      text: content.closingText,
      team: content.teamCards,
      contactName: project.contactName,
      contactEmail: project.contactEmail,
      contactPhone: project.contactPhone,
      mascotName: project.mascotName
    })
  ];

  const slidesWithLayout = allSlides.map((slide, index) => {
    const lockedLayout = layoutPreset.slideLayoutByType[slide.type];
    const imageRatio = layoutPreset.imageRatioByType[slide.type] || '16:9';
    const backgroundMode = layoutPreset.backgroundModeByType[slide.type] || 'light';
    const layoutKey = layoutPresetLock
      ? (lockedLayout || slide.type)
      : safeText(rawData[`layout_${slide.id}`], lockedLayout || slide.type);

    return {
      ...slide,
      layoutKey,
      imageRatio,
      backgroundMode,
      imagePrompt: content.imagePrompts[index] || defaultImagePrompt(slide.type, project, project.mascotName),
      imageAsset: resolveImageAssetForSlide(slide.id, content.characterAssets)
    };
  });

  let slides = slidesWithLayout.filter((slide) => !excludedSlides.has(slide.id));
  if (!slides.length) slides = slidesWithLayout.slice(0, 1);

  const availableSlides = template.slides.map((slideMeta) => ({
    ...slideMeta,
    included: !excludedSlides.has(slideMeta.id)
  }));

  return {
    template: {
      id: template.id,
      label: template.label,
      description: template.description,
      version: template.version
    },
    excludedSlides: Array.from(excludedSlides),
    availableSlides,
    project,
    content,
    appTheme,
    deckTheme,
    theme: deckTheme,
    layout: {
      presetId: layoutPreset.id,
      presetLabel: layoutPreset.label,
      locked: layoutPresetLock
    },
    slides
  };
}
