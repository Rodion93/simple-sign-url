const utils = require('./utils');
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
    url.searchParams.set('OC-Verb', httpMethod.toUpperCase());

    const hashedKey = utils.createHashedKey(
      url.toString(),
      this.algorithm,
      this.secretKey
    );

    url.searchParams.set('OC-Signature', hashedKey);
    return url.toString();
  }

  /**
   * Verifying URL for validity and returns result code.
   * @returns {number} Result code.
   */
  verifySignedUrl(url, method = 'GET') {
    url = new URL(url)
    const urlSignature = url.searchParams.get('OC-Signature')
    if (urlSignature === null) {
      return httpCodes.BAD_REQUEST;
    }
    url.searchParams.delete('OC-Signature')

    const hashedKey = utils.createHashedKey(
      url.toString(),
      this.algorithm,
      this.secretKey
    );

    if (hashedKey !== urlSignature) {
      return httpCodes.FORBIDDEN;
    }

    const ocVerb = url.searchParams.get('OC-Verb')
    if (ocVerb && ocVerb.toUpperCase() !== method.toUpperCase()) {
      return httpCodes.FORBIDDEN;
    }

    const date = url.searchParams.get('OC-Date')
    if (date === null) {
      return httpCodes.BAD_REQUEST;
    }

    var expires = url.searchParams.get('OC-Expires')
    if (expires === null) {
      return httpCodes.BAD_REQUEST;
    }
    expires = parseInt(expires)
    if (expires === NaN) {
      return httpCodes.BAD_REQUEST;
    }
    const expiryDate = new Date(date);
    console.log('date', expiryDate)
    expiryDate.setSeconds(expiryDate.getSeconds() + expires); 
    console.log('expiry', expiryDate)
    console.log('now', new Date())
    if (expiryDate < new Date()) {
      return httpCodes.EXPIRED;
    }

    return httpCodes.OK;
  }
}
