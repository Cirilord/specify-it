import { describe, expect, it, vi } from 'vitest';

const runCliMock = vi.fn<(argv: string[]) => Promise<number>>();

vi.mock('./cli.js', () => {
  return {
    runCli: runCliMock,
  };
});

describe('main', (): void => {
  it('delegates argv to runCli', async (): Promise<void> => {
    runCliMock.mockResolvedValueOnce(0);

    const { main } = await import('./index.js');

    const exitCode = await main(['--help']);

    expect(exitCode).toBe(0);
    expect(runCliMock).toHaveBeenCalledWith(['--help']);
  });
});
