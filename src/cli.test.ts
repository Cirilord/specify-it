import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import { createCli } from './cli.js';

type CheckJsonOutput = {
  changedSpecs: number;
  checkedSpecs: number;
  errors: string[];
  ok: boolean;
};

type ListJsonOutput = {
  count: number;
  errors?: string[];
  specs: Array<{
    format: string;
    group: string | null;
    naming: string;
    path: string;
  }>;
};

type PrintConfigJsonOutput = {
  agents: {
    syncDocuments: string[];
  };
  checks: {
    commitSpecs?: {
      maxChangedSpecs?: number;
      mode: string;
      requireLatest: boolean;
    };
    requireKnownExtension: boolean;
    requireOrderedSections: boolean;
    requireSpecsDirectory: boolean;
  };
  specs: {
    format: string;
    groups?: string[];
    language: string;
    naming: string;
    root: string;
    sections: {
      optional: string[];
      order: string[];
      required: string[];
    };
  };
};

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const cliEntrypointPath = path.join(currentDirectoryPath, 'bin.ts');
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

function parseCheckJsonOutput(stdout: string): CheckJsonOutput {
  return JSON.parse(stdout) as CheckJsonOutput;
}

function parseListJsonOutput(stdout: string): ListJsonOutput {
  return JSON.parse(stdout) as ListJsonOutput;
}

