const querystring = require('querystring');
const utils = require('./utils');
const HttpError = require('./httpError');
const httpCodes = require('./constants/httpCodes.constant');
const errorMessages = require('./constants/errorMessages.constant');
const defaultValues = require('./constants/defaultValues.constant');

module.exports = class SignUrl {
  /**
   * SignUrl constructor.
   * @param {object} options - Starting options.
   * @param {string} options.credential - The credential string.
   * @param {string} options.secretKey - The secret string.
   * @param {number} [options.ttl] - The default time-to-live in seconds.
   * @param {string} [options.algorithm] - The hashing algorithm.
   * @constructor
   */
  constructor(options) {
    if (options === void 0 || !options) {
      throw new Error(errorMessages.OPTIONS_UNDEFINED);
    }
    if (options.credential === void 0 || !options.credential) {
      throw new Error(errorMessages.CREDENTIAL_UNDEFINED);
    }
    if (options.secretKey === void 0 || !options.secretKey) {
      throw new Error(errorMessages.SECRET_KEY_UNDEFINED);
    }

    this.secretKey = options.secretKey;
    this.credential = options.credential;
    this.ttl = options.ttl || defaultValues.DEFAULT_TTL;
    this.algorithm = options.algorithm || defaultValues.DEFAULT_ALGORITHM;

    this.generateSignedUrl = this.generateSignedUrl.bind(this);
    this.verifySignedUrl = this.verifySignedUrl.bind(this);
    this.verifier = this.verifier.bind(this);
  }

  /**
   * Generates secured url.
   * @param {string} url - Existing url(full address).
   * @param {string} httpMethod - The http method.
   * @returns {string} Signed url.
   */
  generateSignedUrl(url, httpMethod) {
    if (url === void 0 || !url) {
      throw new Error(errorMessages.URL_PARAM_UNDEFINED);
    }

    if (httpMethod === void 0 || !httpMethod) {
      throw new Error(errorMessages.HTTP_METHOD_PARAM_UNDEFINED);
    }

    if (url.endsWith('/')) {
      throw new Error(errorMessages.URL_IS_NOT_VALID);
    }

    url = new URL(url)
    url.searchParams.set('OC-Credential', this.credential);
    url.searchParams.set('OC-Date', new Date().toISOString());
    url.searchParams.set('OC-Expires', this.ttl);
    url.searchParams.set('OC-Verb', httpMethod);

    const hashedKey = utils.createHashedKey(
      url.toString,
      this.algorithm,
      this.secretKey
    );

    url.searchParams.set('OC-Signature', hashedKey);
    return url.toString();
  }

  /**
   * Verifying URL for validity and returns result code.
   * @param {Request} req - Request.
   * @returns {number} Result code.
   */
  verifySignedUrl(req) {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    const signedParamIndex = utils.getSignedParamIndexPos(url);

    const signatureIndex = url.lastIndexOf(';') + 1;

    const dataAsString = url.substring(
      signedParamIndex + defaultValues.SIGNED_PARAM_LENGTH,
      signatureIndex
    );
    const data = querystring.parse(dataAsString, ';', ':');

    const urlSignature = url.substring(signatureIndex);
    const urlWithoutSign = url.substr(0, signatureIndex);

    const hashedKey = utils.createHashedKey(
      urlWithoutSign,
      this.algorithm,
      this.secretKey
    );

    if (hashedKey !== urlSignature) {
      return httpCodes.FORBIDDEN;
    }

    if (data.m && data.m !== req.method) {
      return httpCodes.FORBIDDEN;
    }

    if (data.e && data.e < utils.getCurrentDateInSeconds()) {
      return httpCodes.EXPIRED;
    }

    return 0;
  }

  /**
   * Returns express middleware
   * @param {Function} [onInvalid] - Function that emits when the signature is invalid.
   * @param {Function} [onExpired] - Function that emits when the signature is expired.
   * @returns {Function} Express middleware.
   */
  verifier(onInvalid, onExpired) {
    onInvalid = onInvalid || onInvalidDefault;
    onExpired = onExpired || onExpiredDefault;

    return (req, res, next) => {
      try {
        const errorCode = this.verifySignedUrl(req);

        switch (errorCode) {
          case httpCodes.FORBIDDEN:
            return onInvalid(req, res, next);
          case httpCodes.EXPIRED:
            return onExpired(req, res, next);
        }

        req.url = utils.getUrlWithoutSignedParam(req.url);
      } catch (err) {
        return next(err);
      }

      return next();
    };
  }
};

/**
 * Default function when token is not valid
 */
function onInvalidDefault() {
  throw new HttpError(
    httpCodes.FORBIDDEN,
    errorMessages.URL_SIGNATURE_IS_NOT_VALID
  );
}

/**
 * Default function when token expired
 */
function onExpiredDefault() {
  throw new HttpError(httpCodes.EXPIRED, errorMessages.SIGNED_URL_EXPIRED);
}
