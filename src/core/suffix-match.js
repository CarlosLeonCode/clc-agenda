/**
 * Matches a WhatsApp number with the same number stored in national format
 * (e.g. +57 319 504 2258 with a phonebook record "3195042258").
 * Fails safe: ambiguous or cross-country candidates return no match.
 */

import { COUNTRY_CODES } from './phone.js';

const SUFFIX_LENGTHS = [10, 9];

// Country codes, plus mobile trunk forms that sit between code and national number
const DIALING_PREFIXES = new Set([...COUNTRY_CODES.map(c => c.prefix), '521', '549']);

export function addToSuffixIndex(index, entry) {
  const phone = entry?.phone;
  if (!phone || phone.length < 9) return;
  for (const len of SUFFIX_LENGTHS) {
    const key = phone.slice(-len);
    const bucket = index.get(key);
    if (!bucket) index.set(key, [entry]);
    else if (!bucket.includes(entry)) bucket.push(entry);
  }
}

function isSameNumberInOtherFormat(a, b) {
  if (a === b) return false;
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  if (!longer.endsWith(shorter)) return false;
  return DIALING_PREFIXES.has(longer.slice(0, longer.length - shorter.length));
}

export function findSuffixMatch(index, phone) {
  if (!phone || phone.length < 9) return null;
  const matches = new Map();
  for (const len of SUFFIX_LENGTHS) {
    for (const entry of index.get(phone.slice(-len)) || []) {
      if (isSameNumberInOtherFormat(phone, entry.phone)) matches.set(entry.phone, entry);
    }
  }
  return matches.size === 1 ? matches.values().next().value : null;
}
