import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { ListCommand } from './list.js';

const tempDirectories: string[] = [];

async function createTempDirectory(): Promise<string> {
  const directoryPath = await mkdtemp(path.join(tmpdir(), 'specify-it-list-'));
  tempDirectories.push(directoryPath);
  return directoryPath;
}

async function writeConfig(cwd: string, config: unknown): Promise<void> {
  await writeFile(path.join(cwd, 'specify-it.config.json'), `${JSON.stringify(config, null, 2)}\n`);
}

afterEach(async (): Promise<void> => {
  await Promise.all(
    tempDirectories
      .splice(0)
      .map(async (directoryPath) => rm(directoryPath, { force: true, recursive: true }))
  );
});

describe('ListCommand', (): void => {
  it('rejects non-object CLI input', (): void => {
    expect(() => ListCommand.fromCliOptions('list')).toThrow('Invalid list options.');
  });
});

describe('ListCommand.getSummary', (): void => {
  it('formats a successful list result', (): void => {
    expect(
      ListCommand.getSummary({
        count: 2,
        errors: [],
        specs: [
          {
            format: 'md',
            group: null,
            naming: 'slug',
            path: '.specs/first.md',
          },
          {
            format: 'md',
            group: null,
            naming: 'slug',
            path: '.specs/second.md',
          },
        ],
      })
    ).toContain('2 specs found.');
  });

  it('formats errors line by line', (): void => {
    expect(
      ListCommand.getSummary({
        count: 0,
        errors: ['error one', 'error two'],
        specs: [],
      })
    ).toContain('error one\nerror two');
  });
});

describe('ListCommand.run', (): void => {
  it('lists specs in an ungrouped repository', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = ListCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        naming: 'slug',
        root: '.specs',
      },
    });
    await writeFile(path.join(cwd, '.specs/add_config_loader.md'), '# Add Config Loader\n', 'utf8');
    await writeFile(
      path.join(cwd, '.specs/bootstrap_release_workflow.md'),
      '# Bootstrap\n',
      'utf8'
    );

    await expect(command.run()).resolves.toEqual({
      count: 2,
      errors: [],
      specs: [
        {
          format: 'md',
          group: null,
          naming: 'slug',
          path: '.specs/add_config_loader.md',
        },
        {
          format: 'md',
          group: null,
          naming: 'slug',
          path: '.specs/bootstrap_release_workflow.md',
        },
      ],
    });
  });

  it('lists specs in a grouped repository', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = ListCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await mkdir(path.join(cwd, '.specs/feat'), { recursive: true });
    await mkdir(path.join(cwd, '.specs/fix'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        groups: ['feat', 'fix'],
        naming: 'group-slug',
        root: '.specs',
      },
    });
    await writeFile(
      path.join(cwd, '.specs/feat/feat_add_config_loader.md'),
      '# Add Config Loader\n',
      'utf8'
    );
    await writeFile(path.join(cwd, '.specs/fix/fix_repair_parser.md'), '# Repair Parser\n', 'utf8');

    await expect(command.run()).resolves.toEqual({
      count: 2,
      errors: [],
      specs: [
        {
          format: 'md',
          group: 'feat',
          naming: 'group-slug',
          path: '.specs/feat/feat_add_config_loader.md',
        },
        {
          format: 'md',
          group: 'fix',
          naming: 'group-slug',
          path: '.specs/fix/fix_repair_parser.md',
        },
      ],
    });
  });

  it('returns an empty result when the specs directory is optional and missing', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = ListCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      checks: {
        requireSpecsDirectory: false,
      },
      specs: {
        format: 'md',
        naming: 'slug',
        root: '.specs',
      },
    });

    await expect(command.run()).resolves.toEqual({
      count: 0,
      errors: [],
      specs: [],
    });
  });

  it('fails when the specs directory is required but missing', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = ListCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      checks: {
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        naming: 'slug',
        root: '.specs',
      },
    });

    await expect(command.run()).resolves.toEqual({
      count: 0,
      errors: ['Missing specs directory: .specs'],
      specs: [],
    });
  });

  it('fails for invalid layout in an ungrouped repository', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = ListCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await mkdir(path.join(cwd, '.specs/feat'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        naming: 'slug',
        root: '.specs',
      },
    });

    await expect(command.run()).resolves.toEqual({
      count: 0,
      errors: [
        'Invalid spec path: .specs/feat must not be nested when specs.groups is not configured.',
      ],
      specs: [],
    });
  });

  it('fails for invalid filename shape', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = ListCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        naming: 'date-slug',
        root: '.specs',
      },
    });
    await writeFile(
      path.join(cwd, '.specs/bootstrap_release_workflow.md'),
      '# Bootstrap\n',
      'utf8'
    );

    await expect(command.run()).resolves.toEqual({
      count: 0,
      errors: ['Invalid spec filename: .specs/bootstrap_release_workflow.md'],
      specs: [],
    });
  });
});
