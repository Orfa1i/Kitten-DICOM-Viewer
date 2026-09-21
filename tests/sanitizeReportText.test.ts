import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  stripSpecialTokens,
  parseObservationItem,
  splitIntoBulletItems,
  sanitizeReportText,
} from '../src/utils/sanitizeReportText.ts';

describe('Clinical Report Sanitizer & Parser Unit Tests', () => {
  it('should strip special tokens like <end_of_turn>, <eos>, <start_of_turn>, and <unused>', () => {
    const raw =
      'Normal examination.<end_of_turn>\n<unused94>thought process<unused95><eos><start_of_turn>';
    const cleaned = stripSpecialTokens(raw);
    assert.strictEqual(cleaned, 'Normal examination.');
    assert.doesNotMatch(cleaned, /<end_of_turn>/);
    assert.doesNotMatch(cleaned, /<eos>/);
  });

  it('should parse the user sample input with exact sections', () => {
    const sampleInput =
      '**Overall Impression:** The provided image appears to be a chest X-ray.\n' +
      '**Key Observations:** * The structures resembling lung fields appear hazy with subtle density variations.\n' +
      '* **Costophrenic angles:** Sharp and clearly defined.\n' +
      '**Limitations:** This assessment relies solely on visual inspection without patient history.<end_of_turn>';

    const parsed = sanitizeReportText(sampleInput);

    assert.strictEqual(parsed.hasStructuredSections, true);
    assert.ok(parsed.overallImpression);
    assert.match(
      parsed.overallImpression,
      /The provided image appears to be a chest X-ray/
    );

    assert.strictEqual(parsed.keyObservations.length, 2);
    assert.strictEqual(parsed.keyObservations[1].label, 'Costophrenic angles:');
    assert.strictEqual(
      parsed.keyObservations[1].text,
      'Sharp and clearly defined.'
    );

    assert.strictEqual(parsed.limitations.length, 1);
    assert.match(
      parsed.limitations[0],
      /This assessment relies solely on visual inspection/
    );
    assert.doesNotMatch(parsed.limitations[0], /<end_of_turn>/);

    assert.strictEqual(
      parsed.disclaimer,
      'AI-generated preliminary read. For review by a qualified radiologist or physician.'
    );
  });

  it('should extract bold and plain prefix labels from observation bullets', () => {
    const item1 = parseObservationItem('* **Lung fields:** Bilateral opacities');
    assert.strictEqual(item1.label, 'Lung fields:');
    assert.strictEqual(item1.text, 'Bilateral opacities');

    const item2 = parseObservationItem('- Osseous integrity: No fracture line seen');
    assert.strictEqual(item2.label, 'Osseous integrity:');
    assert.strictEqual(item2.text, 'No fracture line seen');

    const item3 = parseObservationItem('• Diffuse soft tissue swelling');
    assert.strictEqual(item3.label, undefined);
    assert.strictEqual(item3.text, 'Diffuse soft tissue swelling');
  });

  it('should split multi-bullet observation text cleanly', () => {
    const sectionText =
      '* First finding description\n* Second finding description with extra detail\n- Third finding';
    const items = splitIntoBulletItems(sectionText);
    assert.strictEqual(items.length, 3);
    assert.match(items[0], /First finding/);
    assert.match(items[1], /Second finding/);
    assert.match(items[2], /Third finding/);
  });

  it('should handle empty, null, or undefined input gracefully', () => {
    const empty1 = sanitizeReportText('');
    assert.strictEqual(empty1.overallImpression, null);
    assert.strictEqual(empty1.keyObservations.length, 0);
    assert.strictEqual(empty1.hasStructuredSections, false);

    const empty2 = sanitizeReportText(null);
    assert.strictEqual(empty2.overallImpression, null);
    assert.strictEqual(empty2.keyObservations.length, 0);

    const empty3 = sanitizeReportText(undefined);
    assert.strictEqual(empty3.overallImpression, null);
  });

  it('should handle unclassified plain text without dropping clinical content', () => {
    const unformatted =
      'Mild degenerative changes of the medial compartment of the right knee joint.';
    const parsed = sanitizeReportText(unformatted);
    assert.strictEqual(parsed.hasStructuredSections, false);
    assert.strictEqual(
      parsed.rawSanitizedText,
      'Mild degenerative changes of the medial compartment of the right knee joint.'
    );
    assert.strictEqual(parsed.overallImpression, null);
  });

  it('should accept array of findings as input and join them', () => {
    const findingsArray = [
      '**Overall Impression:** Moderate osteoarthritis.',
      '**Key Observations:** * Joint space narrowing medial compartment.',
      '**Limitations:** Single AP projection only.',
    ];
    const parsed = sanitizeReportText(findingsArray);
    assert.strictEqual(parsed.hasStructuredSections, true);
    assert.match(parsed.overallImpression || '', /Moderate osteoarthritis/);
    assert.strictEqual(parsed.keyObservations.length, 1);
    assert.strictEqual(parsed.limitations.length, 1);
  });
});
