import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { createCli } from './cli.js';

function runCliProcess(args: string[]): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ['--import', 'tsx', path.resolve('src/index.ts'), ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

describe('createCli', (): void => {
  it('creates the spec-it CLI instance', (): void => {
    const cli = createCli();

    expect(cli.name).toBe('spec-it');
  });
});

describe('CLI process', (): void => {
  it('shows help output when no command is provided', (): void => {
    const result = runCliProcess([]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('spec-it');
    expect(result.stdout).toContain('Examples:');
  });

  it('shows help output when help is requested', (): void => {
    const result = runCliProcess(['--help']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('spec-it [options]');
  });

  it('returns an error for an unknown command', (): void => {
    const result = runCliProcess(['unknown']);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Usage:');
    expect(result.stderr).toContain('Unknown command: unknown');
  });
});
