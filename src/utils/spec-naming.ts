const BOOTSTRAP_SPEC_FILE_BASENAME = '00000000000000_initial_spec_example';
const SLUG_PATTERN = '[a-z0-9]+(?:-[a-z0-9]+)*';

export const SUPPORTED_SPEC_NAMINGS = [
  'timestamp-slug',
  'slug',
  'sequence-slug',
  'date-slug',
  'datetime-slug',
  'group-timestamp-slug',
  'timestamp-group-slug',
  'group-slug',
] as const;

export type SpecNaming = (typeof SUPPORTED_SPEC_NAMINGS)[number];

type FileNameValidationOptions = {
  format: string;
  group: string | undefined;
  naming: SpecNaming;
};

function escapeRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getGroupPattern(group: string | undefined): string {
  return group === undefined ? '[^_]+' : escapeRegex(group);
}

function getNamingPattern(naming: SpecNaming, format: string, group: string | undefined): RegExp {
  const escapedFormat = escapeRegex(format);
  const groupPattern = getGroupPattern(group);

  switch (naming) {
    case 'timestamp-slug':
      return new RegExp(`^\\d{14}_${SLUG_PATTERN}\\.${escapedFormat}$`, 'u');
    case 'slug':
      return new RegExp(`^${SLUG_PATTERN}\\.${escapedFormat}$`, 'u');
    case 'sequence-slug':
      return new RegExp(`^\\d{4}_${SLUG_PATTERN}\\.${escapedFormat}$`, 'u');
    case 'date-slug':
      return new RegExp(`^\\d{8}_${SLUG_PATTERN}\\.${escapedFormat}$`, 'u');
    case 'datetime-slug':
      return new RegExp(`^\\d{8}T\\d{6}_${SLUG_PATTERN}\\.${escapedFormat}$`, 'u');
    case 'group-timestamp-slug':
      return new RegExp(`^${groupPattern}_\\d{14}_${SLUG_PATTERN}\\.${escapedFormat}$`, 'u');
    case 'timestamp-group-slug':
      return new RegExp(`^\\d{14}_${groupPattern}_${SLUG_PATTERN}\\.${escapedFormat}$`, 'u');
    case 'group-slug':
      return new RegExp(`^${groupPattern}_${SLUG_PATTERN}\\.${escapedFormat}$`, 'u');
  }
}

export function buildSpecFileName(options: {
  format: string;
  group: string | undefined;
  naming: SpecNaming;
  sequenceNumber: number | undefined;
  slug: string;
  timestamp: Date;
}): string {
  const { format, group, naming, sequenceNumber, slug, timestamp } = options;
  const datePart = formatDate(timestamp);
  const timestampPart = formatTimestamp(timestamp);
  const datetimePart = formatDatetime(timestamp);

  switch (naming) {
    case 'timestamp-slug':
      return `${timestampPart}_${slug}.${format}`;
    case 'slug':
      return `${slug}.${format}`;
    case 'sequence-slug':
      return `${String(sequenceNumber ?? 1).padStart(4, '0')}_${slug}.${format}`;
    case 'date-slug':
      return `${datePart}_${slug}.${format}`;
    case 'datetime-slug':
      return `${datetimePart}_${slug}.${format}`;
    case 'group-timestamp-slug':
      return `${group ?? ''}_${timestampPart}_${slug}.${format}`;
    case 'timestamp-group-slug':
      return `${timestampPart}_${group ?? ''}_${slug}.${format}`;
    case 'group-slug':
      return `${group ?? ''}_${slug}.${format}`;
  }
}

export function createSlug(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');

  if (slug.length === 0) {
    throw new Error('Title must include letters or numbers after normalization.');
  }

  return slug;
}

export function formatDate(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

export function formatDatetime(date: Date): string {
  return `${formatDate(date)}T${formatTime(date)}`;
}

export function formatTimestamp(date: Date): string {
  return `${formatDate(date)}${formatTime(date)}`;
}

export function getBootstrapSpecFileName(format: string): string {
  return `${BOOTSTRAP_SPEC_FILE_BASENAME}.${format}`;
}

export function getFileNameExpectation(options: FileNameValidationOptions): string {
  const { format, group, naming } = options;

  switch (naming) {
    case 'timestamp-slug':
      return `must match YYYYMMDDHHMMSS_slug.${format}.`;
    case 'slug':
      return `must match slug.${format}.`;
    case 'sequence-slug':
      return `must match NNNN_slug.${format}.`;
    case 'date-slug':
      return `must match YYYYMMDD_slug.${format}.`;
    case 'datetime-slug':
      return `must match YYYYMMDDTHHMMSS_slug.${format}.`;
    case 'group-timestamp-slug':
      return `must match ${group ?? '<group>'}_YYYYMMDDHHMMSS_slug.${format}.`;
    case 'timestamp-group-slug':
      return `must match YYYYMMDDHHMMSS_${group ?? '<group>'}_slug.${format}.`;
    case 'group-slug':
      return `must match ${group ?? '<group>'}_slug.${format}.`;
  }
}

export function getSequenceFromFileName(fileName: string, format: string): number | undefined {
  const escapedFormat = escapeRegex(format);
  const match = fileName.match(new RegExp(`^(\\d{4})_${SLUG_PATTERN}\\.${escapedFormat}$`, 'u'));

  return match === null ? undefined : Number(match[1]);
}

export function isNamingSupportedForCommitAwareRecency(naming: SpecNaming): boolean {
  return naming === 'timestamp-slug';
}

export function isNamingUsingGroup(naming: SpecNaming): boolean {
  return (
    naming === 'group-timestamp-slug' ||
    naming === 'timestamp-group-slug' ||
    naming === 'group-slug'
  );
}

export function isRealTimestampSlugFileName(fileName: string, format: string): boolean {
  if (fileName === getBootstrapSpecFileName(format)) {
    return false;
  }

  return getNamingPattern('timestamp-slug', format, undefined).test(fileName);
}

export function validateSpecFileName(
  fileName: string,
  options: FileNameValidationOptions
): boolean {
  if (
    options.naming === 'timestamp-slug' &&
    fileName === getBootstrapSpecFileName(options.format)
  ) {
    return true;
  }

  return getNamingPattern(options.naming, options.format, options.group).test(fileName);
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}${minutes}${seconds}`;
}
