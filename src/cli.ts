import { cac } from 'cac';

import packageJson from '../package.json' with { type: 'json' };
import { CheckCommand } from './commands/check.js';
import { InitCommand } from './commands/init.js';
import { NewCommand } from './commands/new.js';

const SUPPORTED_COMMANDS = new Set(['check', 'init', 'new']);

export function createCli(): ReturnType<typeof cac> {
  const cli = cac('specify-it');

  cli
    .version(packageJson.version)
    .help()
    .usage('[options]')
    .example('specify-it')
    .example('specify-it --help');

  cli
    .command('check', 'Validate repository specs against the repository configuration')
    .option('--json', 'Print the result as JSON')
    .example('specify-it check')
    .example('specify-it check --json')
    .action(async (options) => {
      const command = CheckCommand.fromCliOptions(options);
      try {
        const result = await command.run();
        console.info(
          command.json ? CheckCommand.getJsonSummary(result) : CheckCommand.getSummary(result)
        );

        if (result.errors.length > 0) {
          process.exitCode = 1;
        }
      } catch (error) {
        if (!command.json) {
          throw error;
        }

        const result = {
          changedSpecs: 0,
          checkedSpecs: 0,
          errors: [error instanceof Error ? error.message : 'Unknown CLI error'],
        };
        console.info(CheckCommand.getJsonSummary(result));
        process.exitCode = 1;
      }
    });

  cli
    .command('init', 'Bootstrap specify-it in the current project')
    .option('--bare', 'Skip creating the bootstrap spec example')
    .option('--format <format>', 'Set the generated spec format')
    .example('specify-it init')
    .example('specify-it init --bare')
    .example('specify-it init --format=json')
    .action(async (options) => {
      const command = InitCommand.fromCliOptions(options);
      const result = await command.run();

      console.info(InitCommand.getSummary(result));
    });

  cli
    .command('new', 'Create a new spec scaffold from the repository configuration')
    .option('--group <group>', 'Select the configured spec group')
    .option('--title <title>', 'Set the spec title')
    .example('specify-it new --title="bootstrap release workflow"')
    .example('specify-it new --title="add config loader" --group=feat')
    .action(async (options) => {
      const command = NewCommand.fromCliOptions(options);
      const result = await command.run();

      console.info(NewCommand.getSummary(result));
    });

  return cli;
}

export async function runCli(argv: string[]): Promise<number> {
  const cli = createCli();
  cli.parse(['node', 'specify-it', ...argv], { run: false });
  process.exitCode = undefined;

  try {
    if (argv.length === 0) {
      cli.outputHelp();
      return 0;
    }

    if (!SUPPORTED_COMMANDS.has(argv[0] ?? '') && !argv[0]?.startsWith('-')) {
      cli.outputHelp();
      console.error(`Unknown command: ${argv[0]}`);
      return 1;
    }

    await cli.runMatchedCommand();
    return process.exitCode ?? 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unknown CLI error');
    return 1;
  }
}
