import { execFile } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';

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
const CONFIG_FILE_NAME = 'specify-it.config.json';
const BOOTSTRAP_SPEC_FILE_BASENAME = '00000000000000_initial_spec_example';
const TIMESTAMP_SLUG_NAMING = 'timestamp-slug';
const execFileAsync = promisify(execFile);

type SpecFormat = (typeof SUPPORTED_SPEC_FORMATS)[number];
type SpecNaming = (typeof SUPPORTED_SPEC_NAMINGS)[number];
type CommitSpecsMode = 'none' | 'one' | 'any';

type CheckResult = {
  errors: string[];
};

type SpecsConfig = {
  format: SpecFormat;
  groups: string[] | undefined;
  naming: SpecNaming;
  root: string;
  sections: {
    optional: string[];
    order: string[];
    required: string[];
  };
};

type ChecksConfig = {
  commitSpecs:
    | {
        maxChangedSpecs?: number | undefined;
        mode: CommitSpecsMode;
        requireLatest: boolean;
      }
    | undefined;
  requireKnownExtension: boolean;
  requireOrderedSections: boolean;
  requireSpecsDirectory: boolean;
};

type RepositoryConfig = {
  checks: ChecksConfig;
  specs: SpecsConfig;
};

type SpecFile = {
  absolutePath: string;
  displayPath: string;
  group: string | undefined;
};

type ChangedSpecFile = {
  absolutePath: string;
  directoryPath: string;
  displayPath: string;
  isNew: boolean;
};

const groupSchema = z.string().trim().min(1);

const configSchema = z.object({
  checks: z.object({
    commitSpecs: z
      .object({
        maxChangedSpecs: z.number().int().positive().optional(),
        mode: z.enum(['none', 'one', 'any']),
        requireLatest: z.boolean(),
      })
      .optional(),
    requireKnownExtension: z.boolean(),
    requireOrderedSections: z.boolean(),
    requireSpecsDirectory: z.boolean(),
  }),
  specs: z.object({
    format: z.enum(SUPPORTED_SPEC_FORMATS),
    groups: z.array(groupSchema).min(1).optional(),
    naming: z.enum(SUPPORTED_SPEC_NAMINGS),
    root: z.string().trim().min(1),
    sections: z.object({
      optional: z.array(z.string().trim().min(1)),
      order: z.array(z.string().trim().min(1)).min(1),
      required: z.array(z.string().trim().min(1)),
    }),
  }),
});

export class CheckCommand {
  public readonly cwd: string | undefined;

  private constructor(cwd: string | undefined) {
    this.cwd = cwd;
  }

  public static fromCliOptions(options: unknown): CheckCommand {
    if (options !== undefined && (typeof options !== 'object' || options === null)) {
      throw new Error('Invalid check options.');
    }

    return new CheckCommand(undefined);
  }

  public static getSummary(result: CheckResult): string {
    if (result.errors.length === 0) {
      return ['specify-it check complete.', 'Repository passed validation.', ''].join('\n');
    }

    return [...result.errors, ''].join('\n');
  }

  public async run(): Promise<CheckResult> {
    const cwd = this.cwd ?? process.cwd();
    const config = await this.loadConfig(cwd);
    const errors: string[] = [];
    const specsRootPath = path.join(cwd, config.specs.root);
    const specsRootExists = await this.pathExists(specsRootPath);

    if (config.checks.requireSpecsDirectory && !specsRootExists) {
      errors.push(`Missing specs directory: ${config.specs.root}`);
      return { errors };
    }

    if (!specsRootExists) {
      return { errors };
    }

    if (config.specs.naming !== TIMESTAMP_SLUG_NAMING) {
      errors.push(
        `Unsupported spec naming for check: ${config.specs.naming}. Only ${TIMESTAMP_SLUG_NAMING} is currently supported.`
      );
      return { errors };
    }

    const specFiles = await this.collectSpecFiles(cwd, specsRootPath, config.specs.groups, errors);
    await Promise.all(
      specFiles.map(async (specFile) => {
        const fileErrors = await this.validateSpecFile(specFile, config);
        errors.push(...fileErrors);
      })
    );

    if (config.checks.commitSpecs !== undefined) {
      errors.push(...(await this.validateCommitAwareRules(cwd, config)));
    }

    return { errors };
  }

