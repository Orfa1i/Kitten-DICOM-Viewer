/**
 * Shared AI Radiograph Report Parser & Study Validator
 *
 * Used synchronously across both:
 * (A) The Clinical Findings UI Panel
 * (B) The Branded Kitten Diagnostic PDF Generator
 *
 * Guarantees zero markdown leakage (**, *, __), zero model tokens (<end_of_turn>, <eos>),
 * no empty bullets, and strict preservation of all clinical terminology.
 */

export interface ParsedReport {
  impression: string;
  observations: string[];
  limitations: string[];
}

export interface ObservationDetail {
  label?: string;
  text: string;
}

export interface StudyConsistencyResult {
  isMismatch: boolean;
  message?: string;
}

export const AI_REPORT_DISCLAIMER =
  'AI-generated preliminary read. For review by a qualified radiologist or physician.';

/**
 * Strips model tokens, special markers, and internal thoughts anywhere in the text.
 */
export function stripSpecialTokens(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  return raw
    .replace(/<unused94>[\s\S]*?<unused95>/gi, '')
    .replace(/<end_of_turn>/gi, '')
    .replace(/<start_of_turn>/gi, '')
    .replace(/<eos>/gi, '')
    .replace(/<bos>/gi, '')
    .replace(/<\|.*?\|>/gi, '')
    .replace(/<\/?[a-z0-9_\-]+>/gi, '')
    .replace(/<unused\d+>/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Strips leftover markdown symbols (**, __, stray *) and cleans punctuation whitespace.
 */
export function cleanMarkdown(str: string): string {
  if (!str) return '';

  return stripSpecialTokens(str)
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/\*/g, '')
    .replace(/^[ \t]*[-•][ \t]*/, '')
    .trim();
}

/**
 * Returns true if a string contains actual alphanumeric clinical content,
 * rather than only punctuation, bullets, or asterisks.
 */
export function isMeaningful(str: string): boolean {
  if (!str) return false;
  const stripped = str.replace(/[\s*_\-•.,:;!?]/g, '');
  return stripped.length > 0;
}

/**
 * Extracts a bold prefix label from an observation bullet if present.
 * Example: "Lung fields: The structures..." -> { label: "Lung fields:", text: "The structures..." }
 */
export function extractObservationLabel(item: string): ObservationDetail {
  const cleaned = cleanMarkdown(item);

  // Match "Label: Description" where label is short (e.g. 2 to 35 chars)
  const match = cleaned.match(/^([A-Za-z0-9\s\/\(\)\-]{2,35}):\s+(.+)$/);
  if (match) {
    const rawLabel = match[1].trim();
    const label = rawLabel.endsWith(':') ? rawLabel : `${rawLabel}:`;
    return {
      label,
      text: match[2].trim(),
    };
  }

  return {
    text: cleaned,
  };
}

/**
 * Core shared parsing function for AI-generated radiograph reports.
 */
export function parseReport(rawInput?: string | string[] | null): ParsedReport {
  if (!rawInput) {
    return { impression: '', observations: [], limitations: [] };
  }

  const raw = Array.isArray(rawInput) ? rawInput.join('\n\n') : String(rawInput);
  const stripped = stripSpecialTokens(raw).trim();
  if (!stripped || !isMeaningful(stripped)) {
    return { impression: '', observations: [], limitations: [] };
  }

  // Tolerant heading regex matching common section variants
  const headingRegex =
    /\*{0,2}\s*(overall\s+impression|clinical\s+impression|impression|key\s+observations|detailed\s+findings|observations|findings|study\s+limitations|technical\s+limitations|limitations)\s*:?\s*\*{0,2}/gi;

  const matches: Array<{ name: string; index: number; end: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = headingRegex.exec(stripped)) !== null) {
    matches.push({
      name: m[1].toLowerCase().replace(/\s+/g, ' '),
      index: m.index,
      end: m.index + m[0].length,
    });
  }

  let rawImpression = '';
  let rawObservations = '';
  let rawLimitations = '';

  if (matches.length === 0) {
    // Unclassified report text: preserve as impression so no clinical content is lost
    rawImpression = stripped;
  } else {
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const nextStart = i + 1 < matches.length ? matches[i + 1].index : stripped.length;
      const content = stripped.slice(current.end, nextStart).trim();

      if (current.name.includes('impression')) {
        rawImpression = content;
      } else if (
        current.name.includes('observation') ||
        current.name.includes('finding')
      ) {
        rawObservations = content;
      } else if (current.name.includes('limitation')) {
        rawLimitations = content;
      }
    }
  }

  // 1. Overall Impression: clean and strip any stray formatting
  const impression = cleanMarkdown(rawImpression);

  // 2. Key Observations: split into bullets and discard empty items
  const observations: string[] = [];
  if (rawObservations) {
    const bulletSplitRegex = /(?:^|\n|\s+)[*•\-]\s+/;
    if (bulletSplitRegex.test(rawObservations)) {
      const parts = rawObservations.split(bulletSplitRegex);
      for (const part of parts) {
        const cleanedPart = cleanMarkdown(part);
        if (isMeaningful(cleanedPart)) {
          observations.push(cleanedPart);
        }
      }
    } else {
      const lines = rawObservations.split('\n').map(cleanMarkdown).filter(isMeaningful);
      observations.push(...lines);
    }
  }

  // 3. Limitations: split into sentences/bullets and discard empty items
  const limitations: string[] = [];
  if (rawLimitations) {
    const bulletSplitRegex = /(?:^|\n|\s+)[*•\-]\s+/;
    if (bulletSplitRegex.test(rawLimitations)) {
      const parts = rawLimitations.split(bulletSplitRegex);
      for (const part of parts) {
        const cleanedPart = cleanMarkdown(part);
        if (isMeaningful(cleanedPart)) {
          limitations.push(cleanedPart);
        }
      }
    } else {
      const sentences = rawLimitations.split(/(?<=[.!?])\s+(?=[A-Z])/);
      for (const sent of sentences) {
        const cleanedSent = cleanMarkdown(sent);
        if (isMeaningful(cleanedSent)) {
          limitations.push(cleanedSent);
        }
      }
    }
  }

  return {
    impression,
    observations,
    limitations,
  };
}

