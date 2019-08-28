"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;

var _config = _interopRequireDefault(require("./config.js"));

var _errorHandler = _interopRequireDefault(require("./errorHandler.js"));




var _piexifjs = _interopRequireDefault(require("piexifjs"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} // Imports
require("dotenv").config();var s3 = _config["default"].s3Init();var rp = require('request-promise');var path = require('path');var mime = require('mime-types');var jo = require('jpeg-autorotate');
// see: https://www.npmjs.com/package/jpeg-autorotate#thumbnail-too-large
function deleteThumbnailFromExif(imageBuffer) {
  var imageString = imageBuffer.toString('binary');
  var exifObj = _piexifjs["default"].load(imageString);
  delete exifObj.thumbnail;
  delete exifObj['1st'];
  var exifBytes = _piexifjs["default"].dump(exifObj);
  var newImageString = _piexifjs["default"].insert(exifBytes, imageString);
  return Buffer.from(newImageString, 'binary');
}function

uploadItemImageToS3(_x, _x2) {return _uploadItemImageToS.apply(this, arguments);}function _uploadItemImageToS() {_uploadItemImageToS = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(itemId, imageUrl) {var extension, contentType, imageBuffer, joResult, data, s3PhotoUrl;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.prev = 0;

            extension = path.extname(imageUrl);
            contentType = mime.contentType(extension);_context.next = 5;return (
              rp({
                uri: imageUrl,
                encoding: null }));case 5:imageBuffer = _context.sent;_context.prev = 6;


            console.log("Deleting thumbnail from exif...");
            imageBuffer = deleteThumbnailFromExif(imageBuffer);
            console.log("Rotating image...");_context.next = 12;return (
              jo.rotate(imageBuffer, {
                quality: 85 }));case 12:joResult = _context.sent;

            imageBuffer = joResult.buffer;
            console.log("Successfully rotated image");_context.next = 20;break;case 17:_context.prev = 17;_context.t0 = _context["catch"](6);


            console.log("jpeg-autorotate error: " + _context.t0);case 20:

            console.log("Uploading image to s3...");_context.next = 23;return (
              s3.upload({
                Body: imageBuffer,
                Key: process.env.AWS_S3_IMAGE_FOLDER + '/item-' + itemId + extension,
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                ACL: "public-read",
                ContentType: contentType }).
              promise());case 23:data = _context.sent;
            s3PhotoUrl = data.Location;
            console.log("Success uploading image to s3: " + s3PhotoUrl);return _context.abrupt("return",
            s3PhotoUrl);case 29:_context.prev = 29;_context.t1 = _context["catch"](0);

            _errorHandler["default"].handleError(_context.t1, "s3Helpers/uploadItemImageToS3");throw _context.t1;case 33:case "end":return _context.stop();}}}, _callee, null, [[0, 29], [6, 17]]);}));return _uploadItemImageToS.apply(this, arguments);}var _default =




{
  uploadItemImageToS3: uploadItemImageToS3 };exports["default"] = _default;