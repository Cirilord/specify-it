import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import packageJson from '../../package.json' with { type: 'json' };

const DEFAULT_SPEC_LANGUAGE = 'en';
const SUPPORTED_SPEC_FORMATS = ['md', 'json', 'html', 'xml'] as const;
const SUPPORTED_SPEC_NAMINGS = [
  'timestamp-slug',
  'slug',
  'sequence-slug',
  'date-slug',
  'datetime-slug',
  'group-timestamp-slug',
  'timestamp-group-slug',
  'group-slug',
] as const;

const CONFIG_SCHEMA_URL = `https://unpkg.com/specify-it@${packageJson.version}/schemas/specify-it.json`;
const DEFAULT_SPEC_NAMING = SUPPORTED_SPEC_NAMINGS[0];

type SpecFormat = (typeof SUPPORTED_SPEC_FORMATS)[number];

type InitOptions = {
  bare?: boolean;
  cwd?: string;
  format?: SpecFormat;
};

type InitResult = {
  created: string[];
  skipped: string[];
};

const DEFAULT_SPEC_SECTIONS = [
  'Title',
  'Objective',
  'Scope',
  'Design',
  'Examples',
  'Acceptance Criteria',
] as const;

const initCliOptionsSchema = z.object({
  bare: z.boolean().optional(),
  format: z.enum(SUPPORTED_SPEC_FORMATS).optional(),
});

export class InitCommand {
  public readonly bare: boolean;
  public readonly cwd: string | undefined;
  public readonly format: SpecFormat;

  private constructor(options: InitOptions) {
    this.bare = options.bare ?? false;
    this.cwd = options.cwd;
    this.format = options.format ?? 'md';
  }

  public static fromCliOptions(options: unknown): InitCommand {
    let parsedOptions: z.infer<typeof initCliOptionsSchema>;

    try {
      parsedOptions = initCliOptionsSchema.parse(options);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const invalidFormatIssue = error.issues.find((issue) => issue.path[0] === 'format');

        if (invalidFormatIssue) {
          throw new Error(`Invalid format. Use one of: ${SUPPORTED_SPEC_FORMATS.join(', ')}`);
        }

        throw new Error('Invalid init options.');
      }

      throw error;
    }

    const format = parsedOptions.format ?? 'md';