  private async collectSpecFiles(
    cwd: string,
    specsRootPath: string,
    groups: string[] | undefined,
    errors: string[]
  ): Promise<SpecFile[]> {
    const directoryEntries = await readdir(specsRootPath, { withFileTypes: true });
    const specFiles: SpecFile[] = [];

    for (const entry of directoryEntries) {
      if (entry.name.startsWith('.')) {
        continue;
      }

      const entryPath = path.join(specsRootPath, entry.name);

      if (groups === undefined) {
        if (entry.isDirectory()) {
          errors.push(
            `Invalid spec path: ${this.toDisplayPath(cwd, entryPath)} must not be nested when specs.groups is not configured.`
          );
          continue;
        }

        specFiles.push({
          absolutePath: entryPath,
          displayPath: this.toDisplayPath(cwd, entryPath),
          group: undefined,
        });
        continue;
      }

      if (!entry.isDirectory()) {
        errors.push(
          `Invalid spec path: ${this.toDisplayPath(cwd, entryPath)} must be inside one of the configured group directories.`
        );
        continue;
      }

      if (!groups.includes(entry.name)) {
        errors.push(
          `Invalid spec group directory: ${this.toDisplayPath(cwd, entryPath)} is not one of: ${groups.join(', ')}`
        );
        continue;
      }

      const groupEntries = await readdir(entryPath, { withFileTypes: true });

      for (const groupEntry of groupEntries) {
        if (groupEntry.name.startsWith('.')) {
          continue;
        }

        const groupEntryPath = path.join(entryPath, groupEntry.name);

        if (groupEntry.isDirectory()) {
          errors.push(
            `Invalid spec path: ${this.toDisplayPath(cwd, groupEntryPath)} must live directly under the configured group directory.`
          );
          continue;
        }

        specFiles.push({
          absolutePath: groupEntryPath,
          displayPath: this.toDisplayPath(cwd, groupEntryPath),
          group: entry.name,
        });
      }
    }

    return specFiles;
  }

  private findDuplicates(values: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const value of values) {
      if (seen.has(value)) {
        duplicates.add(value);
        continue;
      }

      seen.add(value);
    }

