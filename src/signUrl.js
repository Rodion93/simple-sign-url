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
   * @param {string} options.secretKey - The secret string.
   * @param {number} [options.ttl] - The default time-to-live in seconds.
   * @param {string} [options.algorithm] - The hashing algorithm.
   * @constructor
   */
  constructor(options) {
    if (options === void 0 || !options) {
      throw new Error(errorMessages.OPTIONS_UNDEFINED);
    }
    if (options.secretKey === void 0 || !options.secretKey) {
      throw new Error(errorMessages.SECRET_KEY_UNDEFINED);
    }

    const { DEFAULT_TTL, DEFAULT_ALGORITHM } = defaultValues;

    this.secretKey = options.secretKey;
    this.ttl = options.ttl || DEFAULT_TTL;
    this.algorithm = options.algorithm || DEFAULT_ALGORITHM;

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

    if (url.endsWith(defaultValues.URL_SEPARATOR)) {
      throw new Error(errorMessages.URL_IS_NOT_VALID);
    }

    const data = {
      e: utils.generateExpiredParam(this.ttl),
      m: httpMethod.toUpperCase(),
      r: utils.generateRandomParam(),
    };

    const { ENCODED_SEP, ENCODED_EQ, SIGNED_PARAM, URL_BEGIN_PARAMS_SYMBOL, URL_ADD_PARAMS_SYMBOL } = defaultValues;

    const parameterSymbol = url.indexOf(URL_BEGIN_PARAMS_SYMBOL) === -1 ? URL_BEGIN_PARAMS_SYMBOL : URL_ADD_PARAMS_SYMBOL;
    const dataAsString = querystring.stringify(data, ENCODED_SEP, ENCODED_EQ);
    const formattedUrl = `${url}${parameterSymbol}${SIGNED_PARAM}${dataAsString}${ENCODED_SEP}`;

    const hashedKey = utils.createHashedKey(formattedUrl, this.algorithm, this.secretKey);

    const signedUrl = `${formattedUrl}${hashedKey}`;

    return signedUrl;
  }

  /**
   * Verifying URL for validity and returns result code (0 is valid).
   * @param {Request | CustomRequestObject} req - Request.
   * @returns {number} Result code.
   */
  verifySignedUrl(req) {
    if (req === void 0 || !req) {
      throw new Error(errorMessages.REQ_UNDEFINED);
    }

    let url;
    
    const { ENCODED_SEP, ENCODED_EQ, SIGNED_PARAM_LENGTH, URL_HOST_PARAM_NAME } = defaultValues;
    
    if (typeof req === Request) {   
      url = `${req.protocol}://${req.get(URL_HOST_PARAM_NAME)}${req.originalUrl}`;
    } else {
      utils.validateCustomRequestObject(req);
      url = `${req.protocol}://${req.host}${req.originalUrl}`;
    }

    const signedParamIndex = utils.getSignedParamIndexPos(url);

    const signatureIndex = url.lastIndexOf(ENCODED_SEP) + 1;

    const dataAsString = url.substring(
      signedParamIndex + SIGNED_PARAM_LENGTH,
      signatureIndex
    );
    const data = querystring.parse(dataAsString, ENCODED_SEP, ENCODED_EQ);

    const urlSignature = url.substring(signatureIndex);
    const urlWithoutSign = url.substr(0, signatureIndex);

    const hashedKey = utils.createHashedKey(urlWithoutSign, this.algorithm, this.secretKey);

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

function onInvalidDefault() {
  throw new HttpError(httpCodes.FORBIDDEN, errorMessages.URL_SIGNATURE_IS_NOT_VALID);
}

function onExpiredDefault() {
  throw new HttpError(httpCodes.EXPIRED, errorMessages.SIGNED_URL_EXPIRED);
}
