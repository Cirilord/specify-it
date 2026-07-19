import { beforeEach, describe, expect, it, vi } from 'vitest';

const runCliMock = vi.fn<(argv: string[]) => Promise<number>>();

vi.mock('./cli.js', () => {
  return {
    runCli: runCliMock,
  };
});

describe('bin', (): void => {
  beforeEach((): void => {
    runCliMock.mockReset();
    process.exitCode = undefined;
  });

  it('executes the CLI entrypoint when imported', async (): Promise<void> => {
    runCliMock.mockResolvedValueOnce(0);
    vi.resetModules();

    await import('./bin.js');

    expect(runCliMock).toHaveBeenCalledTimes(1);
    expect(runCliMock).toHaveBeenCalledWith([]);
    expect(process.exitCode).toBeUndefined();
  });

  it('propagates a non-zero exit code', async (): Promise<void> => {
    runCliMock.mockResolvedValueOnce(1);
    vi.resetModules();

    await import('./bin.js');

    expect(runCliMock).toHaveBeenCalledTimes(1);
    expect(process.exitCode).toBe(1);
  });
});
