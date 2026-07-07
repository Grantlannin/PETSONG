/**
 * Generate 10s landing page sample clips locally → public/samples/
 *
 * Usage: vercel env run --environment=production -- npm run generate:samples
 */
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { generateLandingSamplesToDisk } from '../lib/generate-landing-samples';

async function main() {
  await mkdir(join(process.cwd(), 'public', 'samples'), { recursive: true });
  const results = await generateLandingSamplesToDisk();
  await writeFile(
    join(process.cwd(), 'public', 'samples', 'meta.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('Done:', results.map((r) => r.publicUrl).join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
