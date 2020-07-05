const errorMessages = require('../constants/errorMessages.constant');
const defaultValues = require('../constants/defaultValues.constant');

exports.validateConstructorParams = validateConstructorParams;
exports.validateCustomRequestObject = validateCustomRequestObject;
exports.validateGenerateSignedUrlParams = validateGenerateSignedUrlParams;

/**
 * Validation of the constructor parameters
 *
 * @param {string} secretKey - Secret key as string.
 * @param {number} [ttl] - The default time-to-live in seconds.
 * @param {string} [algorithm] - The hashing algorithm. For example - 'sha512'.
 */
function validateConstructorParams(secretKey, ttl, algorithm) {
  if (
    secretKey === void 0 ||
    !secretKey ||
    typeof secretKey !== typeof String()
  ) {
    throw new Error(errorMessages.SECRET_KEY_UNDEFINED);
  }

  if (ttl && typeof ttl !== typeof Number()) {
    throw new Error(errorMessages.TTL_WRONG_TYPE);
  }

  if (algorithm && typeof algorithm !== typeof String()) {
    throw new Error(errorMessages.ALGORITHM_WRONG_TYPE);
  }
}

/**
 * Validation of the CustomRequestObject
 *
 * @param {object} request - CustomRequestObject
 */
function validateCustomRequestObject({ protocol, method, originalUrl, host }) {
  if (protocol === void 0 || !protocol || typeof protocol !== typeof String()) {
    throw new Error(errorMessages.REQ_PROTOCOL_UNDEFINED);
  }
  if (method === void 0 || !method || typeof method !== typeof String()) {
    throw new Error(errorMessages.REQ_METHOD_UNDEFINED);
  }
  if (
    originalUrl === void 0 ||
    !originalUrl ||
    typeof originalUrl !== typeof String()
  ) {
    throw new Error(errorMessages.REQ_ORIGINAL_URL_UNDEFINED);
  }
  if (host === void 0 || !host || typeof host !== typeof String()) {
    throw new Error(errorMessages.REQ_HOST_UNDEFINED);
  }
}

/**
 * Validation of params for the signing urls
 *
 * @param {string} url - Url in the full format.
 * @param {string} httpMethod - HTTP method.
 */
function validateGenerateSignedUrlParams(url, httpMethod) {
  if (url === void 0 || !url || typeof url !== typeof String()) {
    throw new Error(errorMessages.URL_PARAM_UNDEFINED);
  }

  if (
    httpMethod === void 0 ||
    !httpMethod ||
    typeof httpMethod !== typeof String()
  ) {
    throw new Error(errorMessages.HTTP_METHOD_PARAM_UNDEFINED);
  }

  if (url.endsWith(defaultValues.URL_SEPARATOR)) {
    throw new Error(errorMessages.URL_IS_NOT_VALID);
  }
}
