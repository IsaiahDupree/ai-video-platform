import {makeProject} from '@motion-canvas/core';

import intro from './scenes/intro?scene';
import topic from './scenes/topic?scene';
import listItem from './scenes/listItem?scene';
import outro from './scenes/outro?scene';
import hybridDemo from './scenes/hybrid-demo?scene';
import benchmarkTest from './scenes/benchmark-test?scene';

export default makeProject({
  scenes: [benchmarkTest], // Use benchmark for testing
  // scenes: [hybridDemo], // Hybrid demo
  // scenes: [intro, topic, listItem, outro], // Original scenes
});
