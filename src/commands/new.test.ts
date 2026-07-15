import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NewCommand } from './new.js';

const tempDirectories: string[] = [];
const realDate = Date;

async function createTempDirectory(): Promise<string> {
  const directoryPath = await mkdtemp(path.join(tmpdir(), 'specify-it-new-'));
  tempDirectories.push(directoryPath);
  return directoryPath;
}

async function writeConfig(cwd: string, config: unknown): Promise<void> {
  await writeFile(path.join(cwd, 'specify-it.config.json'), `${JSON.stringify(config, null, 2)}\n`);
}

afterEach(async (): Promise<void> => {
  vi.useRealTimers();

  await Promise.all(
    tempDirectories
      .splice(0)
      .map(async (directoryPath) => rm(directoryPath, { force: true, recursive: true }))
  );
});

beforeEach((): void => {
  vi.useFakeTimers();
  vi.setSystemTime(new realDate('2026-07-14T21:30:00'));
});

describe('NewCommand', (): void => {
  it('requires the title flag', (): void => {
    expect(() => NewCommand.fromCliOptions({})).toThrow(
      'Missing required title. Use --title "<title>".'
    );
  });

  it('trims the provided title and group values', (): void => {
    const command = NewCommand.fromCliOptions({
      group: '  feat  ',
      title: '  Bootstrap Release Workflow  ',
    });

    expect(command.group).toBe('feat');
    expect(command.title).toBe('Bootstrap Release Workflow');
  });

  it('throws for non-object CLI input', (): void => {
    expect(() => NewCommand.fromCliOptions('new')).toThrow('Invalid new options.');
  });
});

describe('NewCommand.getSummary', (): void => {
  it('formats the created file path', (): void => {
    expect(
      NewCommand.getSummary({
        created: '.specs/20260714213000_bootstrap_release_workflow.md',
      })
    ).toContain('Created: .specs/20260714213000_bootstrap_release_workflow.md');
  });
});

describe('NewCommand.run', (): void => {
  it('creates a markdown spec from the repository configuration', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = NewCommand.fromCliOptions({ title: 'Bootstrap Release Workflow' });
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      specs: {
        format: 'md',
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
        },
      },
    });

    const result = await command.run();
    const createdSpec = await readFile(
      path.join(cwd, '.specs/20260714213000_bootstrap-release-workflow.md'),
      'utf8'
    );

    expect(result).toEqual({
      created: '.specs/20260714213000_bootstrap-release-workflow.md',
    });
    expect(createdSpec).toBe(
      [
        '# Bootstrap Release Workflow',
        '',
        '## Objective',
        '',
        '## Scope',
        '',
        '## Design',
        '',
        '## Examples',
        '',
        '## Acceptance Criteria',
        '',
        '',
      ].join('\n')
    );
  });

  it('creates a grouped spec when the repository defines groups and a valid group is provided', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = NewCommand.fromCliOptions({
      group: 'feat',
      title: 'Add Config Loader',
    });
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      specs: {
        format: 'md',
        groups: ['feat', 'fix'],
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          order: ['Title', 'Objective', 'Scope'],
        },
      },
    });

    const result = await command.run();

    expect(result).toEqual({
      created: '.specs/feat/20260714213000_add-config-loader.md',
    });
  });

  it('requires a group when groups are configured', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = NewCommand.fromCliOptions({ title: 'Add Config Loader' });
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      specs: {
        format: 'md',
        groups: ['feat', 'fix'],
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          order: ['Title', 'Objective'],
        },
      },
    });

    await expect(command.run()).rejects.toThrow(
      'Missing required group. Use --group with one of: feat, fix'
    );
  });

  it('rejects unknown groups', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = NewCommand.fromCliOptions({
      group: 'docs',
      title: 'Add Config Loader',
    });
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      specs: {
        format: 'md',
        groups: ['feat', 'fix'],
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          order: ['Title', 'Objective'],
        },
      },
    });

    await expect(command.run()).rejects.toThrow('Invalid group "docs". Use one of: feat, fix');
  });

  it('rejects group input when the repository does not define groups', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = NewCommand.fromCliOptions({
      group: 'feat',
      title: 'Add Config Loader',
    });
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      specs: {
        format: 'md',
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          order: ['Title', 'Objective'],
        },
      },
    });

    await expect(command.run()).rejects.toThrow('This repository does not define spec groups.');
  });

  it('fails when the config file is missing', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = NewCommand.fromCliOptions({ title: 'Bootstrap Release Workflow' });
    Reflect.set(command, 'cwd', cwd);

    await expect(command.run()).rejects.toThrow(`Could not find specify-it.config.json in ${cwd}.`);
  });

  it('fails for invalid config json', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = NewCommand.fromCliOptions({ title: 'Bootstrap Release Workflow' });
    Reflect.set(command, 'cwd', cwd);

    await writeFile(path.join(cwd, 'specify-it.config.json'), '{invalid\n', 'utf8');

    await expect(command.run()).rejects.toThrow(
      'Invalid specify-it.config.json. Expected valid JSON.'
    );
  });

  it('fails for unsupported formats', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = NewCommand.fromCliOptions({ title: 'Bootstrap Release Workflow' });
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      specs: {
        format: 'json',
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          order: ['Title', 'Objective'],
        },
      },
    });

    await expect(command.run()).rejects.toThrow(
      'Unsupported spec format for new: json. Only md is currently supported.'
    );
  });

  it('fails for unsupported naming strategies', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = NewCommand.fromCliOptions({ title: 'Bootstrap Release Workflow' });
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      specs: {
        format: 'md',
        naming: 'slug',
        root: '.specs',
        sections: {
          order: ['Title', 'Objective'],
        },
      },
    });

    await expect(command.run()).rejects.toThrow(
      'Unsupported spec naming for new: slug. Only timestamp-slug is currently supported.'
    );
  });

  it('fails without overwriting an existing target file', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = NewCommand.fromCliOptions({ title: 'Bootstrap Release Workflow' });
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      specs: {
        format: 'md',
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          order: ['Title', 'Objective'],
        },
      },
    });

    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeFile(
      path.join(cwd, '.specs/20260714213000_bootstrap-release-workflow.md'),
      'custom\n',
      'utf8'
    );

    await expect(command.run()).rejects.toThrow(
      'Spec file already exists: .specs/20260714213000_bootstrap-release-workflow.md'
    );
  });

  it('fails when the title cannot produce a valid slug', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = NewCommand.fromCliOptions({ title: '!!!' });
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      specs: {
        format: 'md',
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          order: ['Title', 'Objective'],
        },
      },
    });

    await expect(command.run()).rejects.toThrow(
      'Title must include letters or numbers after normalization.'
    );
  });
});
