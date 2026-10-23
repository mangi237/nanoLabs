const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(buf as ArrayBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const hashPassword = async (password: string, salt?: string) => {
  const usedSalt = salt ?? toHex(crypto.getRandomValues(new Uint8Array(16)));
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(usedSalt + password)
  );
  return { salt: usedSalt, hash: toHex(digest) };
};

export const verifyPassword = async (password: string, salt: string, expectedHash: string) => {
  const { hash } = await hashPassword(password, salt);
  return hash === expectedHash;
};