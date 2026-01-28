/**
 * IMG-005: Image Prompt Template Manager
 * Use predefined templates to generate consistent image prompts
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const TEMPLATES_DIR = 'data/prompts';

interface PromptTemplate {
  id: string;
  category: string;
  name: string;
  description: string;
  template: string;
  variables: Record<string, VariableDefinition>;
  examples: string[];
  tags: string[];
  aspectRatio: string;
  recommendedSize: string;
}

interface VariableDefinition {
  type: 'enum' | 'string';
  options?: string[];
  default: string;
}

/**
 * Load a template by category and ID
 */
async function loadTemplate(category: string, id: string): Promise<PromptTemplate> {
  const templatePath = path.join(TEMPLATES_DIR, category, `${id}.json`);

  try {
    const content = await fs.readFile(templatePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Template not found: ${category}/${id}`);
  }
}

/**
 * Render a template with provided variables
 */
function renderTemplate(
  template: PromptTemplate,
  variables: Record<string, string> = {}
): string {
  let prompt = template.template;

  // Merge provided variables with defaults
  const allVariables: Record<string, string> = {};

  for (const [key, def] of Object.entries(template.variables)) {
    allVariables[key] = variables[key] || def.default;
  }

  // Substitute variables
  for (const [key, value] of Object.entries(allVariables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return prompt;
}

/**
 * List all available templates
 */
async function listTemplates(): Promise<void> {
  console.log('\nAvailable Prompt Templates\n');

  try {
    const categories = await fs.readdir(TEMPLATES_DIR);

    for (const category of categories) {
      const categoryPath = path.join(TEMPLATES_DIR, category);
      const stat = await fs.stat(categoryPath);

      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(categoryPath);
      const templates = files.filter(f => f.endsWith('.json'));

      if (templates.length > 0) {
        console.log(`\n${category}/`);
        console.log('-'.repeat(60));

        for (const file of templates) {
          const template = await loadTemplate(category, file.replace('.json', ''));
          console.log(`  ${template.id.padEnd(30)} ${template.name}`);
          console.log(`    ${template.description}`);
          console.log('');
        }
      }
    }
  } catch (error) {
    console.error('Error listing templates:', error);
  }
}

/**
 * Show template details
 */
async function showTemplate(category: string, id: string): Promise<void> {
  try {
    const template = await loadTemplate(category, id);

    console.log('\n' + '='.repeat(60));
    console.log(`Template: ${template.name}`);
    console.log('='.repeat(60));
    console.log(`\nCategory: ${template.category}`);
    console.log(`ID: ${template.id}`);
    console.log(`Description: ${template.description}`);
    console.log(`\nAspect Ratio: ${template.aspectRatio}`);
    console.log(`Recommended Size: ${template.recommendedSize}`);
    console.log(`Tags: ${template.tags.join(', ')}`);

    console.log('\n' + '-'.repeat(60));
    console.log('Variables:');
    console.log('-'.repeat(60));

    for (const [key, def] of Object.entries(template.variables)) {
      console.log(`\n${key}:`);
      console.log(`  Type: ${def.type}`);
      console.log(`  Default: ${def.default}`);

      if (def.options) {
        console.log(`  Options:`);
        for (const option of def.options) {
          console.log(`    - ${option}`);
        }
      }
    }

    console.log('\n' + '-'.repeat(60));
    console.log('Template:');
    console.log('-'.repeat(60));
    console.log(template.template);

    console.log('\n' + '-'.repeat(60));
    console.log('Examples:');
    console.log('-'.repeat(60));

    for (let i = 0; i < template.examples.length; i++) {
      console.log(`\nExample ${i + 1}:`);
      console.log(template.examples[i]);
    }

    console.log('\n' + '='.repeat(60) + '\n');
  } catch (error) {
    console.error('Error loading template:', error);
    process.exit(1);
  }
}

/**
 * Render template with variables
 */
async function useTemplate(
  category: string,
  id: string,
  variables: Record<string, string>
): Promise<void> {
  try {
    const template = await loadTemplate(category, id);
    const prompt = renderTemplate(template, variables);

    console.log('\nRendered Prompt:');
    console.log('-'.repeat(60));
    console.log(prompt);
    console.log('-'.repeat(60));
    console.log(`\nRecommended size: ${template.recommendedSize}`);
    console.log(`Aspect ratio: ${template.aspectRatio}\n`);
  } catch (error) {
    console.error('Error rendering template:', error);
    process.exit(1);
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    console.log(`
Image Prompt Template Manager

Usage:
  npm run use-template <command> [options]

Commands:
  list                          List all available templates
  show <category> <id>          Show template details
  use <category> <id> [vars]    Render template with variables
  help                          Show this help message

Examples:
  # List all templates
  npm run use-template list

  # Show template details
  npm run use-template show backgrounds modern-office

  # Use template with default values
  npm run use-template use backgrounds modern-office

  # Use template with custom variables
  npm run use-template use backgrounds modern-office \\
    lighting="warm ambient lighting" \\
    view="nature view with trees"

Variable Format:
  key="value" key2="value2"
    `);
    return;
  }

  try {
    switch (command) {
      case 'list':
        await listTemplates();
        break;

      case 'show': {
        const category = args[1];
        const id = args[2];

        if (!category || !id) {
          console.error('Error: category and id required');
          console.log('Usage: npm run use-template show <category> <id>');
          process.exit(1);
        }

        await showTemplate(category, id);
        break;
      }

      case 'use': {
        const category = args[1];
        const id = args[2];

        if (!category || !id) {
          console.error('Error: category and id required');
          console.log('Usage: npm run use-template use <category> <id> [variables]');
          process.exit(1);
        }

        // Parse variables from remaining args
        const variables: Record<string, string> = {};

        for (let i = 3; i < args.length; i++) {
          const match = args[i].match(/^([^=]+)=(.+)$/);
          if (match) {
            variables[match[1]] = match[2].replace(/^["']|["']$/g, '');
          }
        }

        await useTemplate(category, id, variables);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.log('Run "npm run use-template help" for usage');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Export for use as module
export { loadTemplate, renderTemplate, listTemplates, showTemplate, useTemplate };

// Run if called directly
if (require.main === module) {
  main();
}
