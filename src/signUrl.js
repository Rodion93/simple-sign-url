const querystring = require('querystring');
const helpers = require('./common/utils/helpers');
const validators = require('./common/utils/validators');
const HttpError = require('./common/classes/httpError');
const httpCodes = require('./common/constants/httpCodes.constant');
const errorMessages = require('./common/constants/errorMessages.constant');
const defaultValues = require('./common/constants/defaultValues.constant');

module.exports = class SignUrl {
  /**
   * SignUrl constructor
   *
   * @param {string} secretKey - The secret string.
   * @param {number} [ttl] - The default time-to-live in seconds.
   * @param {string} [algorithm] - The hashing algorithm.
   * @constructor
   */
  constructor(secretKey, ttl, algorithm) {
    validators.validateConstructorParams(secretKey, ttl, algorithm);

    const { DEFAULT_TTL, DEFAULT_ALGORITHM } = defaultValues;

    this.secretKey = secretKey;
    this.ttl = ttl || DEFAULT_TTL;
    this.algorithm = algorithm || DEFAULT_ALGORITHM;

    this.generateSignedUrl = this.generateSignedUrl.bind(this);
    this.verifySignedUrl = this.verifySignedUrl.bind(this);
    this.verifier = this.verifier.bind(this);
  }

  /**
   * Generates secured url
   *
   * @param {string} url - Existing url(full address).
   * @param {string} httpMethod - The http method.
   * @returns {string} Signed url.
   */
  generateSignedUrl(url, httpMethod) {
    validators.validateGenerateSignedUrlParams(url, httpMethod);

    const data = {
      e: helpers.generateExpiredParam(this.ttl),
      m: httpMethod.toUpperCase(),
      r: helpers.generateRandomParam(),
    };

    const {
      ENCODED_SEP,
      ENCODED_EQ,
      SIGNED_PARAM,
      URL_BEGIN_PARAMS_SYMBOL,
      URL_ADD_PARAMS_SYMBOL,
    } = defaultValues;

    const parameterSymbol =
      url.indexOf(URL_BEGIN_PARAMS_SYMBOL) === -1
        ? URL_BEGIN_PARAMS_SYMBOL
        : URL_ADD_PARAMS_SYMBOL;
    const dataAsString = querystring.stringify(data, ENCODED_SEP, ENCODED_EQ);
    const formattedUrl = `${url}${parameterSymbol}${SIGNED_PARAM}${dataAsString}${ENCODED_SEP}`;

    const hashedKey = helpers.createHashedKey(
      formattedUrl,
      this.algorithm,
      this.secretKey,
    );

    const signedUrl = `${formattedUrl}${hashedKey}`;

    return signedUrl;
  }

  /**
   * Verifying URL for validity and returns result code (0 is valid)
   *
   * @param {Request | CustomRequestObject} req - Request.
   * @returns {number} Result code.
   */
  verifySignedUrl(req) {
    if (req === void 0 || !req) {
      throw new Error(errorMessages.REQ_UNDEFINED);
    }

    let url;

    const {
      ENCODED_SEP,
      DECODED_EQ,
      DECODED_SEP,
      SIGNED_PARAM_LENGTH,
      URL_HOST_PARAM_NAME,
      FUNCTION_TYPE,
    } = defaultValues;

    if (typeof req.get === FUNCTION_TYPE && req.get(URL_HOST_PARAM_NAME)) {
      url = `${req.protocol}://${req.get(URL_HOST_PARAM_NAME)}${
        req.originalUrl
      }`;
    } else {
      validators.validateCustomRequestObject(req);

      url = `${req.protocol}://${req.host}${req.originalUrl}`;
    }

    const signedParamIndex = helpers.getSignedParamIndexPos(url);

    const signatureIndex = url.lastIndexOf(ENCODED_SEP) + ENCODED_SEP.length;

    const dataAsString = url.substring(
      signedParamIndex + SIGNED_PARAM_LENGTH,
      signatureIndex,
    );
    const decodedStringData = decodeURIComponent(dataAsString);
    const data = querystring.parse(decodedStringData, DECODED_SEP, DECODED_EQ);

    const urlSignature = url.substring(signatureIndex);
    const urlWithoutSign = url.substr(0, signatureIndex);

    const hashedKey = helpers.createHashedKey(
      urlWithoutSign,
      this.algorithm,
      this.secretKey,
    );

    if (hashedKey !== urlSignature) {
      return httpCodes.FORBIDDEN;
    }

    if (data.m && data.m !== req.method) {
      return httpCodes.FORBIDDEN;
    }

    if (data.e && data.e < helpers.getCurrentDateInSeconds()) {
      return httpCodes.EXPIRED;
    }

    return 0;
  }

  /**
   * Returns express middleware
   *
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

        req.url = helpers.getUrlWithoutSignedParam(req.url);
      } catch (err) {
        return next(err);
      }

      return next();
    };
  }
};

function onInvalidDefault() {
  throw new HttpError(
    httpCodes.FORBIDDEN,
    errorMessages.URL_SIGNATURE_IS_NOT_VALID,
  );
}

function onExpiredDefault() {
  throw new HttpError(httpCodes.EXPIRED, errorMessages.SIGNED_URL_EXPIRED);
}
