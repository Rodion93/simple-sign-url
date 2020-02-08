const SignUrl = require('../signUrl');
const express = require('express');
const request = require('request');
const httpCodes = require('../constants/httpCodes.constant');
const errorMessages = require('../constants/errorMessages.constant');

const HTTP_GET_METHOD = 'get';
const HTTP_POST_METHOD = 'post';
const TEST_PORT = 33001;

function makeRequest(path, expectedCode = 200, httpMethod = HTTP_GET_METHOD) {
  return new Promise((resolve, reject) => {
    request(
      path,
      {
        method: httpMethod
      },
      (err, response, body) => {
        if (err) {
          reject(err);
        } else if (response.statusCode != expectedCode) {
          err = new Error(`Wrong status code: ${response.statusCode}`);
          err.statusCode = response.statusCode;
          reject(err);
        } else {
          resolve(body);
        }
      }
    );
  });
}

describe('SignUrl tests', () => {
  let signUrl;
  let app;
  let server;

  beforeAll(async () => {
    signUrl = new SignUrl({
      secretKey: 'secretTest',
      ttl: 2,
      algorithm: 'sha256'
    });

    app = express();
    app.get('/try', signUrl.verifier(), (_, res) => {
      res.send('ok');
    });
    app.post('/try', signUrl.verifier(), (_, res) => {
      res.send('ok');
    });

    const customRoute = express.Router();

    customRoute.get('/try', signUrl.verifier(), (_, res) => {
      res.send('ok');
    });

    app.use('/customRoute', customRoute);

    server = app.listen(TEST_PORT);

    app.use(async (err, req, res, next) => {
      res.status(err.status);
      res.send(err.message);
    });
  });

  afterAll(async () => {
    server.close();
  });

  describe('Ok tests', () => {
    it('should create signUrl with default params', async () => {
      const sign = new SignUrl({
        secretKey: 'secr'
      });

      expect(sign).toBeTruthy();
    });

    it('should get OK', async () => {
      const url = `http://localhost:${TEST_PORT}/try`;

      const signedUrl = signUrl.generateSignedUrl(url, HTTP_GET_METHOD);

      await makeRequest(signedUrl);
    });

    it('should get OK (with custom route)', async () => {
      const url = `http://localhost:${TEST_PORT}/customRoute/try`;

      const signedUrl = signUrl.generateSignedUrl(url, HTTP_GET_METHOD);

      await makeRequest(signedUrl);
    });

    it('should get OK (with additional parameter)', async () => {
      const url = `http://localhost:${TEST_PORT}/try?bbub=sdfsd`;

      const signedUrl = signUrl.generateSignedUrl(url, HTTP_GET_METHOD);

      await makeRequest(signedUrl);
    });
  });

  describe('Error tests', () => {
    it('should throw error when "options" is not defined', async () => {
      expect.assertions(1);

      try {
        new SignUrl();
      } catch (err) {
        expect(err.message).toEqual(errorMessages.OPTIONS_UNDEFINED);
      }
    });

    it('should throw error when "secret key" is not defined', async () => {
      expect.assertions(1);

      try {
        new SignUrl({});
      } catch (err) {
        expect(err.message).toEqual(errorMessages.SECRET_KEY_UNDEFINED);
      }
    });

    it('should throw error when "url" param is not defined', async () => {
      expect.assertions(1);

      try {
        signUrl.generateSignedUrl(undefined, HTTP_GET_METHOD);
      } catch (err) {
        expect(err.message).toEqual(errorMessages.URL_PARAM_UNDEFINED);
      }
    });

    it('should throw error when "httpMethod" param is not defined', async () => {
      expect.assertions(1);

      try {
        signUrl.generateSignedUrl('test', undefined);
      } catch (err) {
        expect(err.message).toEqual(errorMessages.HTTP_METHOD_PARAM_UNDEFINED);
      }
    });

    it('should throw error when "url" param ends with "/"', async () => {
      expect.assertions(1);
      const url = `http://localhost:${TEST_PORT}/try/`;

      try {
        signUrl.generateSignedUrl(url, HTTP_GET_METHOD);
      } catch (err) {
        expect(err.message).toEqual(errorMessages.URL_IS_NOT_VALID);
      }
    });

    it('should throw error when "signed" parameter is not defined', async () => {
      const url = `http://localhost:${TEST_PORT}/try/`;

      await makeRequest(url, httpCodes.BAD_REQUEST);
    });

    it('should return 403 when token is not valid', async () => {
      const url = `http://localhost:${TEST_PORT}/try`;

      const signedUrl = signUrl.generateSignedUrl(url, HTTP_GET_METHOD);

      await makeRequest(signedUrl + '1', httpCodes.FORBIDDEN);
    });

    it('should return 403 when httpMethod is different', async () => {
      const url = `http://localhost:${TEST_PORT}/try`;

      const signedUrl = signUrl.generateSignedUrl(url, HTTP_GET_METHOD);

      await makeRequest(signedUrl, httpCodes.FORBIDDEN, HTTP_POST_METHOD);
    });

    it('should return 410 when token expired', async () => {
      const url = `http://localhost:${TEST_PORT}/try`;

      const signedUrl = signUrl.generateSignedUrl(url, HTTP_GET_METHOD);

      await new Promise(resolve => setTimeout(resolve, 3000));

      await makeRequest(signedUrl, httpCodes.EXPIRED);
    });
  });
});
