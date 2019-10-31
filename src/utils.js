import crypto from 'crypto';

const SIGNED_PARAM = 'signed=';
export const SIGNED_PARAM_LENGTH = SIGNED_PARAM.length + 1;

const ITERATION_COUNT = 10000;
const HASH_LENGTH = 32;
const DIGEST = 'hex';

/**
 * Create a hashed key with secretKey from the string
 * @param {string} stringToHash - The string that will be hashed.
 * @param {string} algorithm - Hashing algorithm.
 * @param {string} secretKey - Secret string.
 * @returns {string} Ready hashed key.
 */
export function createHashedKey(stringToHash, algorithm, secretKey) {
  const hashedKey = crypto.pbkdf2Sync(
    stringToHash,
    secretKey,
    ITERATION_COUNT,
    HASH_LENGTH,
    algorithm
  );
  return hashedKey.toString(DIGEST);
}

/**
 * Get 'signed' parameter position.
 * @param {string} url - Existing url.
 * @returns {number} Index of starting 'signed' parameter.
 */
export function getSignedParamIndexPos(url) {
  let signedParamPos = url.lastIndexOf(`&${SIGNED_PARAM}`);
  if (signedParamPos === -1) {
    signedParamPos = url.lastIndexOf(`?${SIGNED_PARAM}`);
  }
  if (signedParamPos === -1) {
    throw new Error('Signed parameter is not defined');
  }

  return signedParamPos;
}

/**
 * Get url without 'signed' parameter.
 * @param {string} url - Existing url.
 * @returns {string} Formatted url without 'signed' parameter.
 */
export function getUrlWithoutSignedParam(url) {
  const signedParamPos = getSignedParamIndexPos(url);
  return url.substr(0, signedParamPos - 1);
}
