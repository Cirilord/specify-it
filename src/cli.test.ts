import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { createCli } from './cli.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const cliEntrypointPath = path.join(currentDirectoryPath, 'index.ts');
const repositoryRootPath = path.dirname(currentDirectoryPath);
const tsxLoaderPath = path.join(repositoryRootPath, 'node_modules/tsx/dist/loader.mjs');

const tempDirectories: string[] = [];

async function createTempDirectory(): Promise<string> {
  const directoryPath = await mkdtemp(path.join(tmpdir(), 'specify-it-cli-'));
  tempDirectories.push(directoryPath);
  return directoryPath;
}

afterEach(async (): Promise<void> => {
  await Promise.all(
    tempDirectories
      .splice(0)
      .map(async (directoryPath) => rm(directoryPath, { force: true, recursive: true }))
  );
});

function runCliProcess(args: string[], cwd = process.cwd()): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ['--import', tsxLoaderPath, cliEntrypointPath, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

describe('createCli', (): void => {
  it('creates the specify-it CLI instance', (): void => {
    const cli = createCli();

    expect(cli.name).toBe('specify-it');
  });
});

describe('CLI process', (): void => {
  it('shows help output when no command is provided', (): void => {
    const result = runCliProcess([]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('specify-it');
    expect(result.stdout).toContain('Examples:');
  });

  it('shows help output when help is requested', (): void => {
    const result = runCliProcess(['--help']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('specify-it init');
  });

  it('returns an error for an unknown command', (): void => {
    const result = runCliProcess(['unknown']);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Usage:');
    expect(result.stderr).toContain('Unknown command: unknown');
  });

  it('returns an error for an invalid init format', (): void => {
    const result = runCliProcess(['init', '--format=yaml']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid format. Use one of: md, json, html, xml');
  });

  it('runs init through the CLI', async (): Promise<void> => {
    const cwd = await createTempDirectory();

    const result = runCliProcess(['init', '--bare'], cwd);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('specify-it init complete.');
    expect(result.stdout).toContain('.specs');
  });
});