    return [...duplicates];
  }

  private async getGitChangedEntries(
    cwd: string
  ): Promise<Array<{ path: string; status: string }>> {
    try {
      const { stdout } = await execFileAsync(
        'git',
        ['status', '--porcelain', '--untracked-files=all'],
        { cwd }
      );

      return stdout
        .split(/\r?\n/u)
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0)
        .map((line) => this.parseGitStatusLine(line));
    } catch {
      throw new Error('Could not resolve Git context for commit-aware checks.');
    }
  }

  private async getLatestTimestampInDirectory(
    directoryPath: string,
    format: SpecFormat
  ): Promise<string | undefined> {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    const timestamps = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => this.isRealTimestampSlugFileName(fileName, format))
      .map((fileName) => this.getTimestampFromFileName(fileName))
      .filter((timestamp): timestamp is string => timestamp !== undefined);

    return timestamps.sort().at(-1);
  }

  private getTimestampFromFileName(fileName: string): string | undefined {
    const match = fileName.match(/^(\d{14})_[a-z0-9]+(?:-[a-z0-9]+)*\.[^.]+$/u);
    return match?.[1];
  }

  private isGitAddedStatus(status: string): boolean {
    return status === '??' || status.includes('A');
  }

  private isRealTimestampSlugFileName(fileName: string, format: SpecFormat): boolean {
    if (fileName === `${BOOTSTRAP_SPEC_FILE_BASENAME}.${format}`) {
      return false;
    }

    const pattern = new RegExp(`^\\d{14}_[a-z0-9]+(?:-[a-z0-9]+)*\\.${format}$`, 'u');
    return pattern.test(fileName);
  }

  private isTimestampSlugFileName(fileName: string, format: SpecFormat): boolean {
    if (fileName === `${BOOTSTRAP_SPEC_FILE_BASENAME}.${format}`) {
      return true;
    }

    const pattern = new RegExp(`^\\d{14}_[a-z0-9]+(?:-[a-z0-9]+)*\\.${format}$`, 'u');
    return pattern.test(fileName);
  }

  private async loadConfig(cwd: string): Promise<RepositoryConfig> {
    const configFilePath = path.join(cwd, CONFIG_FILE_NAME);

    let fileContent: string;
    try {
      fileContent = await readFile(configFilePath, 'utf8');
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`Could not find ${CONFIG_FILE_NAME} in ${cwd}.`);
      }

      throw error;
    }

    let parsedConfig: unknown;
    try {
      parsedConfig = JSON.parse(fileContent);
    } catch {
      throw new Error(`Invalid ${CONFIG_FILE_NAME}. Expected valid JSON.`);
    }

    try {
      const config = configSchema.parse(parsedConfig);

      return {
        checks: {
          commitSpecs: config.checks.commitSpecs,
          requireKnownExtension: config.checks.requireKnownExtension,
          requireOrderedSections: config.checks.requireOrderedSections,
          requireSpecsDirectory: config.checks.requireSpecsDirectory,
        },
        specs: {
          format: config.specs.format,
          groups: config.specs.groups,
          naming: config.specs.naming,
          root: config.specs.root,
          sections: config.specs.sections,
        },
      };
    } catch {
      throw new Error(`Invalid ${CONFIG_FILE_NAME}.`);
    }
  }

  private parseGitStatusLine(line: string): { path: string; status: string } {
    const status = line.slice(0, 2);
    const rawPath = line.slice(3);
    const pathValue = rawPath.includes(' -> ')
      ? (rawPath.split(' -> ').at(-1) ?? rawPath)
      : rawPath;

    return {
      path: pathValue,
      status,
    };
  }

  private async pathExists(targetPath: string): Promise<boolean> {
    try {
      await stat(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  private toChangedSpecFile(
    cwd: string,
    relativePath: string,
    status: string,
    config: RepositoryConfig
  ): ChangedSpecFile | undefined {
    const normalizedPath = relativePath.replaceAll('\\', '/');
    const specsRoot = config.specs.root.replaceAll('\\', '/').replace(/\/+$/u, '');
    const specsRootPrefix = `${specsRoot}/`;

    if (!(normalizedPath === specsRoot || normalizedPath.startsWith(specsRootPrefix))) {
      return undefined;
    }

    if (path.extname(normalizedPath) !== `.${config.specs.format}`) {
      return undefined;
    }

    return {
      absolutePath: path.join(cwd, normalizedPath),
      directoryPath: path.dirname(path.join(cwd, normalizedPath)),
      displayPath: normalizedPath,
      isNew: this.isGitAddedStatus(status),
    };
  }

  private toDisplayPath(basePath: string, targetPath: string): string {
    return path.relative(basePath, targetPath) || targetPath;
  }

  private async validateCommitAwareRules(cwd: string, config: RepositoryConfig): Promise<string[]> {
    const commitSpecs = config.checks.commitSpecs;

    if (commitSpecs === undefined) {
      return [];
    }

    const changedEntries = await this.getGitChangedEntries(cwd);
    const changedSpecFiles = changedEntries
      .map((entry) => this.toChangedSpecFile(cwd, entry.path, entry.status, config))
      .filter((entry): entry is ChangedSpecFile => entry !== undefined);
    const errors: string[] = [];

    if (commitSpecs.mode === 'one' && changedSpecFiles.length === 0) {
      errors.push('Missing required spec change: checks.commitSpecs.mode is "one".');
    }

    if (commitSpecs.mode === 'none' && changedSpecFiles.length > 0) {
      errors.push('Unexpected spec change: checks.commitSpecs.mode is "none".');
    }

    if (
      commitSpecs.maxChangedSpecs !== undefined &&
      changedSpecFiles.length > commitSpecs.maxChangedSpecs
    ) {
      errors.push(
        `Too many spec changes: checks.commitSpecs.maxChangedSpecs is ${commitSpecs.maxChangedSpecs}, but found ${changedSpecFiles.length} changed spec files.`
      );
    }

    if (!commitSpecs.requireLatest) {
      return errors;
    }

    if (config.specs.naming !== TIMESTAMP_SLUG_NAMING) {
      errors.push(
        `Unsupported spec naming for commit-aware check: ${config.specs.naming}. Only ${TIMESTAMP_SLUG_NAMING} is currently supported.`
      );
      return errors;
    }

    const newSpecFiles = changedSpecFiles.filter((specFile) => specFile.isNew);

    for (const specFile of newSpecFiles) {
      if (
        !this.isRealTimestampSlugFileName(path.basename(specFile.absolutePath), config.specs.format)
      ) {
        continue;
      }

      const latestTimestamp = await this.getLatestTimestampInDirectory(
        specFile.directoryPath,
        config.specs.format
      );
      const currentTimestamp = this.getTimestampFromFileName(path.basename(specFile.absolutePath));

      if (
        latestTimestamp !== undefined &&
        currentTimestamp !== undefined &&
        currentTimestamp < latestTimestamp
      ) {
        errors.push(
          `Spec is not the latest in its directory: ${specFile.displayPath} must be the newest timestamp-slug spec in ${this.toDisplayPath(cwd, specFile.directoryPath)}.`
        );
      }
    }

    return errors;
  }

  private validateMarkdownStructure(
    displayPath: string,
    content: string,
    sections: SpecsConfig['sections'],
    options: { requireOrderedSections: boolean }
  ): string[] {
    const errors: string[] = [];
    const lines = content.split(/\r?\n/u);
    const headings = lines
      .map((line, index) => ({ index, line: line.trim() }))
      .filter(({ line }) => line.startsWith('#'));

    const titleHeadings = headings.filter(({ line }) => /^#\s+\S/u.test(line));
    if (titleHeadings.length === 0) {
      errors.push(`Missing title heading: ${displayPath} must start with a "# ..." heading.`);
      return errors;
    }
    if (titleHeadings[0]?.index !== lines.findIndex((line) => line.trim().length > 0)) {
      errors.push(`Invalid title position: ${displayPath} must start with the title heading.`);
    }
    if (titleHeadings.length > 1) {
      errors.push(`Invalid title heading: ${displayPath} must contain only one top-level title.`);
    }

    const sectionHeadings = headings
      .filter(({ line }) => /^##\s+\S/u.test(line))
      .map(({ line }) => line.replace(/^##\s+/u, ''));
    const allowedSections = new Set(sections.order.filter((section) => section !== 'Title'));
    for (const sectionHeading of sectionHeadings) {
      if (!allowedSections.has(sectionHeading)) {
        errors.push(
          `Invalid section heading: ${displayPath} contains unsupported section "${sectionHeading}".`
        );
      }
    }

    const duplicateSections = this.findDuplicates(sectionHeadings);
    for (const duplicateSection of duplicateSections) {
      errors.push(
        `Duplicate section heading: ${displayPath} contains "${duplicateSection}" more than once.`
      );
    }

    const presentSections = new Set(sectionHeadings);
    for (const requiredSection of sections.required) {
      if (requiredSection === 'Title') {
        continue;
      }

      if (!presentSections.has(requiredSection)) {
        errors.push(
          `Missing required section: ${displayPath} must include "## ${requiredSection}".`
        );
      }
    }

    if (options.requireOrderedSections) {
      const expectedOrder = sections.order.filter((section) => section !== 'Title');
      const actualOrder = sectionHeadings.filter((section) => allowedSections.has(section));
      let previousIndex = -1;

      for (const sectionHeading of actualOrder) {
        const currentIndex = expectedOrder.indexOf(sectionHeading);

        if (currentIndex < previousIndex) {
          errors.push(
            `Invalid section order: ${displayPath} does not follow the configured section order.`
          );
          break;
        }

        previousIndex = currentIndex;
      }
    }

    return errors;
  }

  private async validateSpecFile(specFile: SpecFile, config: RepositoryConfig): Promise<string[]> {
    const errors: string[] = [];
    const extension = path.extname(specFile.absolutePath);
    const expectedExtension = `.${config.specs.format}`;

    if (config.checks.requireKnownExtension && extension !== expectedExtension) {
      errors.push(`Invalid spec extension: ${specFile.displayPath} must use ${expectedExtension}.`);
    }

    if (!this.isTimestampSlugFileName(path.basename(specFile.absolutePath), config.specs.format)) {
      errors.push(
        `Invalid spec filename: ${specFile.displayPath} must match YYYYMMDDHHMMSS_slug${expectedExtension}.`
      );
    }

    if (config.specs.format === 'md') {
      const content = await readFile(specFile.absolutePath, 'utf8');
      errors.push(
        ...this.validateMarkdownStructure(specFile.displayPath, content, config.specs.sections, {
          requireOrderedSections: config.checks.requireOrderedSections,
        })
      );
    }

    return errors;
  }
}
