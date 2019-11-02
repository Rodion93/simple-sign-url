const querystring = require('querystring');
const httpCodes = require('./constants/httpCodes');
const utils = require('./utils');

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
   * @param {string} url - Existing url.
   * @param {string} httpMethod - The http method.
   * @returns {string} Signed url.
   */
  generateSignedUrlSync(url, httpMethod) {
    if (!url || !httpMethod) {
      throw new Error('Url or httpMethod is not defined');
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
   * @param {string} url - Existing url.
   * @param {string} httpMethod - The http method.
   * @returns {Promise<string>} Promise<string>.
   */
  generateSignedUrl(url, httpMethod) {
    return new Promise((resolve, reject) => {
      try {
        const signedUrl = this.generateSignedUrlSync(url, httpMethod);
        resolve(signedUrl);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Verifying URL for validity and returns result string.
   * @param {Request} req - Request.
   * @returns {string} Result string.
   */
  verifySignedUrlSync(req) {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    const signedParamIndex = utils.getSignedParamIndexPos(url);

    const lastSeparatorIndex = url.lastIndexOf(';');

    const dataAsString = url.substring(
      signedParamIndex + utils.SIGNED_PARAM_LENGTH,
      lastSeparatorIndex
    );
    const data = querystring.parse(dataAsString, ';', ':');

    const urlSignature = url.substring(lastSeparatorIndex);
    const urlWithoutSign = url.substr(0, lastSeparatorIndex);

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

    return 'valid';
  }

  /**
   * Verifying URL for validity and returns result string.
   * @param {Request} req - Request.
   * @returns {Promise<string>} Promise<string>.
   */
  verifySignedUrl(req) {
    return new Promise((resolve, reject) => {
      try {
        const validationResult = this.verifySignedUrlSync(req);
        resolve(validationResult);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Returns express middleware
   * @param {Function} [onInvalid] - Function that emits when the signature is invalid.
   * @param {Function} [onExpired] - Function that emits when the signature is expired.
   * @returns {Function} Express middleware.
   */
  verifierSync(onInvalid, onExpired) {
    const errorFunctions = {
      invalid:
        onInvalid ||
        function(res) {
          res.send(httpCodes.FORBIDDEN);
        },
      expired:
        onExpired ||
        function(res) {
          res.send(httpCodes.EXPIRED);
        }
    };

    return (req, res, next) => {
      const result = this.verifySignedUrlSync(req);
      if (result === 'valid') {
        req.url = utils.getUrlWithoutSignedParam(req.url);
        next();
      } else {
        errorFunctions[result](res);
      }
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
      invalid:
        onInvalid ||
        function(res) {
          res.send(httpCodes.FORBIDDEN);
        },
      expired:
        onExpired ||
        function(res) {
          res.send(httpCodes.EXPIRED);
        }
    };

    return async (req, res, next) => {
      const result = await this.verifySignedUrl(req);
      if (result === 'valid') {
        req.url = utils.getUrlWithoutSignedParam(req.url);
        next();
      } else {
        errorFunctions[result](res);
      }
    };
  }
};
