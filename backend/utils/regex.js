/**
 * Escapes special characters for use in regular expressions
 * to prevent regex injection and ReDoS vulnerabilities.
 */
export const escapeRegex = (string = '') => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
