const crypto = require('crypto');
const HttpError = require('../classes/httpError');
const httpCodes = require('../constants/httpCodes.constant');
const errorMessages = require('../constants/errorMessages.constant');
const defaultValues = require('../constants/defaultValues.constant');
const validators = require('./validators');

exports.createHashedKey = createHashedKey;
exports.getSignedParamIndexPos = getSignedParamIndexPos;
exports.getUrlWithoutSignedParam = getUrlWithoutSignedParam;
exports.generateRandomParam = generateRandomParam;
exports.getCurrentDateInSeconds = getCurrentDateInSeconds;
exports.generateExpiredParam = generateExpiredParam;
exports.getUrlFromRequest = getUrlFromRequest;

/**
 * Create a hashed key with secretKey from the string
 *
 * @param {string} stringToHash - The string that will be hashed.
 * @param {string} algorithm - Hashing algorithm.
 * @param {string} secretKey - Secret string.
 * @returns {string} Ready hashed key.
 */
function createHashedKey(stringToHash, algorithm, secretKey) {
  const { ITERATION_COUNT, HASH_LENGTH, DIGEST_VALUE } = defaultValues;

  const hashedKey = crypto.pbkdf2Sync(
    stringToHash,
    secretKey,
    ITERATION_COUNT,
    HASH_LENGTH,
    algorithm,
  );

  return hashedKey.toString(DIGEST_VALUE);
}

/**
 * Get 'signed' parameter position
 *
 * @param {string} url - Existing url.
 * @returns {number} Index of starting 'signed' parameter.
 */
function getSignedParamIndexPos(url) {
  const {
    SIGNED_PARAM,
    URL_BEGIN_PARAMS_SYMBOL,
    URL_ADD_PARAMS_SYMBOL,
  } = defaultValues;

  let signedParamPos = url.lastIndexOf(
    `${URL_ADD_PARAMS_SYMBOL}${SIGNED_PARAM}`,
  );

  if (signedParamPos === -1) {
    signedParamPos = url.lastIndexOf(
      `${URL_BEGIN_PARAMS_SYMBOL}${SIGNED_PARAM}`,
    );
  }
  if (signedParamPos === -1) {
    throw new HttpError(
      httpCodes.BAD_REQUEST,
      errorMessages.SIGNED_PARAM_UNDEFINED,
    );
  }

  return signedParamPos;
}

/**
 * Get url without 'signed' parameter
 *
 * @param {string} url - Existing url.
 * @returns {string} Formatted url without 'signed' parameter.
 */
function getUrlWithoutSignedParam(url) {
  const signedParamPos = getSignedParamIndexPos(url);
  return url.substr(0, signedParamPos - 1);
}

/**
 * Generates the 'random' parameter
 *
 * @returns {number} Random number.
 */
function generateRandomParam() {
  return Math.floor(Math.random() * defaultValues.MAX_RANDOM_VALUE);
}

/**
 * Get current date in seconds format
 *
 * @returns {number} Current date in seconds.
 */
function getCurrentDateInSeconds() {
  return Math.ceil(+new Date() / defaultValues.ONE_SECOND_VALUE);
}

/**
 * Generates the 'expired' parameter
 *
 * @param {number} ttl - Time to live in seconds.
 * @returns {number} Expired date as number.
 */
function generateExpiredParam(ttl) {
  return getCurrentDateInSeconds() + ttl;
}

/**
 * Get url from request
 *
 * @param {Request | CustomRequestObject} req - Request.
 * @returns {string} Url
 */
function getUrlFromRequest(req) {
  const { URL_HOST_PARAM_NAME, FUNCTION_TYPE } = defaultValues;

  if (typeof req.get === FUNCTION_TYPE && req.get(URL_HOST_PARAM_NAME)) {
    return `${req.protocol}://${req.get(URL_HOST_PARAM_NAME)}${
      req.originalUrl
    }`;
  }

  validators.validateCustomRequestObject(req);

  return `${req.protocol}://${req.host}${req.originalUrl}`;
}
