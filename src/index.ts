import { fileURLToPath } from 'node:url';

export function getReadyMessage(): string {
  return 'spec-it CLI foundation is ready.\n';
}

export function main(): void {
  process.stdout.write(getReadyMessage());
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
