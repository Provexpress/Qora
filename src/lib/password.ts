import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const prefix = "scrypt";
const keyLength = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, keyLength).toString("hex");
  return `${prefix}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedPassword?: string | null) {
  if (!storedPassword) return false;

  if (!storedPassword.startsWith(`${prefix}$`)) {
    return storedPassword === password;
  }

  const [, salt, storedHash] = storedPassword.split("$");
  if (!salt || !storedHash) return false;

  const calculatedHash = scryptSync(password, salt, keyLength);
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (storedBuffer.length !== calculatedHash.length) return false;
  return timingSafeEqual(storedBuffer, calculatedHash);
}
