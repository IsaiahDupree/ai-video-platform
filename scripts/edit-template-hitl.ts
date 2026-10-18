#!/usr/bin/env tsx
/**
 * Human-in-the-Loop Template Editor CLI
 *
 * Interactive CLI tool for editing extracted templates.
 * Provides a lightweight interface for correcting AI extraction mistakes.
 *
 * Usage:
 *   npm run edit:template <templateId>
 *   tsx scripts/edit-template-hitl.ts <templateId>
 *
 * Features:
 * - Load template from storage
 * - View layers and properties
 * - Edit layer properties (position, dimensions, style)
 * - Create/delete layers
 * - Reorder layers (z-index)
 * - Undo/redo support
 * - Validation and confidence scoring
 * - Save edited template
 */

import readline from 'readline';
import { HITLEditor, createEditSession, type LayerUpdatePayload } from '../src/ad-templates/editing/hitl-editor';
import { TemplateStorage } from '../src/ad-templates/ingestion/template-storage';
import type { Layer, TextLayer, ImageLayer, ShapeLayer } from '../src/ad-templates/schema/template-dsl';

// =============================================================================
// CLI Interface
// =============================================================================

class HITLEditorCLI {
  private editor: HITLEditor | null = null;
  private storage: TemplateStorage;
  private rl: readline.Interface;
  private templateId: string | null = null;

