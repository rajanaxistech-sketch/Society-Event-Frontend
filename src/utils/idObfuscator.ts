import { useParams } from 'react-router-dom';

/**
 * Robust URL-Safe ID Obfuscation and Encoding/Decoding Utility
 *
 * Conceals raw database IDs / UUIDs from the browser URL and UI,
 * preventing direct exposure to end users while preserving 100% backend compatibility.
 */

const SALT_KEY = 'anaxis_tech_society_key_2026';
const ENC_PREFIX = 'enc_';

/**
 * Encodes a raw ID or UUID into an opaque, URL-safe obfuscated token.
 * Example: '033c2dc4-dd8d-4dcd-b08f-770058a496b4' -> 'enc_...'
 */
export function encodeId(rawId: string | number | undefined | null): string {
  if (rawId === undefined || rawId === null) return '';
  const str = String(rawId).trim();
  if (!str) return '';

  // Already encoded check
  if (str.startsWith(ENC_PREFIX)) return str;

  try {
    const textEncoder = new TextEncoder();
    const dataBytes = textEncoder.encode(str);
    const saltBytes = textEncoder.encode(SALT_KEY);

    // Byte XOR obfuscation
    const obfuscated = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      obfuscated[i] = dataBytes[i] ^ saltBytes[i % saltBytes.length];
    }

    // Binary string conversion
    let binary = '';
    for (let i = 0; i < obfuscated.length; i++) {
      binary += String.fromCharCode(obfuscated[i]);
    }

    // Base64 & URL safe formatting
    const base64 = btoa(binary);
    const urlSafe = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return `${ENC_PREFIX}${urlSafe}`;
  } catch (err) {
    console.warn('[idObfuscator] Failed to encode ID, falling back to raw:', err);
    return str;
  }
}

/**
 * Decodes an obfuscated token or raw ID back into the original UUID/ID.
 * Handles both encoded tokens (with 'enc_' prefix) and raw IDs gracefully.
 */
export function decodeId(encodedOrRawId: string | undefined | null): string {
  if (!encodedOrRawId) return '';
  const str = String(encodedOrRawId).trim();
  if (!str) return '';

  if (!str.startsWith(ENC_PREFIX)) {
    // If not encoded with our prefix, return as-is (e.g. legacy/direct UUIDs)
    return str;
  }

  try {
    const rawPayload = str.slice(ENC_PREFIX.length);
    let base64 = rawPayload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const saltBytes = new TextEncoder().encode(SALT_KEY);
    const deobfuscated = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      deobfuscated[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
    }

    const decoded = new TextDecoder().decode(deobfuscated);
    return decoded || str;
  } catch (err) {
    console.warn('[idObfuscator] Failed to decode token, falling back to raw string:', err);
    return str;
  }
}

/**
 * React Hook that retrieves and decodes a specific URL parameter (default: 'id').
 */
export function useDecodedId(paramName: string = 'id'): string {
  const params = useParams<Record<string, string>>();
  const rawValue = params[paramName];
  return decodeId(rawValue);
}

/**
 * React Hook that returns all URL params decoded.
 */
export function useDecodedParams(): Record<string, string> {
  const params = useParams<Record<string, string>>();
  const decoded: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      decoded[key] = decodeId(value);
    }
  }
  return decoded;
}

/**
 * Checks if a string is an encoded ID.
 */
export function isEncodedId(str: string | undefined | null): boolean {
  return typeof str === 'string' && str.startsWith(ENC_PREFIX);
}
