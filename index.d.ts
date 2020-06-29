export = SignUrl;

declare class SignUrl {
  /**
   * SignUrl constructor
   *
   * @param {string} secretKey - The secret string.
   * @param {number} [ttl] - The default time-to-live in seconds.
   * @param {string} [algorithm] - The hashing algorithm.
   */
  constructor(secretKey: string, ttl?: number, algorithm?: string);

  /**
   * Generates secured url
   *
   * @param {string} url - Existing url(full address).
   * @param {string} httpMethod - The http method.
   * @returns {string} Signed url.
   */
  generateSignedUrl(url: string, httpMethod: string): string;

  /**
   * Verifying URL for validity and returns result code (0 is valid)
   *
   * @param {Request | CustomRequestObject} req - Request or Custom object.
   * @returns {number} Result code.
   */
  verifySignedUrl(req: Request | CustomRequestObject): number;

  /**
   * Returns express middleware
   *
   * @param {Function} [onInvalid] - Function that emits when the signature is invalid.
   * @param {Function} [onExpired] - Function that emits when the signature is expired.
   * @returns {Function} Express middleware.
   */
  verifier(onInvalid?: Function, onExpired?: Function): Function;
}

/**
 * Custom request object
 *
 * @param {string} protocol - Protocol: http/https
 * @param {string} host - Host: localhost/ip adress/web-site
 * @param {string} originalUrl - Url without host
 * @param {string} method - GET/PUT/POST/DELETE..
 */
declare type CustomRequestObject = {
  protocol: string;
  host: string;
  originalUrl: string;
  method: string;
};