    return new InitCommand({
      bare: parsedOptions.bare ?? false,
      format,
    });
  }

  public static getSummary(result: InitResult): string {
    const lines = ['specify-it init complete.'];

    if (result.created.length > 0) {
      lines.push(`Created: ${result.created.join(', ')}`);
    }

    if (result.skipped.length > 0) {
      lines.push(`Skipped: ${result.skipped.join(', ')}`);
    }

    lines.push('');

    return lines.join('\n');
  }

  public async run(): Promise<InitResult> {
    const cwd = this.cwd ?? process.cwd();
    const result: InitResult = { created: [], skipped: [] };

    const specsDirectoryPath = path.join(cwd, '.specs');
    const configFilePath = path.join(cwd, 'specify-it.config.json');

    await this.ensureDirectory(specsDirectoryPath, cwd, result);
    await this.writeFileIfMissing(configFilePath, this.createConfigContent(), cwd, result);

    if (this.bare) {
      await this.writeFileIfMissing(path.join(specsDirectoryPath, '.gitkeep'), '', cwd, result);
      return result;
    }

    await this.writeFileIfMissing(
      path.join(specsDirectoryPath, this.getBootstrapSpecFileName()),
      this.createBootstrapSpecContent(),
      cwd,
      result
    );

    return result;
  }

  private createBootstrapSpecContent(): string {
    if (this.format === 'json') {
      return `${JSON.stringify(
        {
          title: 'Bootstrap Spec Example',
          objective:
            'Describe the first real change that this repository should implement with specify-it.',
          scope: [
            'capture the intent of the first implementation',
            'define the boundaries of the change',
            'list what success should look like',
          ],
          design:
            'Document the expected approach, constraints, and tradeoffs before implementation starts.',
          examples: ['Add concrete examples only when they help remove ambiguity.'],
          acceptanceCriteria: [
            'the objective is explicit',
            'the implementation scope is clear',
            'the acceptance criteria are testable',
          ],
        },
        null,
        2
      )}\n`;
    }

    if (this.format === 'html') {
      return [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '  <head>',
        '    <meta charset="UTF-8" />',
        '    <title>Bootstrap Spec Example</title>',
        '  </head>',
        '  <body>',
        '    <h1>Bootstrap Spec Example</h1>',
        '    <h2>Objective</h2>',
        '    <p>Describe the first real change that this repository should implement with specify-it.</p>',
        '    <h2>Scope</h2>',
        '    <ul>',
        '      <li>capture the intent of the first implementation</li>',
        '      <li>define the boundaries of the change</li>',
        '      <li>list what success should look like</li>',
        '    </ul>',
        '    <h2>Design</h2>',
        '    <p>Document the expected approach, constraints, and tradeoffs before implementation starts.</p>',
        '    <h2>Examples</h2>',
        '    <p>Add concrete examples only when they help remove ambiguity.</p>',
        '    <h2>Acceptance Criteria</h2>',
        '    <ul>',
        '      <li>the objective is explicit</li>',
        '      <li>the implementation scope is clear</li>',
        '      <li>the acceptance criteria are testable</li>',
        '    </ul>',
        '  </body>',
        '</html>',
        '',
      ].join('\n');
    }

    if (this.format === 'xml') {
      return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<spec>',
        '  <title>Bootstrap Spec Example</title>',
        '  <objective>Describe the first real change that this repository should implement with specify-it.</objective>',
        '  <scope>',
        '    <item>capture the intent of the first implementation</item>',
        '    <item>define the boundaries of the change</item>',
        '    <item>list what success should look like</item>',
        '  </scope>',
        '  <design>Document the expected approach, constraints, and tradeoffs before implementation starts.</design>',
        '  <examples>',
        '    <item>Add concrete examples only when they help remove ambiguity.</item>',
        '  </examples>',
        '  <acceptanceCriteria>',
        '    <item>the objective is explicit</item>',
        '    <item>the implementation scope is clear</item>',
        '    <item>the acceptance criteria are testable</item>',
        '  </acceptanceCriteria>',
        '</spec>',
        '',
      ].join('\n');
    }

    return [
      '# Bootstrap Spec Example',
      '',
      '## Objective',
      '',
      'Describe the first real change that this repository should implement with `specify-it`.',
      '',
      '## Scope',
      '',
      '- capture the intent of the first implementation',
      '- define the boundaries of the change',
      '- list what success should look like',
      '',
      '## Design',
      '',
      'Document the expected approach, constraints, and tradeoffs before implementation starts.',
      '',
      '## Examples',
      '',
      '- Add concrete examples only when they help remove ambiguity.',
      '',
      '## Acceptance Criteria',
      '',
      '- the objective is explicit',
      '- the implementation scope is clear',
      '- the acceptance criteria are testable',
      '',
    ].join('\n');
  }

  private createConfigContent(): string {
    return `${JSON.stringify(
      {
        $schema: CONFIG_SCHEMA_URL,
        specs: {
          root: '.specs',
          format: this.format,
          language: DEFAULT_SPEC_LANGUAGE,
          naming: DEFAULT_SPEC_NAMING,
          sections: {
            order: DEFAULT_SPEC_SECTIONS,
            required: ['Objective', 'Scope', 'Design', 'Acceptance Criteria'],
            optional: ['Examples'],
          },
        },
        agents: {
          syncDocuments: ['AGENTS.md', 'README.md'],
        },
        checks: {
          requireSpecsDirectory: true,
          requireOrderedSections: true,
          requireKnownExtension: true,
          commitSpecs: {
            mode: 'any',
            requireLatest: true,
          },
        },
      },
      null,
      2
    )}\n`;
  }

  private async ensureDirectory(
    targetPath: string,
    basePath: string,
    result: InitResult
  ): Promise<void> {
    if (await this.pathExists(targetPath)) {
      result.skipped.push(this.toDisplayPath(basePath, targetPath));
      return;
    }

    await mkdir(targetPath, { recursive: true });
    result.created.push(this.toDisplayPath(basePath, targetPath));
  }

  private getBootstrapSpecFileName(): string {
    return `00000000000000_initial_spec_example${this.getSpecExtension()}`;
  }

  private getSpecExtension(): `.${SpecFormat}` {
    return `.${this.format}`;
  }

  private async pathExists(targetPath: string): Promise<boolean> {
    try {
      await stat(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  private toDisplayPath(basePath: string, targetPath: string): string {
    return path.relative(basePath, targetPath) || targetPath;
  }

  private async writeFileIfMissing(
    targetPath: string,
    content: string,
    basePath: string,
    result: InitResult
  ): Promise<void> {
    if (await this.pathExists(targetPath)) {
      result.skipped.push(this.toDisplayPath(basePath, targetPath));
      return;
    }

    await writeFile(targetPath, content, 'utf8');
    result.created.push(this.toDisplayPath(basePath, targetPath));
  }
}
