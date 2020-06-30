# Simple-Sign-Url

[![Build Status](https://travis-ci.org/Rodion93/simple-sign-url.svg?branch=master)](https://travis-ci.org/Rodion93/simple-sign-url) [![npm version](https://badge.fury.io/js/simple-sign-url.svg)](https://badge.fury.io/js/simple-sign-url) [![Coverage Status](https://coveralls.io/repos/github/Rodion93/simple-sign-url/badge.svg?branch=master)](https://coveralls.io/github/Rodion93/simple-sign-url?branch=master)

Simple-Sign-Url is a node.js/express library for signing urls and validating them based on secret key.

**NOTE** You need a Node 10.17.0 and higher.

# Init

## Install

```bash
npm install simple-sign-url
```

or

```bash
yarn add simple-sign-url
```

Create signature object based on secret.

Secret string should not be known for anyone else, except you

## Import

```javascript
const SignUrl = require('simple-sign-url');
```

or

```javascript
import SignUrl = require('simple-sign-url');
```

Typescript

```typescript
import SignUrl = require('simple-sign-url');
```

Alternatively, if --allowSyntheticDefaultImports is turned on,
this library can also be imported as a default import:

```typescript
import SignUrl from 'simple-sign-url';
```

# Using

## Create signed url object

```javascript
const SignUrl = require('simple-sign-url');

const signUrl = new SignUrl(
  'your secret key string',
  60, // optional (in seconds)
  'sha256', // optional
);
```

## Generate signed url

```javascript
const url = 'http://example.com/resource';
const httpMethod = 'get';

const signedUrl = signUrl.generateSignedUrl(url, httpMethod);
```

## Verify url on resource side using middleware

```javascript
app.get('/resource', signUrl.verifier(), (req, res, next) => {
  res.send('ok');
});
```

## Verify url with custom callbacks

```javascript
const onInvalid = (req, res, next) => console.log('Url is invalid');
const onExpired = (req, res, next) => console.log('Url is expired');

app.get(
  '/resource',
  signUrl.verifier(onInvalid, onExpired),
  (req, res, next) => {
    res.send('ok');
  },
);
```

## Verify url in other place using custom object

```javascript
const resultCode = signUrl.verifySignedUrl({
  protocol: 'http',
  host: 'localhost:8080',
  originalUrl:
    '/source/a?signed=e:12343254;m:GET;r:1422553972;e8d071f5ae64338e3d3ac8ff0bcc583bd1d1dsa',
  method: 'GET',
});
```

# Example application

```javascript
const express = require('express');
const SignUrl = require('simple-sign-url');

const SECRET_KEY = 'Sff22dk^:ds';

const signUrl = new SignUrl(SECRET_KEY);

const app = express();

// Index with signed link
app.get('/', (req, res, next) => {
  const url = 'http://localhost:8080/source/a';
  const httpMethod = 'get';

  const signedUrl = signUrl.generateSignedUrl(url, httpMethod);

  res.send(signedUrl);
  /*
    Returns something like 
      http://localhost:8080/source/a?signed=e:12343254;m:GET;r:1422553972;e8d071f5ae64338e3d3ac8ff0bcc583bd1d1dsa
  */
});

// Validating
app.get('/source/:a', signUrl.verifier(), (req, res, next) => {
  res.send(req.params.a);
});

app.listen(8080);
```

# License

MIT
