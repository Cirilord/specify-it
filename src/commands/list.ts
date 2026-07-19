import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import {
  isNamingUsingGroup,
  type SpecNaming,
  SUPPORTED_SPEC_NAMINGS,
  validateSpecFileName,
} from '../utils/spec-naming.js';

const SUPPORTED_SPEC_FORMATS = ['md', 'json', 'html', 'xml'] as const;
const CONFIG_FILE_NAME = 'specify-it.config.json';

type SpecFormat = (typeof SUPPORTED_SPEC_FORMATS)[number];

type ListOptions = {
  cwd: string | undefined;
  json: boolean;
};

type SpecsConfig = {
  format: SpecFormat;
  groups: string[] | undefined;
  naming: SpecNaming;
  root: string;
};

type ChecksConfig = {
  requireSpecsDirectory: boolean;
};

type RepositoryConfig = {
  checks: ChecksConfig;
  specs: SpecsConfig;
};

export type ListedSpec = {
  format: SpecFormat;
  group: string | null;
  naming: SpecNaming;
  path: string;
};

export type ListResult = {
  count: number;
  errors: string[];
  specs: ListedSpec[];
};

type DiscoveredSpec = {
  absolutePath: string;
  displayPath: string;
  group: string | undefined;
};

const groupSchema = z.string().trim().min(1);

const listCliOptionsSchema = z.object({
  json: z.boolean().optional(),
});

const configSchema = z.object({
  checks: z.object({
    requireSpecsDirectory: z.boolean(),
  }),
  specs: z.object({
    format: z.enum(SUPPORTED_SPEC_FORMATS),
    groups: z.array(groupSchema).min(1).optional(),
    naming: z.enum(SUPPORTED_SPEC_NAMINGS),
    root: z.string().trim().min(1),
  }),
});

export class ListCommand {
  public readonly cwd: string | undefined;
  public readonly json: boolean;

  private constructor(options: ListOptions) {
    this.cwd = options.cwd;
    this.json = options.json;
  }

  public static fromCliOptions(options: unknown): ListCommand {
    let parsedOptions: z.infer<typeof listCliOptionsSchema>;

    try {
      parsedOptions = listCliOptionsSchema.parse(options);
    } catch {
      throw new Error('Invalid list options.');
    }

    return new ListCommand({
      cwd: undefined,
      json: parsedOptions.json ?? false,
    });
  }

  public static getJsonSummary(result: ListResult): string {
    return `${JSON.stringify(
      result.errors.length === 0
        ? { count: result.count, specs: result.specs }
        : { count: result.count, errors: result.errors, specs: result.specs },
      null,
      2
    )}\n`;
  }

  public static getSummary(result: ListResult): string {
    if (result.errors.length > 0) {
      return [...result.errors, ''].join('\n');
    }

    const lines = result.specs.map((spec) => spec.path);
    lines.push(`${result.count} specs found.`, '');
    return lines.join('\n');
  }

  public async run(): Promise<ListResult> {
    const cwd = this.cwd ?? process.cwd();
    const config = await this.loadConfig(cwd);
    const specsRootPath = path.join(cwd, config.specs.root);
    const specsRootExists = await this.pathExists(specsRootPath);
    const errors: string[] = [];

    if (config.checks.requireSpecsDirectory && !specsRootExists) {
      errors.push(`Missing specs directory: ${config.specs.root}`);
      return { count: 0, errors, specs: [] };
    }

    if (!specsRootExists) {
      return { count: 0, errors, specs: [] };
    }

    if (isNamingUsingGroup(config.specs.naming) && config.specs.groups === undefined) {
      errors.push(
        `Invalid spec naming configuration: ${config.specs.naming} requires specs.groups to be configured.`
      );
      return { count: 0, errors, specs: [] };
    }

    const discoveredSpecs = await this.collectSpecFiles(
      cwd,
      specsRootPath,
      config.specs.groups,
      errors
    );

    for (const spec of discoveredSpecs) {
      if (
        !validateSpecFileName(path.basename(spec.absolutePath), {
          format: config.specs.format,
          group: spec.group,
          naming: config.specs.naming,
        })
      ) {
        errors.push(`Invalid spec filename: ${spec.displayPath}`);
      }
    }

    if (errors.length > 0) {
      return { count: 0, errors, specs: [] };
    }

    const specs = discoveredSpecs.map((spec) => ({
      format: config.specs.format,
      group: spec.group ?? null,
      naming: config.specs.naming,
      path: spec.displayPath,
    }));

    return {
      count: specs.length,
      errors,
      specs,
    };
  }

  private async collectSpecFiles(
    cwd: string,
    specsRootPath: string,
    groups: string[] | undefined,
    errors: string[]
  ): Promise<DiscoveredSpec[]> {
    const directoryEntries = await readdir(specsRootPath, { withFileTypes: true });
    const specs: DiscoveredSpec[] = [];

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

        specs.push({
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

        specs.push({
          absolutePath: groupEntryPath,
          displayPath: this.toDisplayPath(cwd, groupEntryPath),
          group: entry.name,
        });
      }
    }

    return specs.sort((left, right) => left.displayPath.localeCompare(right.displayPath));
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
          requireSpecsDirectory: config.checks.requireSpecsDirectory,
        },
        specs: {
          format: config.specs.format,
          groups: config.specs.groups,
          naming: config.specs.naming,
          root: config.specs.root,
        },
      };
    } catch {
      throw new Error(`Invalid ${CONFIG_FILE_NAME}.`);
    }
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
}
