const querystring = require('querystring');
const utils = require('./utils');
const HttpError = require('./httpError');
const httpCodes = require('./constants/httpCodes');

const DEFAULT_ALGORITHM = 'sha512';
const DEFAULT_TTL = 60;

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
    this.secretKey = options.secretKey;
    this.ttl = options.ttl || DEFAULT_TTL;
    this.algorithm = options.algorithm || DEFAULT_ALGORITHM;

    this.generateSignedUrlSync = this.generateSignedUrlSync.bind(this);
    this.generateSignedUrl = this.generateSignedUrl.bind(this);
    this.verifySignedUrlSync = this.verifySignedUrlSync.bind(this);
    this.verifySignedUrl = this.verifySignedUrl.bind(this);
    this.verifierSync = this.verifierSync.bind(this);
    this.verifier = this.verifier.bind(this);
  }

  /**
   * Generates secured url.
   * @param {string} url - Existing url(full address).
   * @param {string} httpMethod - The http method.
   * @returns {string} Signed url.
   */
  generateSignedUrlSync(url, httpMethod) {
    if (!url || !httpMethod) {
      throw new HttpError(
        httpCodes.BAD_REQUEST,
        'URL or httpMethod is not defined'
      );
    }

    if (url.endsWith('/')) {
      throw new HttpError(httpCodes.BAD_REQUEST, 'URL must not end with /');
    }

    const data = {
      e: utils.generateExpiredParam(this.ttl),
      m: httpMethod.toUpperCase(),
      r: utils.generateRandomParam()
    };

    const parameterSymbol = url.indexOf('?') === -1 ? '?' : '&';
    const dataAsString = querystring.stringify(data, ';', ':');
    const formattedUrl = `${url}${parameterSymbol}signed=${dataAsString};`;

    const hashedKey = utils.createHashedKey(
      formattedUrl,
      this.algorithm,
      this.secretKey
    );
    const signedUrl = `${formattedUrl}${hashedKey}`;

    return signedUrl;
  }

  /**
   * Generates secured url.
   * @param {string} url - Existing url(full address).
   * @param {string} httpMethod - The http method.
   * @returns {Promise<string>} Promise<string>.
   */
  async generateSignedUrl(url, httpMethod) {
    const signedUrl = this.generateSignedUrlSync(url, httpMethod);
    return signedUrl;
  }

  /**
   * Verifying URL for validity and returns result string.
   * @param {Request} req - Request.
   * @returns {string} Result string.
   */
  verifySignedUrlSync(req) {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    const signedParamIndex = utils.getSignedParamIndexPos(url);

    const signatureIndex = url.lastIndexOf(';') + 1;

    const dataAsString = url.substring(
      signedParamIndex + utils.SIGNED_PARAM_LENGTH,
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
      return 'invalid';
    }

    if (data.m && data.m !== req.method) {
      return 'invalid';
    }
    if (data.e && data.e < utils.getCurrentDateInSeconds()) {
      return 'expired';
    }
  }

  /**
   * Verifying URL for validity and returns result string.
   * @param {Request} req - Request.
   * @returns {Promise<string>} Promise<string>.
   */
  async verifySignedUrl(req) {
    const validationResult = this.verifySignedUrlSync(req);
    return validationResult;
  }

  /**
   * Returns express middleware
   * @param {Function} [onInvalid] - Function that emits when the signature is invalid.
   * @param {Function} [onExpired] - Function that emits when the signature is expired.
   * @returns {Function} Express middleware.
   */
  verifierSync(onInvalid, onExpired) {
    const errorFunctions = {
      invalid: onInvalid || onInvalidDefault,
      expired: onExpired || onExpiredDefault
    };

    return (req, res, next) => {
      try {
        const errorFunc = this.verifySignedUrlSync(req);
        if (errorFunc) {
          errorFunctions[errorFunc](next);
          return;
        }
        req.url = utils.getUrlWithoutSignedParam(req.url);
      } catch (err) {
        next(err);
      }
      next();
    };
  }

  /**
   * Returns express async middleware
   * @param {Function} [onInvalid] - Function that emits when the signature is invalid.
   * @param {Function} [onExpired] - Function that emits when the signature is expired.
   * @returns {Promise<Function>} Express async middleware.
   */
  verifier(onInvalid, onExpired) {
    const errorFunctions = {
      invalid: onInvalid || onInvalidDefault,
      expired: onExpired || onExpiredDefault
    };

    return async (req, res, next) => {
      try {
        const errorFunc = await this.verifySignedUrl(req);
        if (errorFunc) {
          errorFunctions[errorFunc](next);
          return;
        }
        req.url = utils.getUrlWithoutSignedParam(req.url);
      } catch (err) {
        next(err);
      }
      next();
    };
  }
};

/**
 * Default function when token is not valid
 * @param {Function} next - Next function in express app(error handler for example).
 */
function onInvalidDefault(next) {
  const error = new HttpError(httpCodes.FORBIDDEN, 'Url signature is invalid');
  next(error);
}

/**
 * Default function when token expired
 * @param {Function} next - Next function in express app(error handler for example).
 */
function onExpiredDefault(next) {
  const error = new HttpError(httpCodes.EXPIRED, 'Signed URL expired');
  next(error);
}
