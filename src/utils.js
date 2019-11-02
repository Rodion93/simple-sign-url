const crypto = require('crypto');

const SIGNED_PARAM = 'signed=';

exports.SIGNED_PARAM_LENGTH = SIGNED_PARAM.length + 1;

const ITERATION_COUNT = 10000;
const HASH_LENGTH = 32;
const DIGEST = 'hex';

const ONE_SECOND_VALUE = 1000;
const MAX_RANDOM_VALUE = 10000000000;

/**
 * Create a hashed key with secretKey from the string
 * @param {string} stringToHash - The string that will be hashed.
 * @param {string} algorithm - Hashing algorithm.
 * @param {string} secretKey - Secret string.
 * @returns {string} Ready hashed key.
 */
exports.createHashedKey = function(stringToHash, algorithm, secretKey) {
  const hashedKey = crypto.pbkdf2Sync(
    stringToHash,
    secretKey,
    ITERATION_COUNT,
    HASH_LENGTH,
    algorithm
  );
  return hashedKey.toString(DIGEST);
};

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
    throw new Error('Signed parameter is not defined');
  }

  return signedParamPos;
}

exports.getSignedParamIndexPos = getSignedParamIndexPos;

/**
 * Get url without 'signed' parameter.
 * @param {string} url - Existing url.
 * @returns {string} Formatted url without 'signed' parameter.
 */
exports.getUrlWithoutSignedParam = function(url) {
  const signedParamPos = getSignedParamIndexPos(url);
  return url.substr(0, signedParamPos - 1);
};

/**
 * Generates the 'random' parameter.
 * @returns {number} Random number.
 */
exports.generateRandomParam = function() {
  return Math.floor(Math.random() * MAX_RANDOM_VALUE);
};

/**
 * Get current date in seconds format.
 * @returns {number} Current date in seconds.
 */
function getCurrentDateInSeconds() {
  return Math.ceil(+new Date() / ONE_SECOND_VALUE);
}

exports.getCurrentDateInSeconds = getCurrentDateInSeconds;

/**
 * Generates the 'expired' parameter.
 * @param {number} ttl - Time to live in seconds.
 * @returns {number} Expired date as number.
 */
exports.generateExpiredParam = function(ttl) {
  return getCurrentDateInSeconds() + ttl;
};
