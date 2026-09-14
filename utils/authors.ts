export type AuthorValue = string | string[] | null | undefined;

export const normalizeAuthors = (value: AuthorValue): string[] => {
  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((author) => String(author ?? '').split(','))
    .map((author) => author.trim())
    .filter(Boolean);
};

export const formatAuthors = (value: AuthorValue): string =>
  normalizeAuthors(value).join(', ');