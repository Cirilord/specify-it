import { describe, expect, it } from 'vitest';

import {
  buildSpecFileName,
  createSlug,
  getBootstrapSpecFileName,
  getFileNameExpectation,
  getSequenceFromFileName,
  isNamingSupportedForCommitAwareRecency,
  isNamingUsingGroup,
  isRealTimestampSlugFileName,
  validateSpecFileName,
} from './spec-naming.js';

describe('spec-naming', (): void => {
  it('creates slugs with normalized separators', (): void => {
    expect(createSlug('  Café release workflow!!!  ')).toBe('cafe-release-workflow');
  });

  it('throws when a title cannot produce a slug', (): void => {
    expect(() => createSlug('!!!')).toThrow(
      'Title must include letters or numbers after normalization.'
    );
  });

  it('builds file names for every supported naming strategy', (): void => {
    const timestamp = new Date('2026-07-19T01:30:00');

    expect(
      buildSpecFileName({
        format: 'md',
        group: undefined,
        naming: 'timestamp-slug',
        sequenceNumber: undefined,
        slug: 'bootstrap-release-workflow',
        timestamp,
      })
    ).toBe('20260719013000_bootstrap-release-workflow.md');
    expect(
      buildSpecFileName({
        format: 'md',
        group: undefined,
        naming: 'slug',
        sequenceNumber: undefined,
        slug: 'bootstrap-release-workflow',
        timestamp,
      })
    ).toBe('bootstrap-release-workflow.md');
    expect(
      buildSpecFileName({
        format: 'md',
        group: undefined,
        naming: 'sequence-slug',
        sequenceNumber: 7,
        slug: 'bootstrap-release-workflow',
        timestamp,
      })
    ).toBe('0007_bootstrap-release-workflow.md');
    expect(
      buildSpecFileName({
        format: 'md',
        group: undefined,
        naming: 'date-slug',
        sequenceNumber: undefined,
        slug: 'bootstrap-release-workflow',
        timestamp,
      })
    ).toBe('20260719_bootstrap-release-workflow.md');
    expect(
      buildSpecFileName({
        format: 'md',
        group: undefined,
        naming: 'datetime-slug',
        sequenceNumber: undefined,
        slug: 'bootstrap-release-workflow',
        timestamp,
      })
    ).toBe('20260719T013000_bootstrap-release-workflow.md');
    expect(
      buildSpecFileName({
        format: 'md',
        group: 'feat',
        naming: 'group-timestamp-slug',
        sequenceNumber: undefined,
        slug: 'bootstrap-release-workflow',
        timestamp,
      })
    ).toBe('feat_20260719013000_bootstrap-release-workflow.md');
    expect(
      buildSpecFileName({
        format: 'md',
        group: 'feat',
        naming: 'timestamp-group-slug',
        sequenceNumber: undefined,
        slug: 'bootstrap-release-workflow',
        timestamp,
      })
    ).toBe('20260719013000_feat_bootstrap-release-workflow.md');
    expect(
      buildSpecFileName({
        format: 'md',
        group: 'feat',
        naming: 'group-slug',
        sequenceNumber: undefined,
        slug: 'bootstrap-release-workflow',
        timestamp,
      })
    ).toBe('feat_bootstrap-release-workflow.md');
  });

  it('extracts sequence prefixes when present', (): void => {
    expect(getSequenceFromFileName('0007_bootstrap-release-workflow.md', 'md')).toBe(7);
    expect(getSequenceFromFileName('bootstrap-release-workflow.md', 'md')).toBeUndefined();
  });

  it('validates file names for simple and grouped strategies', (): void => {
    expect(
      validateSpecFileName('20260719013000_bootstrap-release-workflow.md', {
        format: 'md',
        group: undefined,
        naming: 'timestamp-slug',
      })
    ).toBe(true);
    expect(
      validateSpecFileName('feat_bootstrap-release-workflow.md', {
        format: 'md',
        group: 'feat',
        naming: 'group-slug',
      })
    ).toBe(true);
    expect(
      validateSpecFileName('fix_bootstrap-release-workflow.md', {
        format: 'md',
        group: 'feat',
        naming: 'group-slug',
      })
    ).toBe(false);
  });

  it('accepts the bootstrap example only for timestamp-slug validation', (): void => {
    expect(
      validateSpecFileName(getBootstrapSpecFileName('md'), {
        format: 'md',
        group: undefined,
        naming: 'timestamp-slug',
      })
    ).toBe(true);
    expect(isRealTimestampSlugFileName(getBootstrapSpecFileName('md'), 'md')).toBe(false);
  });

  it('returns readable filename expectations', (): void => {
    expect(
      getFileNameExpectation({
        format: 'md',
        group: undefined,
        naming: 'date-slug',
      })
    ).toBe('must match YYYYMMDD_slug.md.');
    expect(
      getFileNameExpectation({
        format: 'md',
        group: 'feat',
        naming: 'group-slug',
      })
    ).toBe('must match feat_slug.md.');
  });

  it('flags naming rules used by grouped filenames and commit-aware recency', (): void => {
    expect(isNamingUsingGroup('group-slug')).toBe(true);
    expect(isNamingUsingGroup('slug')).toBe(false);
    expect(isNamingSupportedForCommitAwareRecency('timestamp-slug')).toBe(true);
    expect(isNamingSupportedForCommitAwareRecency('date-slug')).toBe(false);
  });
});
