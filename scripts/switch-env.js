#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const env = process.argv[2];
if (!env) {
  console.error('Usage: node switch-env.js <stage|uat|prod>');
  process.exit(2);
}

const envFile = path.join(process.cwd(), 'envs', `.env.${env}`);
const dest = path.join(process.cwd(), '.env');

if (!fs.existsSync(envFile)) {
  console.error(`Env file not found: ${envFile}`);
  process.exit(1);
}

fs.copyFileSync(envFile, dest);
console.log(`Copied ${envFile} -> ${dest}`);