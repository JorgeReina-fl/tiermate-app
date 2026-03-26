/**
 * storage.ts — TierMate Local-First Encrypted Key Storage
 *
 * Security model:
 *  - API keys are AES-encrypted with a user-supplied PIN before being written to localStorage.
 *  - The PIN is ephemeral (React state only). Closing the tab loses it.
 *  - TierMate's server never receives or stores any plain-text key.
 */

import CryptoJS from "crypto-js";

const prefix = "lf_enc_"; // localStorage key prefix
export const PIN_VALIDATOR_KEY = "lf_pin_validator";
export const PIN_VALIDATOR_VALUE = "stackmate-valid";

/**
 * Encrypts `apiKey` using `pin` and persists the cipher text in localStorage.
 * @param service  Short service identifier, e.g. "vercel"
 * @param apiKey   Plain-text API key supplied by the user
 * @param pin      Ephemeral session PIN (never stored)
 */
export function encryptAndStore(
  service: string,
  apiKey: string,
  pin: string
): void {
  // Initialize or update the PIN validator to match the current PIN
  const validatorCipher = CryptoJS.AES.encrypt(PIN_VALIDATOR_VALUE, pin).toString();
  localStorage.setItem(PIN_VALIDATOR_KEY, validatorCipher);

  const cipherText = CryptoJS.AES.encrypt(apiKey, pin).toString();
  localStorage.setItem(`${prefix}${service}`, cipherText);
}

/**
 * Reads the cipher text from localStorage and decrypts it with the session PIN.
 * Returns `null` if the key is missing or decryption yields an empty string
 * (which happens when the wrong PIN is used).
 * @param service  Short service identifier, e.g. "vercel"
 * @param pin      Ephemeral session PIN
 */
export function decryptAndRetrieve(
  service: string,
  pin: string
): string | null {
  const cipherText = localStorage.getItem(`${prefix}${service}`);
  if (!cipherText) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, pin);
    const plainText = bytes.toString(CryptoJS.enc.Utf8);
    return plainText.length > 0 ? plainText : null;
  } catch {
    return null;
  }
}

/**
 * Checks whether an encrypted key exists in localStorage for the given service.
 * Does NOT decrypt — safe to call without the PIN.
 */
export function hasStoredKey(service: string): boolean {
  return localStorage.getItem(`${prefix}${service}`) !== null;
}

/**
 * Removes the encrypted key for the given service from localStorage.
 */
export function removeKey(service: string): void {
  localStorage.removeItem(`${prefix}${service}`);
}

/**
 * Validates the provided PIN against the local validator string.
 * Returns `true` if correct, `false` if incorrect, or `null` if no PIN is set up yet.
 */
export function validatePin(pin: string): boolean | null {
  const cipherText = localStorage.getItem(PIN_VALIDATOR_KEY);
  if (!cipherText) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, pin);
    const plainText = bytes.toString(CryptoJS.enc.Utf8);
    return plainText === PIN_VALIDATOR_VALUE;
  } catch {
    return false;
  }
}

/**
 * Checks whether a PIN validator has been configured.
 */
export function hasPinValidator(): boolean {
  return localStorage.getItem(PIN_VALIDATOR_KEY) !== null;
}
