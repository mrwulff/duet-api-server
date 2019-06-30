"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;
var _config = _interopRequireDefault(require("./config.js"));

var _errorHandler = _interopRequireDefault(require("./errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}var s3 = _config["default"].s3Init();
var rp = require('request-promise');
var path = require('path');
var mime = require('mime-types');function

uploadItemImageToS3(_x, _x2) {return _uploadItemImageToS.apply(this, arguments);}function _uploadItemImageToS() {_uploadItemImageToS = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(itemId, imageUrl) {var options, extension, contentType, body, data, s3PhotoUrl;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.prev = 0;

            options = {
              uri: imageUrl,
              encoding: null };

            extension = path.extname(imageUrl);
            contentType = mime.contentType(extension);_context.next = 6;return (

              rp(options));case 6:body = _context.sent;_context.next = 9;return (
              s3.upload({
                Body: body,
                Key: 'item-photos/item-' + itemId + extension,
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                ACL: "public-read",
                ContentType: contentType }).
              promise());case 9:data = _context.sent;
            s3PhotoUrl = data.Location;
            console.log("success uploading image to s3: " + s3PhotoUrl);return _context.abrupt("return",
            s3PhotoUrl);case 15:_context.prev = 15;_context.t0 = _context["catch"](0);

            _errorHandler["default"].handleError(_context.t0, "s3Helpers/uploadItemImageToS3");throw _context.t0;case 19:case "end":return _context.stop();}}}, _callee, null, [[0, 15]]);}));return _uploadItemImageToS.apply(this, arguments);}var _default =




{
  uploadItemImageToS3: uploadItemImageToS3 };exports["default"] = _default;