import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { InitCommand } from './init.js';

const tempDirectories: string[] = [];

async function createTempDirectory(): Promise<string> {
  const directoryPath = await mkdtemp(path.join(tmpdir(), 'specify-it-'));
  tempDirectories.push(directoryPath);
  return directoryPath;
}

async function readJsonConfig(targetPath: string): Promise<unknown> {
  const content = await readFile(targetPath, 'utf8');
  return JSON.parse(content);
}

afterEach(async (): Promise<void> => {
  await Promise.all(
    tempDirectories
      .splice(0)
      .map(async (directoryPath) => rm(directoryPath, { force: true, recursive: true }))
  );
});

describe('InitCommand', (): void => {
  it('uses md as the default format', (): void => {
    const command = InitCommand.fromCliOptions({});

    expect(command.bare).toBe(false);
    expect(command.format).toBe('md');
  });

  it('throws for unsupported formats', (): void => {
    expect(() => InitCommand.fromCliOptions({ format: 'yaml' })).toThrow(
      'Invalid format. Use one of: md, json, html, xml'
    );
  });

  it('throws for non-object CLI input', (): void => {
    expect(() => InitCommand.fromCliOptions('init')).toThrow('Invalid init options.');
  });
});

describe('InitCommand.getSummary', (): void => {
  it('formats created and skipped file lists', (): void => {
    expect(
      InitCommand.getSummary({
        created: ['.specs', 'specify-it.config.json'],
        skipped: ['.specs/00000000000000_initial_spec_example.md'],
      })
    ).toContain('Created: .specs, specify-it.config.json');
  });
});

describe('InitCommand.run', (): void => {
  it('creates the default bootstrap structure', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = InitCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    const result = await command.run();
    const config = await readJsonConfig(path.join(cwd, 'specify-it.config.json'));
    const bootstrapSpec = await readFile(
      path.join(cwd, '.specs/00000000000000_initial_spec_example.md'),
      'utf8'
    );

    expect(result.created).toEqual([
      '.specs',
      'specify-it.config.json',
      '.specs/00000000000000_initial_spec_example.md',
    ]);
    expect(config).toMatchObject({
      $schema: 'https://unpkg.com/specify-it@0.6.1/schemas/specify-it.json',
      specs: {
        format: 'md',
        language: 'en',
        root: '.specs',
      },
      checks: {
        commitSpecs: {
          mode: 'any',
          requireLatest: true,
        },
      },
    });
    expect(config).not.toHaveProperty('specs.groups');
    expect(bootstrapSpec).toContain('# Bootstrap Spec Example');
  });

  it('creates bare bootstrap files without an example spec', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = InitCommand.fromCliOptions({ bare: true });
    Reflect.set(command, 'cwd', cwd);

    const result = await command.run();
    const gitkeepContent = await readFile(path.join(cwd, '.specs/.gitkeep'), 'utf8');

    expect(result.created).toEqual(['.specs', 'specify-it.config.json', '.specs/.gitkeep']);
    expect(gitkeepContent).toBe('');
  });

  it('uses the requested format for the config and bootstrap example', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = InitCommand.fromCliOptions({ format: 'json' });
    Reflect.set(command, 'cwd', cwd);

    await command.run();

    const config = await readJsonConfig(path.join(cwd, 'specify-it.config.json'));
    const bootstrapSpec = await readFile(
      path.join(cwd, '.specs/00000000000000_initial_spec_example.json'),
      'utf8'
    );

    expect(config).toMatchObject({
      $schema: 'https://unpkg.com/specify-it@0.6.1/schemas/specify-it.json',
      specs: {
        format: 'json',
        language: 'en',
        naming: 'timestamp-slug',
      },
    });
    expect(config).not.toHaveProperty('specs.groups');
    expect(config).not.toHaveProperty('specs.files');
    expect(JSON.parse(bootstrapSpec)).toMatchObject({
      title: 'Bootstrap Spec Example',
    });
  });

  it('skips files that already exist instead of overwriting them', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = InitCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await command.run();
    await writeFile(
      path.join(cwd, '.specs/00000000000000_initial_spec_example.md'),
      'custom\n',
      'utf8'
    );

    const result = await command.run();
    const bootstrapSpec = await readFile(
      path.join(cwd, '.specs/00000000000000_initial_spec_example.md'),
      'utf8'
    );

    expect(result.skipped).toEqual([
      '.specs',
      'specify-it.config.json',
      '.specs/00000000000000_initial_spec_example.md',
    ]);
    expect(bootstrapSpec).toBe('custom\n');
  });
});
