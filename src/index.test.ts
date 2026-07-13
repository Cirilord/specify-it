import { describe, expect, it } from 'vitest';

import { getReadyMessage } from './index.js';

describe('getReadyMessage', (): void => {
  it('returns the current CLI foundation message', (): void => {
    expect(getReadyMessage()).toBe('spec-it CLI foundation is ready.\n');
  });
});
