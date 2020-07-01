owncloud-sign-url
======

[![Build Status](https://travis-ci.org/Rodion93/owncloud-sign-url.svg?branch=master)](https://travis-ci.org/Rodion93/owncloud-sign-url) [![npm version](https://badge.fury.io/js/owncloud-sign-url.svg)](https://badge.fury.io/js/owncloud-sign-url) [![Coverage Status](https://coveralls.io/repos/github/Rodion93/owncloud-sign-url/badge.svg?branch=master)](https://coveralls.io/github/Rodion93/owncloud-sign-url?branch=master)

owncloud-sign-url is a little node.js library for signing urls and validating them based on secret key.

**NOTE** You need a Node 10.17.0 and higher.

Init
===========

```bash
npm install owncloud-sign-url
```
or 
```bash
yarn add owncloud-sign-url
```

Create signature object based on secret.

Secret string should not be known for anyone else, except your servers

```javascript
const SignUrl = require('owncloud-sign-url');

const signUrl = new SignUrl({
  secretKey: 'your secret key string',
  ttl: 60, // optional (in seconds)
  algorithm: 'sha256' // optional
});
```

Generate signed url

```javascript
const url = 'http://example.com/resource';
const httpMethod = 'get';

const signedUrl = signUrl.generateSignedUrl(url, httpMethod);
```

Verify url on resource side

```javascript
const errorCode = this.verifySignedUrl(req);

```

License
=======

MIT