  constructor() {
    this.storage = new TemplateStorage();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'hitl> ',
    });
  }

  async start(templateId: string): Promise<void> {
    console.log('🎨 Human-in-the-Loop Template Editor\n');

    try {
      // Load template
      await this.storage.initialize();
      const stored = await this.storage.loadTemplate(templateId);
      if (!stored) {
        console.error(`❌ Template '${templateId}' not found`);
        process.exit(1);
      }

      this.templateId = templateId;
      this.editor = createEditSession(stored.template);

      console.log(`✅ Loaded template: ${templateId}`);
      console.log(`   Canvas: ${stored.template.canvas.width}x${stored.template.canvas.height}`);
      console.log(`   Layers: ${stored.template.layers.length}\n`);

      // Show initial confidence report
      this.showConfidenceReport();

      // Show help
      this.showHelp();

      // Start interactive loop
      this.rl.prompt();
      this.rl.on('line', (line) => this.handleCommand(line.trim()));
      this.rl.on('close', () => this.handleExit());
    } catch (error) {
      console.error('❌ Error loading template:', error);
      process.exit(1);
    }
  }

  private async handleCommand(input: string): Promise<void> {
    const [cmd, ...args] = input.split(' ');

    try {
      switch (cmd.toLowerCase()) {
        case 'help':
        case 'h':
          this.showHelp();
          break;

        case 'list':
        case 'ls':
          this.listLayers();
          break;

        case 'show':
        case 'view':
          if (args.length === 0) {
            console.log('Usage: show <layerId>');
          } else {
            this.showLayer(args[0]);
          }
          break;

        case 'update':
          this.promptLayerUpdate();
          break;

        case 'create':
          this.promptCreateLayer();
          break;

        case 'delete':
        case 'rm':
          if (args.length === 0) {
            console.log('Usage: delete <layerId>');
          } else {
            this.deleteLayer(args[0]);
          }
          break;

        case 'reorder':
          if (args.length < 2) {
            console.log('Usage: reorder <layerId> <newZIndex>');
          } else {
            this.reorderLayer(args[0], parseInt(args[1], 10));
          }
          break;

        case 'undo':
          this.undo();
          break;

        case 'redo':
          this.redo();
          break;

        case 'history':
          this.showHistory();
          break;

        case 'diff':
          this.showDiff();
          break;

        case 'validate':
          this.validate();
          break;

        case 'confidence':
          this.showConfidenceReport();
          break;

        case 'save':
          await this.save();
          break;

        case 'exit':
        case 'quit':
          this.handleExit();
          return;

        case '':
          // Empty command, just reprompt
          break;

        default:
          console.log(`Unknown command: ${cmd}`);
          console.log('Type "help" for available commands');
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
    }

    this.rl.prompt();
  }

  private showHelp(): void {
    console.log('\n📖 Available Commands:\n');
    console.log('  Navigation & Viewing:');
    console.log('    list, ls              - List all layers');
    console.log('    show <layerId>        - Show layer details');
    console.log('    confidence            - Show confidence report');
    console.log('\n  Editing:');
    console.log('    update                - Update layer properties (interactive)');
    console.log('    create                - Create new layer (interactive)');
    console.log('    delete <layerId>      - Delete layer');
    console.log('    reorder <id> <z>      - Change layer z-index');
    console.log('\n  History:');
    console.log('    undo                  - Undo last operation');
    console.log('    redo                  - Redo operation');
    console.log('    history               - Show edit history');
    console.log('    diff                  - Show changes from original');
    console.log('\n  Validation & Export:');
    console.log('    validate              - Validate template');
    console.log('    save                  - Save edited template');
    console.log('    exit, quit            - Exit editor');
    console.log();
  }

  private listLayers(): void {
    if (!this.editor) return;

    const layers = this.editor.getAllLayers();
    console.log(`\n📋 Layers (${layers.length}):\n`);

    for (const layer of layers) {
      const typeEmoji = {
        text: '📝',
        image: '🖼️',
        shape: '🔶',
      }[layer.type];

      console.log(`  ${typeEmoji} [${layer.id}] (z=${layer.z})`);
      console.log(`     Type: ${layer.type}`);
      console.log(`     Rect: x=${layer.rect.x}, y=${layer.rect.y}, w=${layer.rect.w}, h=${layer.rect.h}`);
      if (layer.bind) {
        const bindKey = layer.bind.textKey || layer.bind.assetKey;
        console.log(`     Bind: ${bindKey}`);
      }
      console.log();
    }
  }

  private showLayer(layerId: string): void {
    if (!this.editor) return;

    const layer = this.editor.getLayer(layerId);
    if (!layer) {
      console.log(`❌ Layer '${layerId}' not found`);
      return;
    }

    console.log(`\n🔍 Layer Details: ${layerId}\n`);
    console.log(JSON.stringify(layer, null, 2));
    console.log();
  }

  private promptLayerUpdate(): void {
    if (!this.editor) return;

    console.log('\n✏️  Update Layer\n');
    this.rl.question('Layer ID: ', (layerId) => {
      const layer = this.editor!.getLayer(layerId);
      if (!layer) {
        console.log(`❌ Layer '${layerId}' not found`);
        this.rl.prompt();
        return;
      }

      console.log('What to update? (x/y/w/h/fontSize/color/etc., or "cancel")');
      this.rl.question('Property: ', (property) => {
        if (property === 'cancel') {
          this.rl.prompt();
          return;
        }

        this.rl.question('New value: ', (value) => {
          const updates: LayerUpdatePayload = {
            layerId,
            updates: {},
          };

          // Parse property and value
          if (['x', 'y', 'w', 'h'].includes(property)) {
            updates.updates.rect = { [property]: parseFloat(value) };
          } else if (layer.type === 'text' && ['fontSize', 'fontWeight', 'color', 'align', 'valign'].includes(property)) {
            updates.updates.text = {
              [property]: property === 'fontSize' || property === 'fontWeight' ? parseFloat(value) : value,
            } as any;
          } else {
            console.log(`⚠️  Property '${property}' not supported yet`);
            this.rl.prompt();
            return;
          }

          const result = this.editor!.updateLayer(updates);
          if (result.valid) {
            console.log('✅ Layer updated');
            if (result.warnings.length > 0) {
              console.log('⚠️  Warnings:');
              result.warnings.forEach((w) => console.log(`   - ${w.message}`));
            }
          } else {
            console.log('❌ Update failed:');
            result.errors.forEach((e) => console.log(`   - ${e.message}`));
          }

          this.rl.prompt();
        });
      });
    });
  }

  private promptCreateLayer(): void {
    if (!this.editor) return;

    console.log('\n➕ Create Layer\n');
    console.log('Not yet implemented. Use JSON editor for now.');
    this.rl.prompt();
  }

  private deleteLayer(layerId: string): void {
    if (!this.editor) return;

    const result = this.editor.deleteLayer(layerId);
    if (result.valid) {
      console.log(`✅ Deleted layer '${layerId}'`);
    } else {
      console.log('❌ Delete failed:');
      result.errors.forEach((e) => console.log(`   - ${e.message}`));
    }
  }

  private reorderLayer(layerId: string, newZIndex: number): void {
    if (!this.editor) return;

    const result = this.editor.reorderLayer(layerId, newZIndex);
    if (result.valid) {
      console.log(`✅ Reordered layer '${layerId}' to z=${newZIndex}`);
    } else {
      console.log('❌ Reorder failed:');
      result.errors.forEach((e) => console.log(`   - ${e.message}`));
    }
  }

  private undo(): void {
    if (!this.editor) return;

    if (this.editor.undo()) {
      console.log('⬅️  Undone');
    } else {
      console.log('⚠️  Nothing to undo');
    }
  }

  private redo(): void {
    if (!this.editor) return;

    if (this.editor.redo()) {
      console.log('➡️  Redone');
    } else {
      console.log('⚠️  Nothing to redo');
    }
  }

  private showHistory(): void {
    if (!this.editor) return;

    const history = this.editor.getOperationHistory();
    console.log(`\n📜 Edit History (${history.length} operations):\n`);

    for (const op of history) {
      const time = new Date(op.timestamp).toLocaleTimeString();
      console.log(`  [${time}] ${op.type.toUpperCase()}: ${op.description}`);
    }
    console.log();
  }

  private showDiff(): void {
    if (!this.editor) return;

    const diff = this.editor.getDiff();
    console.log('\n🔄 Changes from Original:\n');

    if (diff.added.length > 0) {
      console.log(`  ✅ Added (${diff.added.length}):`);
      diff.added.forEach((l) => console.log(`     - ${l.id} (${l.type})`));
    }

    if (diff.modified.length > 0) {
      console.log(`  ✏️  Modified (${diff.modified.length}):`);
      diff.modified.forEach((m) => console.log(`     - ${m.layerId}`));
    }

    if (diff.deleted.length > 0) {
      console.log(`  ❌ Deleted (${diff.deleted.length}):`);
      diff.deleted.forEach((l) => console.log(`     - ${l.id} (${l.type})`));
    }

    if (diff.added.length === 0 && diff.modified.length === 0 && diff.deleted.length === 0) {
      console.log('  No changes');
    }
    console.log();
  }

  private validate(): void {
    if (!this.editor) return;

    const result = this.editor.validateTemplate();
    console.log('\n✓ Validation Results:\n');

    if (result.valid) {
      console.log('  ✅ Template is valid');
    } else {
      console.log('  ❌ Template has errors:');
      result.errors.forEach((e) => {
        console.log(`     - [${e.code}] ${e.message}`);
        if (e.fix) {
          console.log(`       Fix: ${e.fix}`);
        }
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n  ⚠️  Warnings:');
      result.warnings.forEach((w) => {
        console.log(`     - [${w.code}] ${w.message}`);
        if (w.suggestion) {
          console.log(`       Suggestion: ${w.suggestion}`);
        }
      });
    }
    console.log();
  }

  private showConfidenceReport(): void {
    if (!this.editor) return;

    const report = this.editor.getConfidenceReport();
    console.log('\n🎯 Confidence Report:\n');
    console.log(`  Overall: ${(report.overallConfidence * 100).toFixed(1)}%`);
    console.log(`  High confidence layers: ${report.summary.highConfidence}`);
    console.log(`  Medium confidence layers: ${report.summary.mediumConfidence}`);
    console.log(`  Low confidence layers: ${report.summary.lowConfidence}`);
    console.log(`  Needs review: ${report.summary.needsReview ? 'Yes' : 'No'}`);

    if (report.recommendations.length > 0) {
      console.log('\n  💡 Recommendations:');
      report.recommendations.forEach((r) => console.log(`     - ${r}`));
    }
    console.log();
  }

  private async save(): Promise<void> {
    if (!this.editor || !this.templateId) return;

    // Validate before saving
    const validation = this.editor.validateTemplate();
    if (!validation.valid) {
      console.log('❌ Cannot save: template has validation errors');
      console.log('   Run "validate" to see details');
      return;
    }

    try {
      const template = this.editor.export();
      const stored = await this.storage.loadTemplate(this.templateId);
      if (!stored) {
        console.log('❌ Original template not found');
        return;
      }

      // Update template and metadata
      await this.storage.saveTemplate(this.templateId, template, stored.metadata, stored.referencePath);

      console.log('✅ Template saved successfully');

      // Show diff summary
      const diff = this.editor.getDiff();
      const changes = diff.added.length + diff.modified.length + diff.deleted.length;
      console.log(`   ${changes} changes applied`);
    } catch (error) {
      console.error('❌ Error saving template:', error);
    }
  }

  private handleExit(): void {
    if (this.editor && this.editor.hasUnsavedChanges()) {
      console.log('\n⚠️  You have unsaved changes!');
      this.rl.question('Save before exiting? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          await this.save();
        }
        console.log('👋 Goodbye!');
        process.exit(0);
      });
    } else {
      console.log('\n👋 Goodbye!');
      process.exit(0);
    }
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: tsx scripts/edit-template-hitl.ts <templateId>');
    console.log('\nExample:');
    console.log('  tsx scripts/edit-template-hitl.ts tpl_1080_square_v1');
    process.exit(1);
  }

  const templateId = args[0];
  const cli = new HITLEditorCLI();
  await cli.start(templateId);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
