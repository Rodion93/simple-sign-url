const crypto = require('crypto');
const HttpError = require('./httpError');
const httpCodes = require('./constants/httpCodes');

const SIGNED_PARAM = 'signed=';

const ITERATION_COUNT = 10000;
const HASH_LENGTH = 32;
const DIGEST = 'hex';

const ONE_SECOND_VALUE = 1000;
const MAX_RANDOM_VALUE = 10000000000;

exports.SIGNED_PARAM_LENGTH = SIGNED_PARAM.length + 1;

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
function getSignedParamIndexPos(url) {
  let signedParamPos = url.lastIndexOf(`&${SIGNED_PARAM}`);
  if (signedParamPos === -1) {
    signedParamPos = url.lastIndexOf(`?${SIGNED_PARAM}`);
  }
  if (signedParamPos === -1) {
    throw new HttpError(
      httpCodes.BAD_REQUEST,
      'Signed parameter is not defined'
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
  return Math.floor(Math.random() * MAX_RANDOM_VALUE);
}

/**
 * Get current date in seconds format.
 * @returns {number} Current date in seconds.
 */
function getCurrentDateInSeconds() {
  return Math.ceil(+new Date() / ONE_SECOND_VALUE);
}

/**
 * Generates the 'expired' parameter.
 * @param {number} ttl - Time to live in seconds.
 * @returns {number} Expired date as number.
 */
function generateExpiredParam(ttl) {
  return getCurrentDateInSeconds() + ttl;
}
