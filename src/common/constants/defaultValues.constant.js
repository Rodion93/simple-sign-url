const signedParam = 'signed=';
const DECODED_EQ = ':';
const DECODED_SEP = ';';

exports.DEFAULT_ALGORITHM = 'sha512';
exports.DEFAULT_TTL = 60;
exports.SIGNED_PARAM = signedParam;
exports.ITERATION_COUNT = 10000;
exports.HASH_LENGTH = 32;
exports.DIGEST_VALUE = 'hex';
exports.ONE_SECOND_VALUE = 1000;
exports.MAX_RANDOM_VALUE = 10000000000;
exports.SIGNED_PARAM_LENGTH = signedParam.length + 1;
exports.DECODED_EQ = DECODED_EQ;
exports.DECODED_SEP = DECODED_SEP;
exports.ENCODED_EQ = encodeURIComponent(DECODED_EQ);
exports.ENCODED_SEP = encodeURIComponent(DECODED_SEP);
exports.URL_SEPARATOR = '/';
exports.URL_BEGIN_PARAMS_SYMBOL = '?';
exports.URL_ADD_PARAMS_SYMBOL = '&';
exports.URL_HOST_PARAM_NAME = 'host';
exports.FUNCTION_TYPE = 'function';