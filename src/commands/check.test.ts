import { execFileSync } from 'node:child_process';
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

function runGit(cwd: string, args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

function initializeGitRepository(cwd: string): void {
  runGit(cwd, ['init']);
  runGit(cwd, ['config', 'user.name', 'Codex']);
  runGit(cwd, ['config', 'user.email', 'codex@example.com']);
}

function commitAll(cwd: string, message: string): void {
  runGit(cwd, ['add', '.']);
  runGit(cwd, ['-c', 'commit.gpgsign=false', 'commit', '-m', message]);
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
    expect(CheckCommand.getSummary({ changedSpecs: 0, checkedSpecs: 0, errors: [] })).toContain(
      'Repository passed validation.'
    );
  });

  it('formats error results line by line', (): void => {
    expect(
      CheckCommand.getSummary({
        changedSpecs: 0,
        checkedSpecs: 0,
        errors: ['error one', 'error two'],
      })
    ).toContain('error one\nerror two');
  });

  it('formats a json result', (): void => {
    expect(
      CheckCommand.getJsonSummary({
        changedSpecs: 1,
        checkedSpecs: 3,
        errors: ['error one'],
      })
    ).toContain('"ok": false');
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
      path.join(cwd, '.specs/20260714213000_bootstrap_release_workflow.md'),
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

    await expect(command.run()).resolves.toEqual({ changedSpecs: 0, checkedSpecs: 1, errors: [] });
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

    await expect(command.run()).resolves.toEqual({ changedSpecs: 0, checkedSpecs: 1, errors: [] });
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
      changedSpecs: 0,
      checkedSpecs: 0,
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
      changedSpecs: 0,
      checkedSpecs: 1,
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
      changedSpecs: 0,
      checkedSpecs: 0,
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
      path.join(cwd, '.specs/feat/nested/20260714213000_add_config_loader.md'),
      '# Add Config Loader\n',
      'utf8'
    );

    await expect(command.run()).resolves.toEqual({
      changedSpecs: 0,
      checkedSpecs: 0,
      errors: [
        'Invalid spec path: .specs/feat/nested must live directly under the configured group directory.',
        'Invalid spec group directory: .specs/misc is not one of: feat, fix',
      ],
    });
  });

  it('passes for slug naming', async (): Promise<void> => {
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
    await writeFile(
      path.join(cwd, '.specs/add_config_loader.md'),
      [
        '# Add Config Loader',
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

    await expect(command.run()).resolves.toEqual({
      changedSpecs: 0,
      checkedSpecs: 1,
      errors: [],
    });
  });

  it('passes for date-slug naming', async (): Promise<void> => {
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
        naming: 'date-slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });
    await writeFile(
      path.join(cwd, '.specs/20260714_add_config_loader.md'),
      [
        '# Add Config Loader',
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

    await expect(command.run()).resolves.toEqual({
      changedSpecs: 0,
      checkedSpecs: 1,
      errors: [],
    });
  });

  it('passes for sequence-slug naming', async (): Promise<void> => {
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
        naming: 'sequence-slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });
    await writeFile(
      path.join(cwd, '.specs/0007_add_config_loader.md'),
      [
        '# Add Config Loader',
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

    await expect(command.run()).resolves.toEqual({
      changedSpecs: 0,
      checkedSpecs: 1,
      errors: [],
    });
  });

  it('passes for grouped filename strategies when the filename group matches the directory', async (): Promise<void> => {
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
        groups: ['feat', 'fix'],
        naming: 'timestamp-group-slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });
    await writeFile(
      path.join(cwd, '.specs/feat/20260714213000_feat_add_config_loader.md'),
      [
        '# Add Config Loader',
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

    await expect(command.run()).resolves.toEqual({
      changedSpecs: 0,
      checkedSpecs: 1,
      errors: [],
    });
  });

  it('fails when a group-based naming strategy is configured without specs.groups', async (): Promise<void> => {
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
        naming: 'group-slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });

    await expect(command.run()).resolves.toEqual({
      changedSpecs: 0,
      checkedSpecs: 0,
      errors: [
        'Invalid spec naming configuration: group-slug requires specs.groups to be configured.',
      ],
    });
  });

  it('fails when a grouped filename embeds a different group than its directory', async (): Promise<void> => {
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
        groups: ['feat', 'fix'],
        naming: 'group-slug',
        root: '.specs',
        sections: {
          optional: ['Examples'],
          order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
          required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
        },
      },
    });
    await writeFile(
      path.join(cwd, '.specs/feat/fix_add_config_loader.md'),
      [
        '# Add Config Loader',
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

    await expect(command.run()).resolves.toEqual({
      changedSpecs: 0,
      checkedSpecs: 1,
      errors: [
        'Invalid spec filename: .specs/feat/fix_add_config_loader.md must match feat_slug.md.',
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
      path.join(cwd, '.specs/20260714213000_add_config_loader.md'),
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
      changedSpecs: 0,
      checkedSpecs: 1,
      errors: [
        'Invalid section heading: .specs/20260714213000_add_config_loader.md contains unsupported section "Notes".',
        'Invalid section order: .specs/20260714213000_add_config_loader.md does not follow the configured section order.',
      ],
    });
  });

  it('ignores heading-like lines inside fenced code blocks', async (): Promise<void> => {
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
      path.join(cwd, '.specs/20260714213000_define_new_command.md'),
      [
        '# Define New Command',
        '',
        '## Objective',
        '',
        '## Scope',
        '',
        '## Design',
        '',
        '## Examples',
        '',
        '```md',
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
        '```',
        '',
        '## Acceptance Criteria',
        '',
      ].join('\n'),
      'utf8'
    );

    await expect(command.run()).resolves.toEqual({ changedSpecs: 0, checkedSpecs: 1, errors: [] });
  });

  it('fails when commit-aware checks are enabled but git context is unavailable', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        commitSpecs: {
          mode: 'any',
          requireLatest: false,
        },
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

    await expect(command.run()).rejects.toThrow(
      'Could not resolve Git context for commit-aware checks.'
    );
  });

  it('fails when mode is one and no spec file is changed', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    initializeGitRepository(cwd);
    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        commitSpecs: {
          mode: 'one',
          requireLatest: false,
        },
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
    await writeFile(path.join(cwd, 'notes.txt'), 'base\n', 'utf8');
    commitAll(cwd, 'chore(repo): bootstrap');
    await writeFile(path.join(cwd, 'notes.txt'), 'changed\n', 'utf8');

    await expect(command.run()).resolves.toEqual({
      changedSpecs: 0,
      checkedSpecs: 0,
      errors: ['Missing required spec change: checks.commitSpecs.mode is "one".'],
    });
  });

  it('fails when changed spec files exceed maxChangedSpecs', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    initializeGitRepository(cwd);
    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        commitSpecs: {
          maxChangedSpecs: 1,
          mode: 'any',
          requireLatest: false,
        },
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
      path.join(cwd, '.specs/20260714213000_first_spec.md'),
      [
        '# First Spec',
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
    commitAll(cwd, 'chore(repo): bootstrap');
    await writeFile(
      path.join(cwd, '.specs/20260714214000_second_spec.md'),
      [
        '# Second Spec',
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
    await writeFile(
      path.join(cwd, '.specs/20260714215000_third_spec.md'),
      [
        '# Third Spec',
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

    await expect(command.run()).resolves.toEqual({
      changedSpecs: 2,
      checkedSpecs: 3,
      errors: [
        'Too many spec changes: checks.commitSpecs.maxChangedSpecs is 1, but found 2 changed spec files.',
      ],
    });
  });

  it('passes when mode is one and maxChangedSpecs is one with a single changed spec file', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    initializeGitRepository(cwd);
    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        commitSpecs: {
          maxChangedSpecs: 1,
          mode: 'one',
          requireLatest: false,
        },
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
    await writeFile(path.join(cwd, 'notes.txt'), 'base\n', 'utf8');
    commitAll(cwd, 'chore(repo): bootstrap');
    await writeFile(
      path.join(cwd, '.specs/20260714214000_single_spec.md'),
      [
        '# Single Spec',
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

    await expect(command.run()).resolves.toEqual({ changedSpecs: 1, checkedSpecs: 1, errors: [] });
  });

  it('fails when mode is none and a spec file is changed', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    initializeGitRepository(cwd);
    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        commitSpecs: {
          mode: 'none',
          requireLatest: false,
        },
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
      path.join(cwd, '.specs/20260714213000_bootstrap_release_workflow.md'),
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
    commitAll(cwd, 'chore(repo): bootstrap');
    await writeFile(
      path.join(cwd, '.specs/20260714213000_bootstrap_release_workflow.md'),
      [
        '# Bootstrap Release Workflow',
        '',
        '## Objective',
        '',
        'updated',
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

    await expect(command.run()).resolves.toEqual({
      changedSpecs: 1,
      checkedSpecs: 1,
      errors: ['Unexpected spec change: checks.commitSpecs.mode is "none".'],
    });
  });

  it('fails when a new spec is not the latest in its directory', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    initializeGitRepository(cwd);
    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        commitSpecs: {
          mode: 'any',
          requireLatest: true,
        },
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
      path.join(cwd, '.specs/20260714214000_existing_spec.md'),
      [
        '# Existing Spec',
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
    commitAll(cwd, 'chore(repo): bootstrap');
    await writeFile(
      path.join(cwd, '.specs/20260714213000_new_spec.md'),
      [
        '# New Spec',
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

    await expect(command.run()).resolves.toEqual({
      changedSpecs: 1,
      checkedSpecs: 3,
      errors: [
        'Spec is not the latest in its directory: .specs/20260714213000_new_spec.md must be the newest timestamp-slug spec in .specs.',
      ],
    });
  });

  it('passes when a new grouped spec is the latest in its own directory', async (): Promise<void> => {
    const cwd = await createTempDirectory();
    const command = CheckCommand.fromCliOptions({});
    Reflect.set(command, 'cwd', cwd);

    initializeGitRepository(cwd);
    await mkdir(path.join(cwd, '.specs/feat'), { recursive: true });
    await mkdir(path.join(cwd, '.specs/fix'), { recursive: true });
    await writeConfig(cwd, {
      checks: {
        commitSpecs: {
          mode: 'one',
          requireLatest: true,
        },
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
      path.join(cwd, '.specs/feat/20260714213000_existing_feat.md'),
      [
        '# Existing Feat',
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
    await writeFile(
      path.join(cwd, '.specs/fix/20260714215000_existing_fix.md'),
      [
        '# Existing Fix',
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
    commitAll(cwd, 'chore(repo): bootstrap');
    await writeFile(
      path.join(cwd, '.specs/feat/20260714216000_new_feat.md'),
      [
        '# New Feat',
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

    await expect(command.run()).resolves.toEqual({ changedSpecs: 1, checkedSpecs: 3, errors: [] });
  });
});
