module.exports = class HttpError extends Error {
  /**
   * HttpError constructor.
   * @param {number} status - The http status code (400 or others).
   * @param {string} [message] - Error message.
   * @constructor
   */
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
