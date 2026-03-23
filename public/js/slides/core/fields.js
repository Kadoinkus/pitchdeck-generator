export function getTargetField(slide) {
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
