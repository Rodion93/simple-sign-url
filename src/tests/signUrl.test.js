const SignUrl = require('../signUrl');
const express = require('express');
const request = require('request');
const httpCodes = require('../common/constants/httpCodes.constant');
const errorMessages = require('../common/constants/errorMessages.constant');

const HTTP_GET_METHOD = 'get';
const HTTP_POST_METHOD = 'post';
const HTTP_OK_CODE = 200;

const OK_RESPONSE = 'ok';

const TEST_VALUE = 'test';
const TEST_TTL = 1;
const TEST_ALGORITHM = 'sha256';
const TEST_PORT = 33001;
const TEST_PROTOCOL = 'http';
const TEST_HOST = `localhost:${TEST_PORT}`;
const MAIN_TEST_URL = `${TEST_PROTOCOL}://${TEST_HOST}/try`;

function makeRequest(
  path,
  expectedCode = HTTP_OK_CODE,
  httpMethod = HTTP_GET_METHOD,
) {
  return new Promise((resolve, reject) => {
    request(
      path,
      {
        method: httpMethod,
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
      },
    );
  });
}

describe('SignUrl tests', () => {
  let signUrl;
  let app;
  let server;

  const testValues = [
    undefined,
    null,
    TEST_PORT,
    { test: TEST_PORT },
    () => {},
    true,
    1n,
  ];
  const ttlTestValues = [TEST_VALUE, { test: TEST_PORT }, () => {}, true, 1n];
  const algorithmTestValues = [
    TEST_PORT,
    { test: TEST_PORT },
    () => {},
    true,
    1n,
  ];

  beforeAll(async () => {
    signUrl = new SignUrl(TEST_VALUE, TEST_TTL, TEST_ALGORITHM);

    app = express();

    const router = express.Router();

    router
      .route('/')
      .get(signUrl.verifier(), (_, res) => {
        res.send(OK_RESPONSE);
      })
      .post(signUrl.verifier(), (_, res) => {
        res.send(OK_RESPONSE);
      });

    router.get('/customRoute', signUrl.verifier(), (_, res) => {
      res.send(OK_RESPONSE);
    });

    app.use('/try', router);

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
      const sign = new SignUrl(TEST_VALUE);

      expect(sign).toBeTruthy();
    });

    it('should get OK', async () => {
      await testSignedUrlAndRequest();
    });

    it('should get OK (with custom route)', async () => {
      const url = `${MAIN_TEST_URL}/customRoute`;

      await testSignedUrlAndRequest(url);
    });

    it('should get OK (with additional parameter)', async () => {
      const url = `${MAIN_TEST_URL}?bbub=sdfsd`;

      await testSignedUrlAndRequest(url);
    });

    it('should get OK (with custom request object)', async () => {
      const signedUrl = signUrl.generateSignedUrl(
        MAIN_TEST_URL,
        HTTP_GET_METHOD,
      );

      const hostIndex = signedUrl.lastIndexOf(TEST_HOST) + TEST_HOST.length;

      const originalUrl = signedUrl.substring(hostIndex);

      const resultCode = signUrl.verifySignedUrl({
        protocol: TEST_PROTOCOL,
        host: TEST_HOST,
        originalUrl: originalUrl,
        method: HTTP_GET_METHOD.toUpperCase(),
      });

      expect(0).toEqual(resultCode);
    });
  });

  describe('Error tests', () => {
    it('should throw error when "secret key" is invalid', async () => {
      expect.assertions(testValues.length);

      testValues.forEach(testValue => {
        testConstructorParamsValidation(
          errorMessages.SECRET_KEY_UNDEFINED,
          testValue,
        );
      });
    });

    it('should throw error when "ttl" is invalid', async () => {
      expect.assertions(ttlTestValues.length);

      ttlTestValues.forEach(testValue => {
        testConstructorParamsValidation(
          errorMessages.TTL_WRONG_TYPE,
          TEST_VALUE,
          testValue,
        );
      });
    });

    it('should throw error when "algorithm" is invalid', async () => {
      expect.assertions(algorithmTestValues.length);

      algorithmTestValues.forEach(testValue => {
        testConstructorParamsValidation(
          errorMessages.ALGORITHM_WRONG_TYPE,
          TEST_VALUE,
          TEST_TTL,
          testValue,
        );
      });
    });

    it('should throw error when "req" is not defined', async () => {
      expect.assertions(1);

      try {
        signUrl.verifySignedUrl(undefined);
      } catch (err) {
        expect(err.message).toEqual(errorMessages.REQ_UNDEFINED);
      }
    });

    it('should throw error when "url" param is invalid', async () => {
      expect.assertions(testValues.length);

      testValues.forEach(testValue => {
        testGenerateSignedUrlValidation(
          errorMessages.URL_PARAM_UNDEFINED,
          testValue,
          HTTP_GET_METHOD,
        );
      });
    });

    it('should throw error when "httpMethod" param is invalid', async () => {
      expect.assertions(testValues.length);

      testValues.forEach(testValue => {
        testGenerateSignedUrlValidation(
          errorMessages.HTTP_METHOD_PARAM_UNDEFINED,
          MAIN_TEST_URL,
          testValue,
        );
      });
    });

    it('should throw error when "req.protocol" is invalid', async () => {
      expect.assertions(testValues.length);

      testValues.forEach(testValue => {
        testCustomRequestValidation(
          errorMessages.REQ_PROTOCOL_UNDEFINED,
          testValue,
          TEST_HOST,
          MAIN_TEST_URL,
          HTTP_GET_METHOD,
        );
      });
    });

    it('should throw error when "req.host" is invalid', async () => {
      expect.assertions(testValues.length);

      testValues.forEach(testValue => {
        testCustomRequestValidation(
          errorMessages.REQ_HOST_UNDEFINED,
          TEST_PROTOCOL,
          testValue,
          MAIN_TEST_URL,
          HTTP_GET_METHOD,
        );
      });
    });

    it('should throw error when "req.originalUrl" is invalid', async () => {
      expect.assertions(testValues.length);

      testValues.forEach(testValue => {
        testCustomRequestValidation(
          errorMessages.REQ_ORIGINAL_URL_UNDEFINED,
          TEST_PROTOCOL,
          TEST_HOST,
          testValue,
          HTTP_GET_METHOD,
        );
      });
    });

    it('should throw error when "req.method" is invalid', async () => {
      expect.assertions(testValues.length);

      testValues.forEach(testValue => {
        testCustomRequestValidation(
          errorMessages.REQ_METHOD_UNDEFINED,
          TEST_PROTOCOL,
          TEST_HOST,
          MAIN_TEST_URL,
          testValue,
        );
      });
    });

    it('should throw error when "url" param ends with "/"', async () => {
      expect.assertions(1);

      const url = `${MAIN_TEST_URL}/`;

      try {
        signUrl.generateSignedUrl(url, HTTP_GET_METHOD);
      } catch (err) {
        expect(err.message).toEqual(errorMessages.URL_IS_NOT_VALID);
      }
    });

    it('should throw error when "signed" parameter is not defined', async () => {
      await makeRequest(MAIN_TEST_URL, httpCodes.BAD_REQUEST);
    });

    it('should return 403 when token is not valid', async () => {
      const signedUrl = signUrl.generateSignedUrl(
        MAIN_TEST_URL,
        HTTP_GET_METHOD,
      );

      await makeRequest(signedUrl + '1', httpCodes.FORBIDDEN);
    });

    it('should return 403 when httpMethod is different', async () => {
      const signedUrl = signUrl.generateSignedUrl(
        MAIN_TEST_URL,
        HTTP_GET_METHOD,
      );

      await makeRequest(signedUrl, httpCodes.FORBIDDEN, HTTP_POST_METHOD);
    });

    it('should return 410 when token expired', async () => {
      const signedUrl = signUrl.generateSignedUrl(
        MAIN_TEST_URL,
        HTTP_GET_METHOD,
      );

      await new Promise(resolve => setTimeout(resolve, 3000));

      await makeRequest(signedUrl, httpCodes.EXPIRED);
    });
  });

  async function testSignedUrlAndRequest(url) {
    const testUrl = url || MAIN_TEST_URL;

    const signedUrl = signUrl.generateSignedUrl(testUrl, HTTP_GET_METHOD);

    await makeRequest(signedUrl);
  }

  function testConstructorParamsValidation(
    expectedMessage,
    secretKey,
    ttl,
    algorithm,
  ) {
    try {
      new SignUrl(secretKey, ttl, algorithm);
    } catch (err) {
      expect(err.message).toEqual(expectedMessage);
    }
  }

  function testGenerateSignedUrlValidation(expectedMessage, url, httpMethod) {
    try {
      signUrl.generateSignedUrl(url, httpMethod);
    } catch (err) {
      expect(err.message).toEqual(expectedMessage);
    }
  }

  function testCustomRequestValidation(
    expectedMessage,
    protocol,
    host,
    originalUrl,
    method,
  ) {
    try {
      signUrl.verifySignedUrl({
        protocol,
        host,
        originalUrl,
        method,
      });
    } catch (err) {
      expect(err.message).toEqual(expectedMessage);
    }
  }
});
