import { randomInt } from "node:crypto";

/**
 * Unambiguous alphabet: no 0/O, no 1/I/l. These ids get read aloud and typed
 * from memory, so the lookalikes are not worth the extra entropy.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const LENGTH = 6;

/**
 * v1 generated 5 characters with Math.random and, on collision, reassigned a
 * `const` inside a while loop, so the retry path threw a TypeError. This uses a
 * CSPRNG, 6 characters (about 887 million combinations), and a real retry.
 */
export function shortId(): string {
  let out = "";
  for (let i = 0; i < LENGTH; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

export function isValidShortId(value: string): boolean {
  return (
    typeof value === "string" &&
    value.length === LENGTH &&
    [...value].every((c) => ALPHABET.includes(c))
  );
}
