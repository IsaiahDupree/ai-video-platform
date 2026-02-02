/**
 * Mark feature as complete in feature_list.json
 */

import fs from 'fs';
import path from 'path';

const featureId = process.argv[2];
const notes = process.argv[3] || 'Implemented and tested';

if (!featureId) {
  console.error('Usage: npx tsx scripts/mark-feature-complete.ts <feature-id> [notes]');
  process.exit(1);
}

const featureListPath = path.join(process.cwd(), 'feature_list.json');
const featureList = JSON.parse(fs.readFileSync(featureListPath, 'utf-8'));

// Find and update feature
const feature = featureList.features.find((f: any) => f.id === featureId);
if (!feature) {
  console.error(`Feature not found: ${featureId}`);
  process.exit(1);
}

console.log(`Marking feature ${featureId} as complete...`);
console.log(`Name: ${feature.name}`);
console.log(`Category: ${feature.category}`);
console.log(`Priority: ${feature.priority}`);

feature.passes = true;
feature.notes = notes;

// Update stats
const completed = featureList.features.filter((f: any) => f.passes).length;
const total = featureList.features.length;
const percentage = ((completed / total) * 100).toFixed(1);

featureList.completedFeatures = completed;
featureList.completionPercentage = parseFloat(percentage);
featureList.lastUpdated = new Date().toISOString().split('T')[0];

// Write back
fs.writeFileSync(featureListPath, JSON.stringify(featureList, null, 2));

console.log(`✅ Feature ${featureId} marked as complete`);
console.log(`📊 Project completion: ${completed}/${total} (${percentage}%)`);
