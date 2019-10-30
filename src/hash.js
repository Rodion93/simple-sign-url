import crypto from 'crypto';

/**
 * Create a signature with secretKey from the string
 * @param {string} stringToHash - The string that to be hashed.
 * @param {string} algorithm - Hashing algorithm.
 * @param {string} secretKey - Secret string.
 * @returns {string} A ready signature.
 */
export function createHash(stringToHash, algorithm, secretKey) {
  const hash = crypto.createHash(algorithm);
  hash.update(stringToHash, 'utf8');
  hash.update(secretKey);

  return hash.digest('hex');
}
