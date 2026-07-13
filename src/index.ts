#!/usr/bin/env node

import { fileURLToPath } from 'node:url';

import { runCli } from './cli.js';

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  return runCli(argv);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const exitCode = await main();

  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
}
