import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import { type SpecNaming, SUPPORTED_SPEC_NAMINGS } from '../utils/spec-naming.js';

const SUPPORTED_SPEC_FORMATS = ['md', 'json', 'html', 'xml'] as const;
const CONFIG_FILE_NAME = 'specify-it.config.json';

type SpecFormat = (typeof SUPPORTED_SPEC_FORMATS)[number];
type CommitSpecsMode = 'none' | 'one' | 'any';

type PrintConfigOptions = {
  cwd: string | undefined;
  json: boolean;
};

type RepositoryConfig = {
  agents: {
    syncDocuments: string[];
  };
  checks: {
    commitSpecs?:
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
  specs: {
    format: SpecFormat;
    groups?: string[] | undefined;
    language: string;
    naming: SpecNaming;
    root: string;
    sections: {
      optional: string[];
      order: string[];
      required: string[];
    };
  };
};

const nonEmptyStringSchema = z.string().trim().min(1);

const printConfigCliOptionsSchema = z.object({
  json: z.literal(true),
});

const configSchema = z.object({
  agents: z.object({
    syncDocuments: z.array(nonEmptyStringSchema),
  }),
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
    groups: z.array(nonEmptyStringSchema).min(1).optional(),
    language: nonEmptyStringSchema,
    naming: z.enum(SUPPORTED_SPEC_NAMINGS),
    root: nonEmptyStringSchema,
    sections: z.object({
      optional: z.array(nonEmptyStringSchema),
      order: z.array(nonEmptyStringSchema).min(1),
      required: z.array(nonEmptyStringSchema),
    }),
  }),
});

export class PrintConfigCommand {
  public readonly cwd: string | undefined;
  public readonly json: boolean;

  private constructor(options: PrintConfigOptions) {
    this.cwd = options.cwd;
    this.json = options.json;
  }

  public static fromCliOptions(options: unknown): PrintConfigCommand {
    try {
      const parsedOptions = printConfigCliOptionsSchema.parse(options);

      return new PrintConfigCommand({
        cwd: undefined,
        json: parsedOptions.json,
      });
    } catch {
      throw new Error('print-config currently requires --json.');
    }
  }

  public static getSummary(result: RepositoryConfig): string {
    return `${JSON.stringify(result)}\n`;
  }

  public async run(): Promise<RepositoryConfig> {
    const cwd = this.cwd ?? process.cwd();
    return this.loadConfig(cwd);
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
      return configSchema.parse(parsedConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid ${CONFIG_FILE_NAME}.`);
      }

      throw error;
    }
  }
}
