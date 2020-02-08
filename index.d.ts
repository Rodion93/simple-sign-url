export = SignUrl;

declare class SignUrl {
  /**
   * SignUrl constructor.
   * @param {SignUrlOptions} options - Starting options.
   */
  constructor(options: SignUrlOptions) {}

  /**
   * Generates secured url.
   * @param {string} url - Existing url(full address).
   * @param {string} httpMethod - The http method.
   * @returns {string} Signed url.
   */
  generateSignedUrl(url: string, httpMethod: string): string;

  /**
   * Verifying URL for validity and returns result code (0 is valid).
   * @param {Request} req - Request.
   * @returns {number} Result code.
   */
  verifySignedUrl(req: Request): number;

  /**
   * Returns express middleware
   * @param {Function} [onInvalid] - Function that emits when the signature is invalid.
   * @param {Function} [onExpired] - Function that emits when the signature is expired.
   * @returns {Function} Express middleware.
   */
  verifier(onInvalid?: Function, onExpired?: Function): Function;
}

/**
 * SignUrl options object.
 * @param {string} secretKey - The secret string.
 * @param {number} [ttl] - The default time-to-live in seconds.
 * @param {string} [algorithm] - The hashing algorithm.
 */
declare type SignUrlOptions = {
  secretKey: string;
  ttl?: number;
  algorithm?: string;
};
