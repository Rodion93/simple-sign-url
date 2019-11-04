const SignUrl = require('../signUrl');
const express = require('express');
const request = require('request');

function makeRequest(path, { expectedCode = 200 } = {}) {
  return new Promise((resolve, reject) => {
    request(path, (err, response, body) => {
      if (err) {
        reject(err);
        return;
      }
      if (response.statusCode != expectedCode) {
        err = new Error(`Wrong status code: ${response.statusCode}`);
        err.statusCode = response.statusCode;
        reject(err);
        return;
      }
      resolve(body);
    });
  });
}

describe('Main tests', () => {
  let signUrl;
  let app;
  let server;
  const HTTP_METHOD = 'get';
  const TEST_PORT = 33001;

  beforeAll(() => {
    signUrl = new SignUrl({
      secretKey: 'secretTest',
      ttl: 2,
      algorithm: 'sha256'
    });

    app = express();
    app.get('/try', signUrl.verifier(), (_, res) => {
      res.send('ok');
    });

    const customRoute = express.Router();

    customRoute.get('/try', signUrl.verifier(), (_, res) => res.send('ok'));

    app.use('/customRoute', customRoute);

    server = app.listen(TEST_PORT);

    app.use(async (err, req, res, next) => {
      res.status(err.status);
      res.send(err.message);
    });
  });

  afterAll(() => {
    server.close();
  });

  it('should get OK', async () => {
    const url = `http://localhost:${TEST_PORT}/try`;

    const signedUrl = await signUrl.generateSignedUrl(url, HTTP_METHOD);

    await makeRequest(signedUrl);
  });

  it('should get OK (with custom route)', async () => {
    const url = `http://localhost:${TEST_PORT}/customRoute/try`;

    const signedUrl = await signUrl.generateSignedUrl(url, HTTP_METHOD);

    await makeRequest(signedUrl);
  });

  it('should return 403 when token is not valid', async () => {
    const url = `http://localhost:${TEST_PORT}/try`;

    const signedUrl = await signUrl.generateSignedUrl(url, HTTP_METHOD);

    await makeRequest(signedUrl + '1', { expectedCode: 403 });
  });

  it('should return 410 when token expired', async () => {
    const url = `http://localhost:${TEST_PORT}/try`;

    const signedUrl = await signUrl.generateSignedUrl(url, HTTP_METHOD);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await makeRequest(signedUrl, { expectedCode: 410 });
  });
});
