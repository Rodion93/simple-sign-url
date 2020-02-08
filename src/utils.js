const crypto = require('crypto');
const HttpError = require('./httpError');
const httpCodes = require('./constants/httpCodes.constant');
const errorMessages = require('./constants/errorMessages.constant');
const defaultValues = require('./constants/defaultValues.constant');

exports.createHashedKey = createHashedKey;
exports.getSignedParamIndexPos = getSignedParamIndexPos;
exports.getUrlWithoutSignedParam = getUrlWithoutSignedParam;
exports.generateRandomParam = generateRandomParam;
exports.getCurrentDateInSeconds = getCurrentDateInSeconds;
exports.generateExpiredParam = generateExpiredParam;

/**
 * Create a hashed key with secretKey from the string
 * @param {string} stringToHash - The string that will be hashed.
 * @param {string} algorithm - Hashing algorithm.
 * @param {string} secretKey - Secret string.
 * @returns {string} Ready hashed key.
 */
function createHashedKey(stringToHash, algorithm, secretKey) {
  const hashedKey = crypto.pbkdf2Sync(
    stringToHash,
    secretKey,
    defaultValues.ITERATION_COUNT,
    defaultValues.HASH_LENGTH,
    algorithm
  );

  return hashedKey.toString(defaultValues.DIGEST_VALUE);
}

/**
 * Get 'signed' parameter position.
 * @param {string} url - Existing url.
 * @returns {number} Index of starting 'signed' parameter.
 */
function getSignedParamIndexPos(url) {
  let signedParamPos = url.lastIndexOf(`&${defaultValues.SIGNED_PARAM}`);

  if (signedParamPos === -1) {
    signedParamPos = url.lastIndexOf(`?${defaultValues.SIGNED_PARAM}`);
  }
  if (signedParamPos === -1) {
    throw new HttpError(
      httpCodes.BAD_REQUEST,
      errorMessages.SIGNED_PARAM_UNDEFINED
    );
  }

  return signedParamPos;
}

/**
 * Get url without 'signed' parameter.
 * @param {string} url - Existing url.
 * @returns {string} Formatted url without 'signed' parameter.
 */
function getUrlWithoutSignedParam(url) {
  const signedParamPos = getSignedParamIndexPos(url);
  return url.substr(0, signedParamPos - 1);
}

/**
 * Generates the 'random' parameter.
 * @returns {number} Random number.
 */
function generateRandomParam() {
  return Math.floor(Math.random() * defaultValues.MAX_RANDOM_VALUE);
}

/**
 * Get current date in seconds format.
 * @returns {number} Current date in seconds.
 */
function getCurrentDateInSeconds() {
  return Math.ceil(+new Date() / defaultValues.ONE_SECOND_VALUE);
}

/**
 * Generates the 'expired' parameter.
 * @param {number} ttl - Time to live in seconds.
 * @returns {number} Expired date as number.
 */
function generateExpiredParam(ttl) {
  return getCurrentDateInSeconds() + ttl;
}
