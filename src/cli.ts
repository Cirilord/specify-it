import { cac } from 'cac';

import packageJson from '../package.json' with { type: 'json' };
import { InitCommand } from './commands/init.js';

export function createCli(): ReturnType<typeof cac> {
  const cli = cac('specify-it');

  cli
    .version(packageJson.version)
    .help()
    .usage('[options]')
    .example('specify-it')
    .example('specify-it --help');

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

  return cli;
}

export async function runCli(argv: string[]): Promise<number> {
  const cli = createCli();
  cli.parse(['node', 'specify-it', ...argv], { run: false });

  try {
    if (argv.length === 0) {
      cli.outputHelp();
      return 0;
    }

    if (argv[0] !== 'init' && !argv[0]?.startsWith('-')) {
      cli.outputHelp();
      console.error(`Unknown command: ${argv[0]}`);
      return 1;
    }

    await cli.runMatchedCommand();
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unknown CLI error');
    return 1;
  }
}
