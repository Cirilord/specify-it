import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { PrintConfigCommand } from './print-config.js';

const tempDirectories: string[] = [];

async function createTempDirectory(): Promise<string> {
  const directoryPath = await mkdtemp(path.join(tmpdir(), 'specify-it-print-config-'));
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

describe('PrintConfigCommand', (): void => {
  it('rejects CLI input without --json', (): void => {
    expect(() => PrintConfigCommand.fromCliOptions({})).toThrow(
      'print-config currently requires --json.'
    );
  });

  it('rejects non-object CLI input', (): void => {
    expect(() => PrintConfigCommand.fromCliOptions('print-config')).toThrow(
      'print-config currently requires --json.'
    );
  });
});

describe('PrintConfigCommand.getSummary', (): void => {
  it('formats the config as compact JSON', (): void => {
    expect(
      PrintConfigCommand.getSummary({
        agents: {
          syncDocuments: ['AGENTS.md'],
        },
        checks: {
          commitSpecs: {
            maxChangedSpecs: 1,
            mode: 'one',
            requireLatest: true,
          },
          requireKnownExtension: true,
          requireOrderedSections: true,
          requireSpecsDirectory: true,
        },
        specs: {
          format: 'md',
          groups: undefined,
          language: 'en',
          naming: 'timestamp-slug',
          root: '.specs',
          sections: {
            optional: ['Examples'],
            order: ['Title', 'Objective'],
            required: ['Objective'],
          },
        },
      })
    ).toBe(
      `${JSON.stringify({
        agents: {
          syncDocuments: ['AGENTS.md'],
        },
        checks: {
          commitSpecs: {
            maxChangedSpecs: 1,
            mode: 'one',
            requireLatest: true,
          },
          requireKnownExtension: true,
          requireOrderedSections: true,
          requireSpecsDirectory: true,
        },
        specs: {
          format: 'md',
          groups: undefined,
          language: 'en',
          naming: 'timestamp-slug',
          root: '.specs',
          sections: {
            optional: ['Examples'],
            order: ['Title', 'Objective'],
            required: ['Objective'],
          },
        },
      })}\n`
    );
  });
});

describe('PrintConfigCommand.run', (): void => {
  it('prints the resolved repository config', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = PrintConfigCommand.fromCliOptions({ json: true });
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      agents: {
        syncDocuments: ['AGENTS.md', 'README.md'],
      },
      checks: {
        commitSpecs: {
          maxChangedSpecs: 1,
          mode: 'one',
          requireLatest: true,
        },
        requireKnownExtension: true,
        requireOrderedSections: true,
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        language: 'en',
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });

    await expect(command.run()).resolves.toEqual({
      agents: {
        syncDocuments: ['AGENTS.md', 'README.md'],
      },
      checks: {
        commitSpecs: {
          maxChangedSpecs: 1,
          mode: 'one',
          requireLatest: true,
        },
        requireKnownExtension: true,
        requireOrderedSections: true,
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        groups: undefined,
        language: 'en',
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });
  });

  it('fails when the config file is missing', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = PrintConfigCommand.fromCliOptions({ json: true });
    Reflect.set(command, 'cwd', cwd);

    await expect(command.run()).rejects.toThrow(`Could not find specify-it.config.json in ${cwd}.`);
  });

  it('fails when the config file is invalid JSON', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = PrintConfigCommand.fromCliOptions({ json: true });
    Reflect.set(command, 'cwd', cwd);

    await writeFile(path.join(cwd, 'specify-it.config.json'), '{invalid\n', 'utf8');

    await expect(command.run()).rejects.toThrow(
      'Invalid specify-it.config.json. Expected valid JSON.'
    );
  });

  it('fails when the config file does not match the supported schema', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = PrintConfigCommand.fromCliOptions({ json: true });
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      specs: {
        format: 'md',
      },
    });

    await expect(command.run()).rejects.toThrow('Invalid specify-it.config.json.');
  });
});
