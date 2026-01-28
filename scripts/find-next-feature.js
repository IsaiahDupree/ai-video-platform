const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const next = data.features.find(f => f.passes === false && (f.priority === 'P0' || f.priority === 'P1'));
if (next) {
  console.log(JSON.stringify(next, null, 2));
} else {
  console.log('No more P0/P1 features to implement!');
}
