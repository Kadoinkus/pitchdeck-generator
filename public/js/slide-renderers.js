function esc(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}

function safeColor(value, fallback) {
  const color = String(value || '').trim();
  return /^#?[0-9a-fA-F]{6}$/.test(color) ? (color.startsWith('#') ? color : `#${color}`) : fallback;
}

function safeFont(value, fallback) {
  const font = String(value || '').trim();
  return /^[a-zA-Z0-9\s\-,'"]{1,60}$/.test(font) ? font : fallback;
}

function themeVars(theme) {
  const primary = safeColor(theme?.primaryColor, '#004B49');
  const accent = safeColor(theme?.accentColor, '#30D89E');
  const secondary = safeColor(theme?.secondaryColor, '#0B6E6C');
  const bg = safeColor(theme?.backgroundColor, '#F2F4F6');
  const text = safeColor(theme?.textColor, '#0B1D2E');
  const heading = safeFont(theme?.headingFont, 'Sora');
  const body = safeFont(theme?.bodyFont, 'Inter');

  return [
    `--deck-primary:${primary}`,
    `--deck-accent:${accent}`,
    `--deck-secondary:${secondary}`,
    `--deck-bg:${bg}`,
    `--deck-text:${text}`,
    `--deck-heading:'${heading}',sans-serif`,
    `--deck-body:'${body}',sans-serif`
  ].join(';');
}

function attrTarget(target, label, className = 'ai-clickable') {
  return `class="${className}" data-ai-target="${esc(target)}" data-ai-label="${esc(label)}"`;
}

function fieldForType(slide) {
  if (slide?.sourceField) return slide.sourceField;

  switch (slide?.type) {
    case 'cover': return 'projectTitle';
    case 'problem': return 'problemPoints';
    case 'opportunity': return 'opportunityPoints';
    case 'solution': return 'solutionPillars';
    case 'what-notso-does': return 'whatNotsoCards';
    case 'meet-buddy': return 'buddyDescription';
    case 'experience-concept': return 'experienceConcept';
    case 'chat-flow': return 'chatFlow';
    case 'example-interaction': return 'interactionExample';
    case 'business-impact': return 'businessImpact';
    case 'data-analytics': return 'analyticsBullets';
    case 'what-you-get': return 'deliverables';
    case 'pricing': return 'pricing';
    case 'timeline': return 'timeline';
    case 'closing': return 'closingText';
    default: return 'global-concept';
  }
}

function ratioClass(ratio = '16:9') {
  if (ratio === '1:1') return 'ratio-1-1';
  if (ratio === '4:3') return 'ratio-4-3';
  return 'ratio-16-9';
}

function splitFeatureLines(value) {
  return String(value || '')
    .split(/[;,]\s*|\.\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function ensureItems(items, fallback) {
  if (Array.isArray(items) && items.length) return items;
  return fallback;
}

function slideIndex(slide, deckData) {
  if (!deckData?.slides?.length) return '';
  const idx = deckData.slides.findIndex((item) => item.id === slide.id);
  return idx >= 0 ? `${idx + 1}/${deckData.slides.length}` : '';
}

function imageSlot(slide, targetField, label, helper, ratio = '16:9', extraClass = '') {
  const prompt = String(slide.imagePrompt || helper || '').trim();
  const cls = `${ratioClass(slide.imageRatio || ratio)} ${extraClass}`.trim();

  return `<figure ${attrTarget('imagePrompts', label, `image-slot ${cls}`)} title="${esc(prompt)}">
    <div class="image-frame">
      <span class="image-icon">🖼</span>
      <p class="image-title">Add visual</p>
      <p class="image-hint">${esc(helper)}</p>
    </div>
  </figure>`;
}

function frame(slide, theme, deckData, targetField, body, options = {}) {
  const modeClass = slide.backgroundMode === 'dark' ? 'mode-dark' : 'mode-light';
  const header = options.hideHeader ? '' : `<header class="deck-header">
    <p class="deck-index">${esc(slideIndex(slide, deckData))}</p>
    <div class="deck-header-copy">
      <p class="deck-kicker">${esc(slide.purpose || 'Proposal slide')}</p>
      <h2 ${attrTarget(targetField, `${slide.title} title`)}>${esc(slide.title || '')}</h2>
      <p ${attrTarget(targetField, `${slide.title} subtitle`)}>${esc(slide.subtitle || '')}</p>
    </div>
  </header>`;

  return `<article class="slide-render deck-slide ${modeClass} ${esc(slide.type || 'generic')}-slide" style="${themeVars(theme)}">
    ${header}
    <section class="deck-content">
      ${body}
    </section>
    <footer class="deck-footer">${esc(theme?.brandName || 'Notso AI')}</footer>
  </article>`;
}

function renderCover(slide, theme, deckData) {
  const project = deckData?.project || {};
  const body = `<div class="layout-cover">
    <div class="cover-copy">
      <p class="cover-kicker">Notso AI presents</p>
      <h1 ${attrTarget('projectTitle', 'Cover title')}>${esc(slide.title || project.projectTitle || 'Proposal')}</h1>
      <p class="cover-line" ${attrTarget('coverOneLiner', 'Cover one-liner')}>${esc(slide.oneLiner || project.coverOneLiner || slide.subtitle || '')}</p>
      <div class="cover-meta">
        <span ${attrTarget('proposalDate', 'Proposal date')}>${esc(slide.proposalDate || project.proposalDate || '')}</span>
        <span ${attrTarget('clientName', 'Client name')}>Prepared for ${esc(slide.clientName || project.clientName || 'Client')}</span>
      </div>
      <p class="cover-url" ${attrTarget('clientUrl', 'Client URL')}>${esc(project.clientUrl || '')}</p>
    </div>
    <div class="cover-visual">
      ${imageSlot(slide, 'imagePrompts', 'Cover image', 'Hero mascot + product UI mockup', '16:9')}
      <div class="mascot-chip" ${attrTarget('mascotName', 'Mascot name')}>Mascot: ${esc(slide.mascotName || project.mascotName || 'Buddy')}</div>
    </div>
  </div>`;

  return frame(slide, theme, deckData, 'projectTitle', body, { hideHeader: true });
}

function renderProblem(slide, theme, deckData) {
  const target = fieldForType(slide);
  const points = ensureItems(slide.points, ['Pain point one', 'Pain point two', 'Pain point three']).slice(0, 4);

  const body = `<div class="problem-stack">
    <div class="problem-grid">
      ${points.map((point, i) => `<article class="panel problem-card" ${attrTarget(target, `Problem ${i + 1}`)}>
        <span class="problem-id">${String(i + 1).padStart(2, '0')}</span>
        <p>${esc(point)}</p>
      </article>`).join('')}
    </div>
    <div class="problem-bottom">
      <article class="panel summary-card" ${attrTarget(target, `${slide.title} key message`)}>
        <h3>Key message</h3>
        <p>${esc(points[0])}</p>
      </article>
      ${imageSlot(slide, target, 'Problem image', 'Current friction in user support flow', '4:3')}
    </div>
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderOpportunity(slide, theme, deckData) {
  const target = fieldForType(slide);
  const points = ensureItems(slide.points, ['Benefit one', 'Benefit two', 'Benefit three']).slice(0, 4);

  const body = `<div class="split-layout">
    <article class="panel text-panel" ${attrTarget(target, `${slide.title} content`)}>
      <p class="panel-lead">${esc(points[0] || '')}</p>
      <ul>
        ${points.slice(1).map((point) => `<li>${esc(point)}</li>`).join('')}
      </ul>
    </article>
    ${imageSlot(slide, target, 'Opportunity image', 'Mascot showing before/after transformation', '4:3')}
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderSolution(slide, theme, deckData) {
  const target = fieldForType(slide);
  const pillars = ensureItems(slide.pillars, [
    { title: 'Character', description: 'Branded personality layer.' },
    { title: 'AI', description: 'Intelligent intent handling.' },
    { title: 'Interaction', description: 'Clear conversational UI.' }
  ]).slice(0, 3);

  const body = `<div class="solution-stack">
    <article class="panel statement-panel" ${attrTarget(target, `${slide.title} statement`)}>
      <p>${esc(slide.subtitle || 'Character + AI + interaction model.')}</p>
    </article>
    <div class="solution-grid" ${attrTarget(target, `${slide.title} pillars`)}>
      ${pillars.map((pillar) => `<article class="panel solution-card">
        <h3>${esc(pillar.title || '')}</h3>
        <p>${esc(pillar.description || '')}</p>
      </article>`).join('')}
    </div>
    ${imageSlot(slide, target, 'Solution image', 'Simple architecture visual for three pillars', '16:9', 'compact-slot')}
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderWhatNotsoDoes(slide, theme, deckData) {
  const target = fieldForType(slide);
  const cards = ensureItems(slide.cards, [
    { title: 'Strategy', description: 'Define voice and role.' },
    { title: 'Design', description: 'Build mascot and animation.' },
    { title: 'Conversations', description: 'Craft performant chat flows.' },
    { title: 'Analytics', description: 'Measure and optimize.' }
  ]).slice(0, 4);

  const body = `<div class="split-layout wide-right">
    <article class="panel text-panel" ${attrTarget('whatNotsoIntro', `${slide.title} intro`)}>
      <p class="panel-lead">${esc(slide.intro || '')}</p>
      ${imageSlot(slide, target, 'Capabilities image', 'Mascot-led capability overview visual', '4:3', 'compact-slot')}
    </article>
    <div class="card-grid two-by-two" ${attrTarget(target, `${slide.title} cards`)}>
      ${cards.map((card) => `<article class="panel capability-card">
        <h3>${esc(card.title || '')}</h3>
        <p>${esc(card.description || '')}</p>
      </article>`).join('')}
    </div>
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderMeetBuddy(slide, theme, deckData) {
  const target = fieldForType(slide);
  const personality = ensureItems(slide.personality, ['Friendly', 'Helpful', 'Consistent', 'Conversion-focused']).slice(0, 5);
  const tones = ensureItems(slide.toneSliders, [
    { label: 'Friendly', value: 80 },
    { label: 'Professional', value: 72 },
    { label: 'Playful', value: 66 },
    { label: 'Direct', value: 78 }
  ]).slice(0, 4);

  const body = `<div class="split-layout">
    <article class="panel buddy-copy">
      <p class="panel-lead" ${attrTarget(target, `${slide.title} description`)}>${esc(slide.description || '')}</p>
      <ul class="bullet-list" ${attrTarget('buddyPersonality', `${slide.title} personality`)}>
        ${personality.map((item) => `<li>${esc(item)}</li>`).join('')}
      </ul>
      <div class="tone-list" ${attrTarget('toneSliders', `${slide.title} tone sliders`)}>
        ${tones.map((tone) => `<div class="tone-row">
          <span>${esc(tone.label || '')}</span>
          <div class="tone-track"><i style="width:${Math.max(10, Math.min(100, Number(tone.value) || 70))}%"></i></div>
        </div>`).join('')}
      </div>
    </article>
    ${imageSlot(slide, target, 'Mascot hero image', 'Large mascot render with expression variants', '4:3')}
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderExperienceConcept(slide, theme, deckData) {
  const target = fieldForType(slide);
  const points = ensureItems(slide.points, ['Step one', 'Step two', 'Step three', 'Step four']).slice(0, 5);

  const body = `<div class="split-layout">
    <article class="panel text-panel" ${attrTarget(target, `${slide.title} narrative`)}>
      <p class="panel-lead">${esc(points[0] || '')}</p>
      <ul>
        ${points.slice(1).map((point) => `<li>${esc(point)}</li>`).join('')}
      </ul>
    </article>
    <article class="panel flow-panel">
      <div class="mini-flow" ${attrTarget(target, `${slide.title} flow`)}>
        ${points.slice(0, 4).map((point, i) => `<div class="mini-flow-step">
          <span>${i + 1}</span>
          <p>${esc(point)}</p>
        </div>`).join('')}
      </div>
      ${imageSlot(slide, target, 'Experience image', 'Diagram-style concept visual with mascot route', '4:3', 'compact-slot')}
    </article>
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderChatFlow(slide, theme, deckData) {
  const target = fieldForType(slide);
  const steps = ensureItems(slide.steps, ['Greeting', 'Discovery', 'Suggestions', 'Personalization', 'Conversion']).slice(0, 6);

  const body = `<div class="split-layout">
    <article class="panel text-panel" ${attrTarget(target, `${slide.title} overview`)}>
      <p class="panel-lead">Structured logic keeps every conversation focused on value and conversion.</p>
      <ul>
        <li>Clear transitions between intent stages</li>
        <li>Context memory across conversation turns</li>
        <li>Escalation path when human support is needed</li>
      </ul>
    </article>
    <article class="panel flow-vertical">
      <div class="step-list" ${attrTarget(target, `${slide.title} steps`)}>
        ${steps.map((step, i) => `<div class="step-row">
          <span>${i + 1}</span>
          <p>${esc(step)}</p>
        </div>`).join('')}
      </div>
      ${imageSlot(slide, target, 'Chat flow visual', 'Chat funnel / step diagram with bubble cues', '4:3', 'compact-slot')}
    </article>
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderExampleInteraction(slide, theme, deckData) {
  const target = fieldForType(slide);
  const messages = ensureItems(slide.messages, [
    'User: I need help picking the right chair.',
    'Buddy: Great, what is your primary use?',
    'User: Long daily work sessions.',
    'Buddy: I recommend Comfort LX006. Want a quick comparison?'
  ]).slice(0, 7);

  const body = `<div class="interaction-layout">
    <article class="panel device-shell">
      <div class="chat-thread" ${attrTarget(target, `${slide.title} messages`)}>
        ${messages.map((line) => {
          const text = String(line || '');
          const splitIndex = text.indexOf(':');
          const speaker = splitIndex > 0 ? text.slice(0, splitIndex).trim() : '';
          const content = splitIndex > 0 ? text.slice(splitIndex + 1).trim() : text;
          const bubbleClass = speaker.toLowerCase().includes('user') ? 'user' : 'assistant';
          return `<div class="chat-bubble ${bubbleClass}">
            ${speaker ? `<strong>${esc(speaker)}</strong>` : ''}
            <p>${esc(content)}</p>
          </div>`;
        }).join('')}
      </div>
    </article>
    <div class="interaction-visual">
      ${imageSlot(slide, target, 'Interaction visual', 'Tablet/phone mockup with mascot overlap', '4:3')}
    </div>
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderBusinessImpact(slide, theme, deckData) {
  const target = fieldForType(slide);
  const impacts = ensureItems(slide.impacts, [
    'Increase conversion',
    'Reduce support load',
    'Boost engagement',
    'Strengthen brand recall'
  ]).slice(0, 4);

  const body = `<div class="impact-layout">
    <article class="impact-headline panel" ${attrTarget(target, `${slide.title} headline`)}>
      <h3>Measured outcomes in one view</h3>
    </article>
    <div class="impact-grid" ${attrTarget(target, `${slide.title} impacts`)}>
      ${impacts.map((impact) => `<article class="panel impact-card"><p>${esc(impact)}</p></article>`).join('')}
    </div>
    ${imageSlot(slide, target, 'Impact visual', 'Bold icon-style visual for business outcomes', '16:9', 'compact-slot')}
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderDataAnalytics(slide, theme, deckData) {
  const target = fieldForType(slide);
  const bullets = ensureItems(slide.bullets, ['Live dashboard', 'Top trends', 'Conversation summaries']).slice(0, 7);

  const body = `<div class="split-layout">
    <article class="panel text-panel">
      <p class="panel-lead" ${attrTarget('analyticsDescription', `${slide.title} description`)}>${esc(slide.description || '')}</p>
      <ul ${attrTarget(target, `${slide.title} bullets`)}>
        ${bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join('')}
      </ul>
    </article>
    ${imageSlot(slide, target, 'Analytics image', 'Dashboard mockup with clean charts', '4:3')}
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderWhatYouGet(slide, theme, deckData) {
  const target = fieldForType(slide);
  const sections = ensureItems(slide.sections, [
    { title: 'Deliverable one', bullets: ['Item', 'Item', 'Item'] },
    { title: 'Deliverable two', bullets: ['Item', 'Item', 'Item'] },
    { title: 'Deliverable three', bullets: ['Item', 'Item', 'Item'] },
    { title: 'Deliverable four', bullets: ['Item', 'Item', 'Item'] }
  ]).slice(0, 4);

  const body = `<div class="deliverables-grid" ${attrTarget(target, `${slide.title} sections`)}>
    ${sections.map((section, index) => `<article class="panel deliverable-card">
      ${imageSlot(slide, target, `${slide.title} visual ${index + 1}`, `${section.title} visual cue`, '1:1', 'micro-slot')}
      <h3>${esc(section.title || '')}</h3>
      <ul>
        ${ensureItems(section.bullets, []).slice(0, 4).map((bullet) => `<li>${esc(bullet)}</li>`).join('')}
      </ul>
    </article>`).join('')}
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderPricing(slide, theme, deckData) {
  const target = fieldForType(slide);
  const tiers = ensureItems(slide.packages, [
    { name: 'Basic', price: 'EUR 2.600,-', description: 'Template mascot;core flows;launch support' },
    { name: 'Premium', price: 'EUR 24.000,-', description: 'Custom mascot;advanced flows;LLM integration' },
    { name: 'Pro', price: 'EUR 38.000,-', description: 'Voice support;analytics suite;media package' }
  ]).slice(0, 3);

  const body = `<div class="pricing-stack">
    <div class="pricing-headline">
      <p>Flexible solutions</p>
      <h3>Pricing That Fits <span>Your Vision</span></h3>
    </div>
    <div class="pricing-grid" ${attrTarget(target, `${slide.title} pricing`)}>
      ${tiers.map((tier, i) => `<article class="panel pricing-card ${i === 1 ? 'featured' : ''} ${i === 2 ? 'dark-tier' : ''}">
        <h4>${esc(tier.name || '')}</h4>
        <p class="price">${esc(tier.price || '')}</p>
        <ul>
          ${splitFeatureLines(tier.description).map((line) => `<li>${esc(line)}</li>`).join('')}
        </ul>
      </article>`).join('')}
    </div>
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderTimeline(slide, theme, deckData) {
  const target = fieldForType(slide);
  const phases = ensureItems(slide.phases, [
    { title: 'Month 1', description: 'Discovery and concept.' },
    { title: 'Month 2', description: 'Design and production.' },
    { title: 'Month 3', description: 'Integration and launch.' }
  ]).slice(0, 4);

  const body = `<div class="timeline-stack">
    <div class="timeline-row" ${attrTarget(target, `${slide.title} phases`)}>
      ${phases.map((phase, i) => `<article class="panel timeline-card">
        <p class="phase-id">${String(i + 1).padStart(2, '0')}</p>
        <h3>${esc(phase.title || '')}</h3>
        <p>${esc(phase.description || '')}</p>
      </article>`).join('')}
    </div>
    ${imageSlot(slide, target, 'Timeline visual', 'Roadmap visual showing phase handoff', '16:9', 'compact-slot')}
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function renderClosing(slide, theme, deckData) {
  const target = fieldForType(slide);
  const team = ensureItems(slide.team, [
    { title: 'Strategy Lead', description: 'Vision and scope' },
    { title: 'Conversation Design', description: 'Flow quality' },
    { title: 'Motion Design', description: 'Character polish' },
    { title: 'Implementation', description: 'Launch delivery' }
  ]).slice(0, 4);

  const body = `<div class="split-layout closing-layout">
    <article class="panel closing-copy">
      <h3 ${attrTarget(target, 'Closing headline')}>${esc(slide.headline || slide.title || 'Let’s build this')}</h3>
      <p ${attrTarget(target, 'Closing text')}>${esc(slide.text || '')}</p>
      <div class="closing-contact">
        <p ${attrTarget('contactName', 'Contact name')}>${esc(slide.contactName || '')}</p>
        <p ${attrTarget('contactEmail', 'Contact email')}>${esc(slide.contactEmail || '')}</p>
        <p ${attrTarget('contactPhone', 'Contact phone')}>${esc(slide.contactPhone || '')}</p>
      </div>
    </article>
    <div class="closing-visuals">
      ${imageSlot(slide, target, 'Closing image', 'Mascot hero visual with confident CTA', '4:3')}
      <div class="card-grid two-by-two compact-grid" ${attrTarget('teamCards', 'Team cards')}>
        ${team.map((item) => `<article class="panel team-card">
          <h4>${esc(item.title || '')}</h4>
          <p>${esc(item.description || '')}</p>
        </article>`).join('')}
      </div>
    </div>
  </div>`;

  return frame(slide, theme, deckData, target, body);
}

function resolveTheme(theme, deckData) {
  return deckData?.deckTheme || theme || deckData?.theme || {};
}

export function renderSlide(slide, theme, deckData) {
  const t = resolveTheme(theme, deckData);

  switch (slide.type) {
    case 'cover':
      return renderCover(slide, t, deckData);
    case 'problem':
      return renderProblem(slide, t, deckData);
    case 'opportunity':
      return renderOpportunity(slide, t, deckData);
    case 'solution':
      return renderSolution(slide, t, deckData);
    case 'what-notso-does':
      return renderWhatNotsoDoes(slide, t, deckData);
    case 'meet-buddy':
      return renderMeetBuddy(slide, t, deckData);
    case 'experience-concept':
      return renderExperienceConcept(slide, t, deckData);
    case 'chat-flow':
      return renderChatFlow(slide, t, deckData);
    case 'example-interaction':
      return renderExampleInteraction(slide, t, deckData);
    case 'business-impact':
      return renderBusinessImpact(slide, t, deckData);
    case 'data-analytics':
      return renderDataAnalytics(slide, t, deckData);
    case 'what-you-get':
      return renderWhatYouGet(slide, t, deckData);
    case 'pricing':
      return renderPricing(slide, t, deckData);
    case 'timeline':
      return renderTimeline(slide, t, deckData);
    case 'closing':
      return renderClosing(slide, t, deckData);
    default:
      return `<article class="slide-render deck-slide mode-light" style="${themeVars(t)}">
        <section class="deck-content" style="display:grid;place-items:center;">
          <p>Unknown slide type: ${esc(slide.type || 'n/a')}</p>
        </section>
      </article>`;
  }
}
