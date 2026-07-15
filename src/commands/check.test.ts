import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { CheckCommand } from './check.js';

const tempDirectories: string[] = [];

async function createTempDirectory(): Promise<string> {
  const directoryPath = await mkdtemp(path.join(tmpdir(), 'specify-it-check-'));
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

describe('CheckCommand', (): void => {
  it('rejects non-object CLI input', (): void => {
    expect(() => CheckCommand.fromCliOptions('check')).toThrow('Invalid check options.');
  });
});

describe('CheckCommand.getSummary', (): void => {
  it('formats a successful result', (): void => {
    expect(CheckCommand.getSummary({ errors: [] })).toContain('Repository passed validation.');
  });

  it('formats error results line by line', (): void => {
    expect(
      CheckCommand.getSummary({
        errors: ['error one', 'error two'],
      })
    ).toContain('error one\nerror two');
  });
});

describe('CheckCommand.run', (): void => {
  it('passes for a valid markdown repository', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        requireKnownExtension: true,
        requireOrderedSections: true,
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });
    await writeFile(
      path.join(cwd, '.specs/20260714213000_bootstrap-release-workflow.md'),
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
      ].join('\n'),
      'utf8'
    );

    await expect(command.run()).resolves.toEqual({ errors: [] });
  });

  it('accepts the reserved bootstrap spec filename from init', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        requireKnownExtension: true,
        requireOrderedSections: true,
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });
    await writeFile(
      path.join(cwd, '.specs/00000000000000_initial_spec_example.md'),
      [
        '# Bootstrap Spec Example',
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
      ].join('\n'),
      'utf8'
    );

    await expect(command.run()).resolves.toEqual({ errors: [] });
  });

  it('fails when the config file is missing', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await expect(command.run()).rejects.toThrow(`Could not find specify-it.config.json in ${cwd}.`);
  });

  it('fails when the specs directory is required but missing', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await writeConfig(cwd, {
      checks: {
        requireKnownExtension: true,
        requireOrderedSections: true,
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
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
      errors: ['Missing specs directory: .specs'],
    });
  });

  it('reports invalid extension, filename, and missing section errors together', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        requireKnownExtension: true,
        requireOrderedSections: true,
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });
    await writeFile(
      path.join(cwd, '.specs/invalid_name.txt'),
      ['# Invalid Spec', '', '## Objective', ''].join('\n'),
      'utf8'
    );

    await expect(command.run()).resolves.toEqual({
      errors: [
        'Invalid spec extension: .specs/invalid_name.txt must use .md.',
        'Invalid spec filename: .specs/invalid_name.txt must match YYYYMMDDHHMMSS_slug.md.',
        'Missing required section: .specs/invalid_name.txt must include "## Scope".',
        'Missing required section: .specs/invalid_name.txt must include "## Design".',
        'Missing required section: .specs/invalid_name.txt must include "## Acceptance Criteria".',
      ],
    });
  });

  it('fails when a repository without groups contains nested spec files', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await mkdir(path.join(cwd, '.specs/feat'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        requireKnownExtension: true,
        requireOrderedSections: true,
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
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
      errors: [
        'Invalid spec path: .specs/feat must not be nested when specs.groups is not configured.',
      ],
    });
  });

  it('fails when a grouped repository contains invalid group directories and nested files', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await mkdir(path.join(cwd, '.specs/feat/nested'), { recursive: true });
    await mkdir(path.join(cwd, '.specs/misc'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        requireKnownExtension: true,
        requireOrderedSections: true,
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        groups: ['feat', 'fix'],
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });
    await writeFile(
      path.join(cwd, '.specs/feat/nested/20260714213000_add-config-loader.md'),
      '# Add Config Loader\n',
      'utf8'
    );

    await expect(command.run()).resolves.toEqual({
      errors: [
        'Invalid spec path: .specs/feat/nested must live directly under the configured group directory.',
        'Invalid spec group directory: .specs/misc is not one of: feat, fix',
      ],
    });
  });

  it('fails for unsupported naming strategies', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        requireKnownExtension: true,
        requireOrderedSections: true,
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        naming: 'slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });

    await expect(command.run()).resolves.toEqual({
      errors: [
        'Unsupported spec naming for check: slug. Only timestamp-slug is currently supported.',
      ],
    });
  });

  it('fails when markdown sections are out of order or unsupported', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        requireKnownExtension: true,
        requireOrderedSections: true,
        requireSpecsDirectory: true,
      },
      specs: {
        format: 'md',
        naming: 'timestamp-slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });
    await writeFile(
      path.join(cwd, '.specs/20260714213000_add-config-loader.md'),
      [
        '# Add Config Loader',
        '',
        '## Scope',
        '',
        '## Objective',
        '',
        '## Design',
        '',
        '## Notes',
        '',
        '## Acceptance Criteria',
        '',
      ].join('\n'),
      'utf8'
    );

    await expect(command.run()).resolves.toEqual({
      errors: [
        'Invalid section heading: .specs/20260714213000_add-config-loader.md contains unsupported section "Notes".',
        'Invalid section order: .specs/20260714213000_add-config-loader.md does not follow the configured section order.',
      ],
    });
  });
});
