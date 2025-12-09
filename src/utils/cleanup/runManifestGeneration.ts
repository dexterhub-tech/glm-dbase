import { ManifestGenerator } from './manifestGenerator';

/**
 * Generate a comprehensive manifest of all archived files
 */
async function main() {
  console.log('Starting manifest generation...\n');
  
  const generator = new ManifestGenerator('docs/archived');
  
  try {
    const manifest = await generator.generateAndSave();
    generator.printSummary(manifest);
    
    console.log('✓ Manifest generation complete!');
    console.log(`✓ Manifest saved to: docs/archived/manifest.json`);
    
  } catch (error) {
    console.error('Error generating manifest:', error);
    process.exit(1);
  }
}

main();
