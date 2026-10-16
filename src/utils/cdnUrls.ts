// Asset URLs are stored with the Spaces origin host (generatePublicUrl in data-center).
// Anything that DISPLAYS or FETCHES an asset goes through the Spaces CDN instead. The DB keeps
// the origin URL so string matches (templatesUsingUrl, delete key extraction) are unaffected —
// so call toCdn only where a URL is shown or fetched, never on a value that gets saved back.
export const SPACES_ORIGIN_HOST = '.sfo3.digitaloceanspaces.com/';
export const SPACES_CDN_HOST = '.sfo3.cdn.digitaloceanspaces.com/';

/** Origin Spaces URL → CDN URL. Anything else (CDN, data:, blob:, relative, null) passes through. */
export const toCdn = <T extends string | null | undefined>(url: T): T =>
    (typeof url === 'string' ? url.replace(SPACES_ORIGIN_HOST, SPACES_CDN_HOST) : url) as T;
