import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseReport,
  stripSpecialTokens,
  cleanMarkdown,
  extractObservationLabel,
  checkStudyConsistency,
} from '../src/utils/reportParser.ts';

describe('Shared Report Parser Unit Tests', () => {
  const exactSampleInput =
    '**Overall Impression:** The provided image appears to be a chest X-ray or ' +
    'similar radiographic view of the thoracic region... **Key Observations:** ' +
    '* The structures resembling lung fields appear hazy... * There\'s no obvious ' +
    'evidence of large consolidation... However, without proper clinical context ' +
    'or comparison views, any interpretation should remain highly tentative. ' +
    '**Limitations:** This assessment relies solely on visual inspection... ' +
    'imagery.<end_of_turn>';

  it('should parse the exact sample input with NO *, **, or <end_of_turn>, and no empty items', () => {
    const parsed = parseReport(exactSampleInput);

    // 1. Check impression
    assert.ok(parsed.impression.length > 0, 'Impression should not be empty');
    assert.match(parsed.impression, /The provided image appears to be a chest X-ray/);

    // 2. Check observations
    assert.strictEqual(parsed.observations.length, 2, 'Should have 2 observations');
    assert.match(parsed.observations[0], /The structures resembling lung fields appear hazy/);
    assert.match(parsed.observations[1], /There's no obvious evidence of large consolidation/);
    // Ensure the trailing "However, ..." is kept attached to the second observation
    assert.match(parsed.observations[1], /However, without proper clinical context/);

    // 3. Check limitations
    assert.ok(parsed.limitations.length > 0, 'Limitations should not be empty');
    assert.match(parsed.limitations[0], /This assessment relies solely on visual inspection/);

    // 4. Verify ZERO *, **, or <end_of_turn> in any output field
    const allFields = [
      parsed.impression,
      ...parsed.observations,
      ...parsed.limitations,
    ];

    for (const text of allFields) {
      assert.strictEqual(text.includes('*'), false, `Text contains asterisk: "${text}"`);
      assert.strictEqual(text.includes('**'), false, `Text contains double asterisk: "${text}"`);
      assert.strictEqual(
        text.includes('<end_of_turn>'),
        false,
        `Text contains <end_of_turn>: "${text}"`
      );
      assert.ok(text.trim().length > 0, 'Item should not be empty');
    }
  });

  it('should handle missing sections gracefully without empty headings or errors', () => {
    const onlyImpression = '**Overall Impression:** Unremarkable bilateral radiographs.';
    const res1 = parseReport(onlyImpression);
    assert.strictEqual(res1.impression, 'Unremarkable bilateral radiographs.');
    assert.strictEqual(res1.observations.length, 0);
    assert.strictEqual(res1.limitations.length, 0);

    const onlyObservations =
      '**Key Observations:** * Linear cortical discontinuity along radial neck.';
    const res2 = parseReport(onlyObservations);
    assert.strictEqual(res2.impression, '');
    assert.strictEqual(res2.observations.length, 1);
    assert.strictEqual(res2.observations[0], 'Linear cortical discontinuity along radial neck.');
    assert.strictEqual(res2.limitations.length, 0);
  });

  it('should parse bullets using "-" and "•" correctly', () => {
    const inputWithMixedBullets =
      '**Key Observations:**\n' +
      '- First observation item.\n' +
      '• Second observation item with detail.\n' +
      '* Third observation item.';

    const parsed = parseReport(inputWithMixedBullets);
    assert.strictEqual(parsed.observations.length, 3);
    assert.strictEqual(parsed.observations[0], 'First observation item.');
    assert.strictEqual(parsed.observations[1], 'Second observation item with detail.');
    assert.strictEqual(parsed.observations[2], 'Third observation item.');
  });

  it('should handle ** appearing at the very start or end of the text', () => {
    const inputWithBorderAsterisks =
      '** **Overall Impression:** Clear lung parenchyma. **Key Observations:** * Intact ribs. **';
    const parsed = parseReport(inputWithBorderAsterisks);

    assert.strictEqual(parsed.impression, 'Clear lung parenchyma.');
    assert.strictEqual(parsed.observations.length, 1);
    assert.strictEqual(parsed.observations[0], 'Intact ribs.');
    assert.strictEqual(parsed.impression.includes('*'), false);
    assert.strictEqual(parsed.observations[0].includes('*'), false);
  });

  it('should handle completely empty input, null, or whitespace-only input', () => {
    const empty1 = parseReport('');
    assert.deepStrictEqual(empty1, { impression: '', observations: [], limitations: [] });

    const empty2 = parseReport(null);
    assert.deepStrictEqual(empty2, { impression: '', observations: [], limitations: [] });

    const empty3 = parseReport('   \n\t  ');
    assert.deepStrictEqual(empty3, { impression: '', observations: [], limitations: [] });

    const empty4 = parseReport('*** ***');
    assert.deepStrictEqual(empty4, { impression: '', observations: [], limitations: [] });
  });

  it('should extract observation labels cleanly', () => {
    const item1 = extractObservationLabel('Lung fields: Bilateral clear parenchyma');
    assert.strictEqual(item1.label, 'Lung fields:');
    assert.strictEqual(item1.text, 'Bilateral clear parenchyma');

    const item2 = extractObservationLabel('No focal consolidation or pneumothorax');
    assert.strictEqual(item2.label, undefined);
    assert.strictEqual(item2.text, 'No focal consolidation or pneumothorax');
  });

  it('should validate study title and anatomical findings consistency', () => {
    // Knee study with thoracic findings -> mismatch warning
    const check1 = checkStudyConsistency(
      'Knee Osteoarthritis Analysis',
      exactSampleInput
    );
    assert.strictEqual(check1.isMismatch, true);
    assert.strictEqual(
      check1.message,
      'Report title and findings may not refer to the same study. Please verify.'
    );

    // Knee study with knee findings -> valid
    const check2 = checkStudyConsistency(
      'Knee Osteoarthritis Analysis',
      'Overall Impression: KL Grade 3 osteoarthritis of the right knee with joint space narrowing.'
    );
    assert.strictEqual(check2.isMismatch, false);

    // Chest study with chest findings -> valid
    const check3 = checkStudyConsistency(
      'Chest Digital Radiography',
      exactSampleInput
    );
    assert.strictEqual(check3.isMismatch, false);
  });
});
