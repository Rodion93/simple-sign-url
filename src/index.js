import querystring from 'querystring';
import { createHash } from './hash';
import { HttpCodes } from './constants/httpCodes';

export default class Signature {
  /**
   * @param {object} options - starting options.
   * @param {string} options.secretKey - The secret string.
   * @param {number} options.ttl - The default time-to-live in seconds.
   * @param {string} options.algorithm - The hashing algorithm.
   * @constructor
   */
  constructor(options) {
    this.secretKey = options.secretKey;
    this.ttl = options.ttl || 60;
    this.algorithm = options.algorithm || 'sha512WithRSAEncryption';

    this.getSignedUrl = this.getSignedUrl.bind(this);
    this.verifyUrl = this.verifyUrl.bind(this);
    this.verifierMiddleware = this.verifierMiddleware.bind(this);
  }

  /**
   * Generates secured url
   * @param {string} url - Existing url.
   * @param {string} method - The http method.
   * @returns {string} Signed url
   */
  getSignedUrl(url, method) {
    if (!url || !method) {
      throw new Error('url or method is not defined');
    }

    const data = {
      e: Math.floor(+new Date() / 1000) + this.ttl,
      m: method.toUpperCase()
    };

    const parameterSymbol = url.indexOf('?') === -1 ? '?' : '&';
    const dataAsString = querystring.stringify(data, ';', ':');
    const formattedUrl = `${url}${parameterSymbol}signed=${dataAsString};`;

    const hashedKey = createHash(formattedUrl, this.algorithm, this.secretKey);

    return `${formattedUrl}${hashedKey}`;
  }

  /**
   * Verifying URL for validity and returns result string.
   * @param {object} req
   * @returns {string} Result string.
   */
  verifyUrl(req) {
    if (
      !req.originalUrl.includes('&signed=') ||
      !req.originalUrl.includes('?signed=')
    ) {
      return 'invalid';
    }

    const url = `${req.protocol}://${req.host}${req.originalUrl}`;

    const lastSeparatorIndex = url.lastIndexOf(';');
    const signature = url.substring(lastSeparatorIndex);
    const urlWithoutSign = url.substr(0, lastSeparatorIndex);

    const hashedUrl = createHash(
      urlWithoutSign,
      this.algorithm,
      this.secretKey
    );

    if (hashedUrl !== signature) {
      return 'invalid';
    }

    let lastAmpPos = url.lastIndexOf('&signed=');
    if (lastAmpPos === -1) {
      lastAmpPos = url.lastIndexOf('?signed=');
    }

    const dataAsString = url.substring(lastAmpPos + 8, lastSeparatorIndex);
    const data = querystring.parse(dataAsString, ';', ':');

    if (data.m && data.m === req.method) {
      return 'invalid';
    }
    if (data.e && data.e < Math.ceil(+new Date() / 1000)) {
      return 'expired';
    }

    req.url = url.substr(0, lastAmpPos);

    return 'valid';
  }

  /**
   * Returns express middleware
   * @param {object} [options] - Includes functions - onInvalid, onExpired.
   * @param {Function} options.onInvalid - Function that emits when the signature is invalid.
   * @param {Function} options.onExpired - Function that emits when the signature is expired.
   * @returns {Function} Express middleware.
   */
  verifierMiddleware(options) {
    const self = this;
    options = options || {};
    const errorFunctions = {
      invalid:
        options.onInvalid ||
        function(res) {
          res.send(HttpCodes.FORBIDDEN);
        },
      expired:
        options.onExpired ||
        function(res) {
          res.send(HttpCodes.EXPIRED);
        }
    };

    return function(req, res, next) {
      const result = self.verifyUrl(req);
      if (result === 'valid') {
        next();
      } else {
        errorFunctions[result](res);
      }
    };
  }
}
