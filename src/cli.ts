import { cac } from 'cac';
import packageJson from '../package.json' with { type: 'json' };

export function createCli(): ReturnType<typeof cac> {
  const cli = cac('spec-it');

  cli.version(packageJson.version).help().usage('[options]').example('spec-it').example('spec-it --help');

  return cli;
}

export async function runCli(argv: string[]): Promise<number> {
  const cli = createCli();

  await cli.parse(['node', 'spec-it', ...argv], { run: false });

  if (argv.length === 0) {
    cli.outputHelp();
  } else if (cli.args.length > 0) {
    cli.outputHelp();
    console.error(`Unknown command: ${cli.args[0]}`);
    return 1;
  }

  return 0;
}