function parsePrintConfigJsonOutput(stdout: string): PrintConfigJsonOutput {
  return JSON.parse(stdout) as PrintConfigJsonOutput;
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
    expect(result.stdout).toContain('specify-it check');
    expect(result.stdout).toContain('specify-it init');
    expect(result.stdout).toContain('specify-it list');
    expect(result.stdout).toContain('specify-it new');
    expect(result.stdout).toContain('specify-it print-config');
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

  it('runs check through the CLI', async (): Promise<void> => {
    const cwd = await createTempDirectory();

    await writeFile(
      path.join(cwd, 'specify-it.config.json'),
      `${JSON.stringify(
        {
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
        },
        null,
        2
      )}\n`,
      'utf8'
    );
    await mkdir(path.join(cwd, '.specs'), { recursive: true });
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

    const result = runCliProcess(['check'], cwd);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('specify-it check complete.');
    expect(result.stdout).toContain('Repository passed validation.');
  });

  it('runs check through the CLI with json output', async (): Promise<void> => {
    const cwd = await createTempDirectory();

    await writeFile(
      path.join(cwd, 'specify-it.config.json'),
      `${JSON.stringify(
        {
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
        },
        null,
        2
      )}\n`,
      'utf8'
    );
    await mkdir(path.join(cwd, '.specs'), { recursive: true });
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

    const result = runCliProcess(['check', '--json'], cwd);

    expect(result.status).toBe(0);
    expect(parseCheckJsonOutput(result.stdout)).toEqual({
      changedSpecs: 0,
      checkedSpecs: 1,
      errors: [],
      ok: true,
    });
  });

  it('returns a non-zero exit code when check finds validation errors', async (): Promise<void> => {
    const cwd = await createTempDirectory();

    await writeFile(
      path.join(cwd, 'specify-it.config.json'),
      `${JSON.stringify(
        {
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
        },
        null,
        2
      )}\n`,
      'utf8'
    );
    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeFile(path.join(cwd, '.specs/invalid.md'), '# Invalid\n', 'utf8');

    const result = runCliProcess(['check'], cwd);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Invalid spec filename');
  });

  it('runs list through the CLI', async (): Promise<void> => {
    const cwd = await createTempDirectory();

    await writeFile(
      path.join(cwd, 'specify-it.config.json'),
      `${JSON.stringify(
        {
          checks: {
            requireSpecsDirectory: true,
          },
          specs: {
            format: 'md',
            naming: 'slug',
            root: '.specs',
          },
        },
        null,
        2
      )}\n`,
      'utf8'
    );
    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeFile(
      path.join(cwd, '.specs/bootstrap_release_workflow.md'),
      '# Bootstrap\n',
      'utf8'
    );

    const result = runCliProcess(['list'], cwd);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('.specs/bootstrap_release_workflow.md');
    expect(result.stdout).toContain('1 specs found.');
  });

  it('runs list through the CLI with json output', async (): Promise<void> => {
    const cwd = await createTempDirectory();

    await writeFile(
      path.join(cwd, 'specify-it.config.json'),
      `${JSON.stringify(
        {
          checks: {
            requireSpecsDirectory: true,
          },
          specs: {
            format: 'md',
            naming: 'slug',
            root: '.specs',
          },
        },
        null,
        2
      )}\n`,
      'utf8'
    );
    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeFile(
      path.join(cwd, '.specs/bootstrap_release_workflow.md'),
      '# Bootstrap\n',
      'utf8'
    );

    const result = runCliProcess(['list', '--json'], cwd);

    expect(result.status).toBe(0);
    expect(parseListJsonOutput(result.stdout)).toEqual({
      count: 1,
      specs: [
        {
          format: 'md',
          group: null,
          naming: 'slug',
          path: '.specs/bootstrap_release_workflow.md',
        },
      ],
    });
  });

  it('returns a non-zero exit code when list finds validation errors', async (): Promise<void> => {
    const cwd = await createTempDirectory();

    await writeFile(
      path.join(cwd, 'specify-it.config.json'),
      `${JSON.stringify(
        {
          checks: {
            requireSpecsDirectory: true,
          },
          specs: {
            format: 'md',
            naming: 'date-slug',
            root: '.specs',
          },
        },
        null,
        2
      )}\n`,
      'utf8'
    );
    await mkdir(path.join(cwd, '.specs'), { recursive: true });
    await writeFile(
      path.join(cwd, '.specs/bootstrap_release_workflow.md'),
      '# Bootstrap\n',
      'utf8'
    );

    const result = runCliProcess(['list'], cwd);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Invalid spec filename: .specs/bootstrap_release_workflow.md');
  });

  it('returns json output for handled check command errors', async (): Promise<void> => {
    const cwd = await createTempDirectory();

    const result = runCliProcess(['check', '--json'], cwd);

    expect(result.status).toBe(1);
    const payload = parseCheckJsonOutput(result.stdout);

    expect(payload.changedSpecs).toBe(0);
    expect(payload.checkedSpecs).toBe(0);
    expect(payload.ok).toBe(false);
    expect(payload.errors).toEqual([
      expect.stringContaining('Could not find specify-it.config.json in '),
    ]);
  });

  it('returns an error when print-config is missing the json flag', async (): Promise<void> => {
    const cwd = await createTempDirectory();

    const result = runCliProcess(['print-config'], cwd);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('print-config currently requires --json.');
  });

  it('runs print-config through the CLI with json output', async (): Promise<void> => {
    const cwd = await createTempDirectory();

    await writeFile(
      path.join(cwd, 'specify-it.config.json'),
      `${JSON.stringify(
        {
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
        },
        null,
        2
      )}\n`,
      'utf8'
    );

    const result = runCliProcess(['print-config', '--json'], cwd);

    expect(result.status).toBe(0);
    expect(parsePrintConfigJsonOutput(result.stdout)).toEqual({
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
  });

  it('returns an error when new is missing the title flag', async (): Promise<void> => {
    const cwd = await createTempDirectory();

    const result = runCliProcess(['new'], cwd);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Missing required title. Use --title "<title>".');
  });

  it('runs new through the CLI', async (): Promise<void> => {
    const cwd = await createTempDirectory();

    await writeFile(
      path.join(cwd, 'specify-it.config.json'),
      `${JSON.stringify(
        {
          specs: {
            format: 'md',
            naming: 'timestamp-slug',
            root: '.specs',
            sections: {
              order: ['Title', 'Objective', 'Scope', 'Design', 'Examples', 'Acceptance Criteria'],
            },
          },
        },
        null,
        2
      )}\n`,
      'utf8'
    );

    const result = runCliProcess(['new', '--title=Bootstrap Release Workflow'], cwd);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('specify-it new complete.');
    expect(result.stdout).toContain('.specs/');

    const createdFiles = await readdir(path.join(cwd, '.specs'));
    const createdFileName = createdFiles.find((fileName) =>
      /^20\d{12}_bootstrap_release_workflow\.md$/.test(fileName)
    );
    const createdSpec = await readFile(path.join(cwd, '.specs', createdFileName ?? ''), 'utf8');

    expect(createdFileName).toBeDefined();
    expect(createdSpec).toContain('# Bootstrap Release Workflow');
  });
});