/**
 * Non-blocking anatomical consistency check comparing the study title with the report body.
 */
export function checkStudyConsistency(
  studyTitleOrType?: string,
  findingsText?: string | string[]
): StudyConsistencyResult {
  if (!studyTitleOrType || !findingsText) {
    return { isMismatch: false };
  }

  const titleLower = studyTitleOrType.toLowerCase();
  const textLower = (Array.isArray(findingsText) ? findingsText.join(' ') : findingsText).toLowerCase();

  const isKneeStudy = /knee|patella|tibiofemoral|meniscus|osteoarthritis/i.test(titleLower);
  const isChestStudy = /chest|thorac|lung|cardio|pulmonary|pleural/i.test(titleLower);

  const mentionsThoracic =
    /chest|thorac|lung|pleural|pneumo|ribs|diaphragm|cardiomegaly|aortic/i.test(textLower);
  const mentionsKnee =
    /knee|patella|tibiofemoral|femoral condyle|tibial plateau|meniscus|osteoarthritis|joint space narrowing/i.test(
      textLower
    );

  if (isKneeStudy && mentionsThoracic && !mentionsKnee) {
    console.warn(
      '[Study Consistency] WARNING: Report title indicates a Knee study, but findings describe thoracic/chest anatomy.'
    );
    return {
      isMismatch: true,
      message: 'Report title and findings may not refer to the same study. Please verify.',
    };
  }

  if (isChestStudy && mentionsKnee && !mentionsThoracic) {
    console.warn(
      '[Study Consistency] WARNING: Report title indicates a Chest study, but findings describe knee/lower limb anatomy.'
    );
    return {
      isMismatch: true,
      message: 'Report title and findings may not refer to the same study. Please verify.',
    };
  }

  return { isMismatch: false };
}
