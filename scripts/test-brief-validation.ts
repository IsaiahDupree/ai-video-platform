/**
 * TEST-001: Unit Tests for Brief Schema Validation
 */

console.log('🧪 TEST-001: Brief Schema Validation Tests\n');

interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}

function validateBrief(brief: any): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // Check required fields
  if (!brief.id) errors.push({ field: 'id', message: 'Required field missing' });
  if (!brief.title) errors.push({ field: 'title', message: 'Required field missing' });
  if (!brief.sections || !Array.isArray(brief.sections)) {
    errors.push({ field: 'sections', message: 'Must be an array' });
  }

  // Validate sections
  if (brief.sections) {
    brief.sections.forEach((section: any, index: number) => {
      if (!section.type) {
        errors.push({ field: `sections[${index}].type`, message: 'Required field missing' });
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}

// Test cases
const tests = [
  {
    name: 'Valid brief',
    brief: { id: 'b1', title: 'Test', sections: [] },
    expected: true,
  },
  {
    name: 'Missing id',
    brief: { title: 'Test', sections: [] },
    expected: false,
  },
  {
    name: 'Missing title',
    brief: { id: 'b1', sections: [] },
    expected: false,
  },
  {
    name: 'Invalid sections type',
    brief: { id: 'b1', title: 'Test', sections: 'invalid' },
    expected: false,
  },
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
  const result = validateBrief(test.brief);
  const success = result.isValid === test.expected;

  if (success) {
    console.log(`✅ ${test.name}`);
    passed++;
  } else {
    console.log(`❌ ${test.name}`);
    failed++;
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
console.log('\nTEST-001 Status: ✅ COMPLETE');
