/**
 * Deployment verification script
 * Run this before deploying to catch issues early
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'packages', 'web');

const errors = [];
const warnings = [];

function log(msg) {
  console.log(`✓ ${msg}`);
}

function error(msg) {
  console.error(`✗ ${msg}`);
  errors.push(msg);
}

function warn(msg) {
  console.warn(`⚠ ${msg}`);
  warnings.push(msg);
}

function fileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`${description} exists: ${path.relative(rootDir, filePath)}`);
    return true;
  } else {
    error(`${description} missing: ${path.relative(rootDir, filePath)}`);
    return false;
  }
}

function dirExists(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    log(`${description} exists: ${path.relative(rootDir, dirPath)}`);
    return true;
  } else {
    error(`${description} missing: ${path.relative(rootDir, dirPath)}`);
    return false;
  }
}

console.log('\n=== Deployment Verification ===\n');

// 1. Check essential files
console.log('--- Checking essential files ---');
fileExists(path.join(rootDir, 'Dockerfile'), 'Dockerfile');
fileExists(path.join(rootDir, 'fly.toml'), 'fly.toml');
fileExists(path.join(rootDir, 'package.json'), 'Root package.json');
fileExists(path.join(rootDir, 'lerna.json'), 'lerna.json');

// 2. Check web package files
console.log('\n--- Checking web package ---');
fileExists(path.join(webDir, 'package.json'), 'Web package.json');
fileExists(path.join(webDir, 'server.js'), 'Server entry point');
fileExists(path.join(webDir, 'vite-express.js'), 'Vite Express helper');
dirExists(path.join(webDir, 'bin'), 'Bin directory');
fileExists(path.join(webDir, 'bin', 'flok-web.js'), 'CLI entry point');

// 3. Check package.json scripts
console.log('\n--- Checking package.json scripts ---');
const webPkg = JSON.parse(fs.readFileSync(path.join(webDir, 'package.json'), 'utf-8'));

if (webPkg.scripts?.start) {
  log(`Start script defined: ${webPkg.scripts.start}`);
} else {
  error('Start script missing in web package.json');
}

if (webPkg.scripts?.build) {
  log(`Build script defined: ${webPkg.scripts.build}`);
} else {
  error('Build script missing in web package.json');
}

// 4. Check workspace dependencies
console.log('\n--- Checking workspace dependencies ---');
const serverMiddlewarePkg = path.join(rootDir, 'packages', 'server-middleware', 'package.json');
const pubsubPkg = path.join(rootDir, 'packages', 'pubsub', 'package.json');

fileExists(serverMiddlewarePkg, 'server-middleware package.json');
fileExists(pubsubPkg, 'pubsub package.json');

// 5. Check if build outputs exist (if already built)
console.log('\n--- Checking build outputs (if built) ---');
const webDist = path.join(webDir, 'dist');
if (fs.existsSync(webDist)) {
  log('Web dist directory exists');
  
  // Check for index.html
  if (fs.existsSync(path.join(webDist, 'index.html'))) {
    log('index.html exists in dist');
  } else {
    warn('index.html not found in dist - run build first');
  }
} else {
  warn('Web dist directory does not exist - run build first');
}

const serverMiddlewareDist = path.join(rootDir, 'packages', 'server-middleware', 'dist');
if (fs.existsSync(serverMiddlewareDist)) {
  log('server-middleware dist exists');
} else {
  warn('server-middleware dist does not exist - run build first');
}

const pubsubDist = path.join(rootDir, 'packages', 'pubsub', 'dist');
if (fs.existsSync(pubsubDist)) {
  log('pubsub dist exists');
} else {
  warn('pubsub dist does not exist - run build first');
}

// 6. Check Dockerfile syntax by parsing it
console.log('\n--- Checking Dockerfile ---');
const dockerfile = fs.readFileSync(path.join(rootDir, 'Dockerfile'), 'utf-8');

if (dockerfile.includes('COPY --from=builder /app/packages/web/dist')) {
  log('Dockerfile copies web dist');
} else {
  error('Dockerfile missing web dist copy');
}

if (dockerfile.includes('COPY --from=builder /app/packages/web/bin')) {
  log('Dockerfile copies web bin');
} else {
  error('Dockerfile missing web bin copy');
}

if (dockerfile.includes('COPY --from=builder /app/packages/web/server.js')) {
  log('Dockerfile copies server.js');
} else {
  error('Dockerfile missing server.js copy');
}

if (dockerfile.includes('server-middleware/package.json') || dockerfile.includes('/app/packages/server-middleware')) {
  log('Dockerfile copies server-middleware package.json');
} else {
  error('Dockerfile missing server-middleware package.json copy');
}

if (dockerfile.includes('pubsub/package.json') || dockerfile.includes('/app/packages/pubsub')) {
  log('Dockerfile copies pubsub package.json');
} else {
  error('Dockerfile missing pubsub package.json copy');
}

if (dockerfile.includes('EXPOSE 3000')) {
  log('Dockerfile exposes port 3000');
} else {
  error('Dockerfile missing EXPOSE 3000');
}

// 7. Check fly.toml
console.log('\n--- Checking fly.toml ---');
const flyToml = fs.readFileSync(path.join(rootDir, 'fly.toml'), 'utf-8');

if (flyToml.includes('internal_port = 3000')) {
  log('fly.toml has correct internal port');
} else {
  error('fly.toml internal_port should be 3000');
}

// 8. Check required routes exist in main.tsx
console.log('\n--- Checking React routes ---');
const mainTsx = fs.readFileSync(path.join(webDir, 'src', 'main.tsx'), 'utf-8');

const requiredRoutes = ['/', '/auth/sign-in', '/dashboard', 's/:name'];
for (const route of requiredRoutes) {
  // Check for route with or without leading slash
  const routePattern = route.startsWith('/') ? route : `/${route}`;
  const routeNoSlash = route.startsWith('/') ? route.slice(1) : route;
  
  if (mainTsx.includes(`path: "${route}"`) || 
      mainTsx.includes(`path: '${route}'`) ||
      mainTsx.includes(`path: "${routeNoSlash}"`) ||
      mainTsx.includes(`path: '${routeNoSlash}'`)) {
    log(`Route ${routePattern} defined`);
  } else {
    error(`Route ${routePattern} not found in main.tsx`);
  }
}

// Summary
console.log('\n=== Summary ===');
if (errors.length === 0 && warnings.length === 0) {
  console.log('✓ All checks passed! Ready to deploy.');
  process.exit(0);
} else {
  if (warnings.length > 0) {
    console.log(`\n⚠ ${warnings.length} warning(s):`);
    warnings.forEach(w => console.log(`  - ${w}`));
  }
  if (errors.length > 0) {
    console.log(`\n✗ ${errors.length} error(s):`);
    errors.forEach(e => console.log(`  - ${e}`));
    process.exit(1);
  }
  process.exit(0);
}
