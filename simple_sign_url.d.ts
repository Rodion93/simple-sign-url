declare module 'simple-sign-url' {
  interface SignUrl {
    /**
     * Generates secured url.
     * @param {string} url - Existing url.
     * @param {string} httpMethod - The http method.
     * @returns {string} Signed url.
     */
    generateSignedUrlSync(url: string, httpMethod: string): string;

    /**
     * Generates secured url.
     * @param {string} url - Existing url.
     * @param {string} httpMethod - The http method.
     * @returns {Promise<string>} Promise<string>.
     */
    generateSignedUrl(url: string, httpMethod: string): Promise<string>;

    /**
     * Verifying URL for validity and returns result string.
     * @param {Request} req - Request.
     * @returns {string} Result string.
     */
    verifySignedUrlSync(req: Request): string;

    /**
     * Verifying URL for validity and returns result string.
     * @param {Request} req - Request.
     * @returns {Promise<string>} Promise<string>.
     */
    verifySignedUrl(req: Request): Promise<string>;

    /**
     * Returns express middleware
     * @param {Function} [onInvalid] - Function that emits when the signature is invalid.
     * @param {Function} [onExpired] - Function that emits when the signature is expired.
     * @returns {Function} Express middleware.
     */
    verifierSync(onInvalid: Function, onExpired: Function): Function;

    /**
     * Returns express async middleware
     * @param {Function} [onInvalid] - Function that emits when the signature is invalid.
     * @param {Function} [onExpired] - Function that emits when the signature is expired.
     * @returns {Promise<Function>} Express async middleware.
     */
    verifier(onInvalid: Function, onExpired: Function): Promise<Function>;
  }
}
