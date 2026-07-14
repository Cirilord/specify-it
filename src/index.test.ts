import { describe, expect, it, vi } from 'vitest';

const runCliMock = vi.fn<(argv: string[]) => number>();

vi.mock('./cli.js', () => {
  return {
    runCli: runCliMock,
  };
});

describe('main', (): void => {
  it('delegates argv to runCli', async (): Promise<void> => {
    runCliMock.mockReturnValueOnce(0);

    const { main } = await import('./index.js');

    const exitCode = main(['--help']);

    expect(exitCode).toBe(0);
    expect(runCliMock).toHaveBeenCalledWith(['--help']);
  });
});
