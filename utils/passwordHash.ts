// src/utils/passwordHash.ts
// Browser-native PBKDF2-SHA256 password hashing & verification with deterministic fallback

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16) || 0;
  }
  return out;
}

function fallbackDigest(password: string, saltHex: string): string {
  // Fallback FNV-1a multi-round mixing if WebCrypto subtle is unavailable in non-HTTPS preview
  const input = `${saltHex}:${password}:nanolabs-v1`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let round = 0; round < 1024; round++) {
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 ^= ch;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= ch + round;
      h2 = Math.imul(h2, 0x85ebca6b);
    }
  }
  return (
    (h1 >>> 0).toString(16).padStart(8, '0') +
    (h2 >>> 0).toString(16).padStart(8, '0')
  ).repeat(4);
}

async function deriveWithSalt(password: string, saltBytes: Uint8Array): Promise<string> {
  const saltHex = bytesToHex(saltBytes);
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );
      const bits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );
      return bytesToHex(new Uint8Array(bits));
    }
  } catch {
    // Fallback if subtle crypto fails
  }
  return fallbackDigest(password, saltHex);
}

export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const saltBytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(saltBytes);
  } else {
    for (let i = 0; i < 16; i++) {
      saltBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const salt = bytesToHex(saltBytes);
  const hash = await deriveWithSalt(password, saltBytes);
  return { salt, hash };
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  if (!password || !salt || !expectedHash) return false;
  const saltBytes = hexToBytes(salt);
  const computed = await deriveWithSalt(password, saltBytes);
  if (computed === expectedHash) return true;
  // Also check fallback digest in case environment switched context
  return fallbackDigest(password, salt) === expectedHash;
}
