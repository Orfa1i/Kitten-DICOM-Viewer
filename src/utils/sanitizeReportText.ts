/**
 * Clinical Findings Report Sanitizer & Parser
 * 
 * Safely parses AI-generated radiograph analysis text into structured clinical sections:
 * 1. Overall Impression
 * 2. Key Observations (with bulleted labels and descriptions)
 * 3. Limitations (visually secondary)
 * 4. Disclaimer
 *
 * Strips model artifacts (e.g. <end_of_turn>, <eos>) and normalizes markdown formatting.
 */

export interface ParsedObservation {
  label?: string;
  text: string;
}

export interface ParsedClinicalReport {
  overallImpression: string | null;
  keyObservations: ParsedObservation[];
  limitations: string[];
  disclaimer: string;
  rawSanitizedText: string;
  hasStructuredSections: boolean;
}

const DEFAULT_DISCLAIMER =
  'AI-generated preliminary read. For review by a qualified radiologist or physician.';

/**
 * Strips leaked model tokens, special tags, and trailing conversational artifacts.
 */
export function stripSpecialTokens(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  return (
    raw
      // Leaked special tokens from LLM architectures (MedGemma, Gemma, LLaMA, etc.)
      .replace(/<unused94>[\s\S]*?<unused95>/gi, '')
      .replace(/<end_of_turn>/gi, '')
      .replace(/<start_of_turn>/gi, '')
      .replace(/<eos>/gi, '')
      .replace(/<\/s>/gi, '')
      .replace(/<s>/gi, '')
      .replace(/<unused\d+>/gi, '')
      .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
      // Strip carriage returns and normalize newlines
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive consecutive empty lines
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Normalizes bullet points and extracts bold prefix labels.
 * Example: "* **Lung fields:** Mild opacity" -> label: "Lung fields:", text: "Mild opacity"
 * Example: "* Lung fields: Mild opacity" -> label: "Lung fields:", text: "Mild opacity"
 */
export function parseObservationItem(line: string): ParsedObservation {
  const cleaned = line.trim().replace(/^[*•\-\d\.]+\s+/, '').trim();

  // Match "**Label:** description" or "**Label**: description" or "Label: description"
  const labelWithMarkdownMatch = cleaned.match(/^\*\*([^*]+)\*\*[:\-]?\s*(.*)$/);
  if (labelWithMarkdownMatch) {
    const rawLabel = labelWithMarkdownMatch[1].trim();
    const cleanLabel = rawLabel.endsWith(':') ? rawLabel : `${rawLabel}:`;
    return {
      label: cleanLabel,
      text: labelWithMarkdownMatch[2].trim(),
    };
  }

  // Match "Label: description" where label is short (e.g. 1 to 4 words before a colon)
  const plainColonMatch = cleaned.match(/^([A-Za-z0-9\s\/\(\)\-]{2,35}):\s+(.+)$/);
  if (plainColonMatch) {
    return {
      label: `${plainColonMatch[1].trim()}:`,
      text: plainColonMatch[2].trim(),
    };
  }

  return {
    text: cleaned,
  };
}

/**
 * Splits observation or limitation text into individual bullet items.
 */
export function splitIntoBulletItems(sectionText: string): string[] {
  if (!sectionText) return [];

  const rawLines = sectionText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const items: string[] = [];
  let currentItem = '';

  for (const line of rawLines) {
    const isBulletStart = /^([*•\-]|\d+[\.\)])\s+/.test(line);

    if (isBulletStart) {
      if (currentItem) {
        items.push(currentItem);
      }
      currentItem = line;
    } else if (currentItem) {
      // Continuation of previous bullet
      currentItem += ` ${line}`;
    } else {
      currentItem = line;
    }
  }

  if (currentItem) {
    items.push(currentItem);
  }

  // If no bullet markers were found, split by sentence or treat as single paragraph items
  if (items.length <= 1 && sectionText.includes('. ')) {
    const sentences = sectionText
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
    if (sentences.length > 1) {
      return sentences;
    }
  }

  return items;
}

/**
 * Parses raw report string or string array into a structured clinical report object.
 */
export function sanitizeReportText(
  input?: string | string[] | null
): ParsedClinicalReport {
  if (!input) {
    return {
      overallImpression: null,
      keyObservations: [],
      limitations: [],
      disclaimer: DEFAULT_DISCLAIMER,
      rawSanitizedText: '',
      hasStructuredSections: false,
    };
  }

  const rawJoined = Array.isArray(input) ? input.join('\n\n') : input;
  const sanitized = stripSpecialTokens(rawJoined);

  if (!sanitized) {
    return {
      overallImpression: null,
      keyObservations: [],
      limitations: [],
      disclaimer: DEFAULT_DISCLAIMER,
      rawSanitizedText: '',
      hasStructuredSections: false,
    };
  }

  // Regex patterns to detect the 3 standard clinical sections
  // Section 1: Overall Impression
  const impressionRegex =
    /(?:^|\n)\s*(?:\*{0,2}(?:1[\.\)]\s*)?(?:Overall\s+Impression|Clinical\s+Impression|Impression)\*{0,2}[:\-]?)\s*([\s\S]*?)(?=(?:\n\s*\*{0,2}(?:2[\.\)]\s*)?(?:Key\s+Observations|Detailed\s+Findings|Findings|Observations|3[\.\)]\s*Limitations|Study\s+Limitations|Limitations)\*{0,2}[:\-]?)|\s*$)/i;

  // Section 2: Key Observations / Detailed Findings
  const observationsRegex =
    /(?:^|\n)\s*(?:\*{0,2}(?:2[\.\)]\s*)?(?:Key\s+Observations|Detailed\s+Findings|Findings|Observations)\*{0,2}[:\-]?)\s*([\s\S]*?)(?=(?:\n\s*\*{0,2}(?:3[\.\)]\s*)?(?:Study\s+Limitations|Technical\s+Limitations|Limitations)\*{0,2}[:\-]?)|\s*$)/i;

  // Section 3: Limitations
  const limitationsRegex =
    /(?:^|\n)\s*(?:\*{0,2}(?:3[\.\)]\s*)?(?:Study\s+Limitations|Technical\s+Limitations|Limitations)\*{0,2}[:\-]?)\s*([\s\S]*?)$/i;

  const impressionMatch = sanitized.match(impressionRegex);
  const observationsMatch = sanitized.match(observationsRegex);
  const limitationsMatch = sanitized.match(limitationsRegex);

  const hasImpression = !!impressionMatch && impressionMatch[1]?.trim().length > 0;
  const hasObservations = !!observationsMatch && observationsMatch[1]?.trim().length > 0;
  const hasLimitations = !!limitationsMatch && limitationsMatch[1]?.trim().length > 0;

  const hasStructuredSections = hasImpression || hasObservations || hasLimitations;

  const overallImpression = hasImpression
    ? impressionMatch![1].trim()
    : null;

  const rawObservations = hasObservations
    ? observationsMatch![1].trim()
    : '';

  const rawLimitations = hasLimitations
    ? limitationsMatch![1].trim()
    : '';

  const observationBullets = splitIntoBulletItems(rawObservations);
  const parsedObservations: ParsedObservation[] = observationBullets.map(
    parseObservationItem
  );

  const limitationBullets = splitIntoBulletItems(rawLimitations).map((item) =>
    item.replace(/^[*•\-\d\.]+\s+/, '').trim()
  );

  return {
    overallImpression,
    keyObservations: parsedObservations,
    limitations: limitationBullets,
    disclaimer: DEFAULT_DISCLAIMER,
    rawSanitizedText: sanitized,
    hasStructuredSections,
  };
}
