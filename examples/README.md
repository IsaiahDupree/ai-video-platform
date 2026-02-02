# Remotion VideoStudio Examples

This directory contains example scripts demonstrating key features of the Remotion VideoStudio platform.

## Available Examples

### Canva Integration Example

Complete demonstration of the Canva ingestion pipeline.

**File:** `canva-integration-example.ts`

**Features:**
- Ingest single Canva design
- Ingest multiple pages
- Search and list templates
- Inspect template structure
- Update reference images
- Generate template variants

**Usage:**
```bash
# Run the complete workflow
npx tsx examples/canva-integration-example.ts

# Or run specific examples by uncommenting them in main()
```

**Requirements:**
- Set `CANVA_ACCESS_TOKEN` environment variable
- Have a Canva design ID ready

**What it demonstrates:**
1. **Ingestion** - Convert Canva design to TemplateDSL
2. **Storage** - Save template + metadata + reference PNG
3. **Search** - Find templates by source type, design ID, confidence
4. **Inspection** - Examine layers, bindings, and constraints
5. **Variants** - Generate different copy/image combinations

## Running Examples

### Prerequisites

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys
```

### Run an example

```bash
npx tsx examples/<example-name>.ts
```

## Example Output

### Canva Integration

```
============================================================
Canva Integration Examples
============================================================

=== Example 7: Complete Workflow ===

Step 1: Ingest Canva design...
[CanvaClient] Opening design session for design DAFxxxxxx
[CanvaClient] Exporting design DAFxxxxxx as PNG...
[CanvaClient] Export job created: job_12345
[CanvaClient] Export job completed successfully
[TemplateStorage] Initialized storage at data/templates
[TemplateStorage] Saved template canva_page_1_1234567890
✅ Template ingested: canva_page_1_1234567890

Step 2: Verify template storage...
✅ Template stored successfully
  - Metadata: yes
  - Reference: yes

Step 3: Inspect template structure...
  - Canvas: 1080x1080
  - Layers: 5
  - Text bindings: 3
  - Asset bindings: 1

Step 4: List all templates...
✅ Total templates: 1

✅ Workflow complete!

============================================================
Examples completed!
============================================================
```

## Contributing Examples

When adding new examples:

1. Create a new `.ts` file in this directory
2. Follow the existing naming convention: `<feature>-example.ts`
3. Include comprehensive JSDoc comments
4. Add usage instructions to this README
5. Test the example end-to-end

## Tips

- Keep examples focused on a single feature or workflow
- Include error handling and validation
- Log progress and results clearly
- Make examples self-contained (don't require external setup beyond env vars)
