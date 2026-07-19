import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import {
  buildSpecFileName,
  createSlug,
  getSequenceFromFileName,
  isNamingUsingGroup,
  type SpecNaming,
  SUPPORTED_SPEC_NAMINGS,
} from '../utils/spec-naming.js';

const SUPPORTED_SPEC_FORMATS = ['md', 'json', 'html', 'xml'] as const;
const CONFIG_FILE_NAME = 'specify-it.config.json';
const SUPPORTED_NEW_SPEC_FORMAT = 'md';

type SpecFormat = (typeof SUPPORTED_SPEC_FORMATS)[number];

type NewOptions = {
  cwd: string | undefined;
  group: string | undefined;
  title: string;
};

type NewResult = {
  created: string;
};

type SpecsConfig = {
  format: SpecFormat;
  groups: string[] | undefined;
  naming: SpecNaming;
  root: string;
  sections: {
    order: string[];
  };
};

const titleSchema = z.string().trim().min(1);
const groupSchema = z.string().trim().min(1);

const newCliOptionsSchema = z.object({
  group: groupSchema.optional(),
  title: titleSchema,
});

const groupsConfigSchema = z.array(groupSchema).min(1);

const configSchema = z.object({
  specs: z.object({
    format: z.enum(SUPPORTED_SPEC_FORMATS),
    groups: groupsConfigSchema.optional(),
    naming: z.enum(SUPPORTED_SPEC_NAMINGS),
    root: z.string().trim().min(1),
    sections: z.object({
      order: z.array(z.string().trim().min(1)).min(1),
    }),
  }),
});

export class NewCommand {
  public readonly cwd: string | undefined;
  public readonly group: string | undefined;
  public readonly title: string;

  private constructor(options: NewOptions) {
    this.cwd = options.cwd;
    this.group = options.group;
    this.title = options.title;
  }

  public static fromCliOptions(options: unknown): NewCommand {
    let parsedOptions: z.infer<typeof newCliOptionsSchema>;
    try {
      parsedOptions = newCliOptionsSchema.parse(options);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const titleIssue = error.issues.find((issue) => issue.path[0] === 'title');

        if (titleIssue !== undefined) {
          throw new Error('Missing required title. Use --title "<title>".');
        }

        throw new Error('Invalid new options.');
      }

      throw error;
    }

    return new NewCommand({
      cwd: undefined,
      group: parsedOptions.group,
      title: parsedOptions.title,
    });
  }

  public static getSummary(result: NewResult): string {
    return ['specify-it new complete.', `Created: ${result.created}`, ''].join('\n');
  }

  public async run(): Promise<NewResult> {
    const cwd = this.cwd ?? process.cwd();
    const config = await this.loadConfig(cwd);

    if (config.format !== SUPPORTED_NEW_SPEC_FORMAT) {
      throw new Error(
        `Unsupported spec format for new: ${config.format}. Only ${SUPPORTED_NEW_SPEC_FORMAT} is currently supported.`
      );
    }

    const group = this.resolveGroup(config.naming, config.groups);
    const targetDirectoryPath =
      group === undefined ? path.join(cwd, config.root) : path.join(cwd, config.root, group);
    const titleSlug = createSlug(this.title);
    const targetFileName = buildSpecFileName({
      format: config.format,
      group,
      naming: config.naming,
      sequenceNumber: await this.getNextSequenceNumber(targetDirectoryPath, config.format),
      slug: titleSlug,
      timestamp: new Date(),
    });
    const targetFilePath = path.join(targetDirectoryPath, targetFileName);

    try {
      await readFile(targetFilePath, 'utf8');
      throw new Error(`Spec file already exists: ${this.toDisplayPath(cwd, targetFilePath)}`);
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
        throw error;
      }
    }

    await mkdir(targetDirectoryPath, { recursive: true });
    await writeFile(
      targetFilePath,
      this.createMarkdownScaffold(this.title, config.sections.order),
      'utf8'
    );

    return {
      created: this.toDisplayPath(cwd, targetFilePath),
    };
  }

  private createMarkdownScaffold(title: string, sectionsOrder: string[]): string {
    const lines = [`# ${title.trim()}`, ''];

    for (const sectionName of sectionsOrder) {
      if (sectionName === 'Title') {
        continue;
      }

      lines.push(`## ${sectionName}`, '');
    }

    return `${lines.join('\n')}\n`;
  }

  private async getNextSequenceNumber(directoryPath: string, format: SpecFormat): Promise<number> {
    try {
      const entries = await readdir(directoryPath, { withFileTypes: true });
      const highestSequence = entries
        .filter((entry) => entry.isFile())
        .map((entry) => getSequenceFromFileName(entry.name, format))
        .filter((value): value is number => value !== undefined)
        .sort((left, right) => right - left)
        .at(0);

      return (highestSequence ?? 0) + 1;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return 1;
      }

      throw error;
    }
  }

  private async loadConfig(cwd: string): Promise<SpecsConfig> {
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
        format: config.specs.format,
        groups: config.specs.groups,
        naming: config.specs.naming,
        root: config.specs.root,
        sections: config.specs.sections,
      };
    } catch {
      throw new Error(`Invalid ${CONFIG_FILE_NAME}.`);
    }
  }

  private resolveGroup(naming: SpecNaming, groups: string[] | undefined): string | undefined {
    if (groups === undefined) {
      if (this.group !== undefined) {
        throw new Error('This repository does not define spec groups.');
      }

      if (isNamingUsingGroup(naming)) {
        throw new Error(`Naming strategy "${naming}" requires specs.groups to be configured.`);
      }

      return undefined;
    }

    if (this.group !== undefined) {
      if (!groups.includes(this.group)) {
        throw new Error(`Invalid group "${this.group}". Use one of: ${groups.join(', ')}`);
      }

      return this.group;
    }

    throw new Error(`Missing required group. Use --group with one of: ${groups.join(', ')}`);
  }

  private toDisplayPath(basePath: string, targetPath: string): string {
    return path.relative(basePath, targetPath) || targetPath;
  }
}
