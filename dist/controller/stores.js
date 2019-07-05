"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;var _config = _interopRequireDefault(require("./../util/config.js"));
var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));
var _errorHandler = _interopRequireDefault(require("../util/errorHandler.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

var conn = _config["default"].dbInitConnect();function

login(_x, _x2) {return _login.apply(this, arguments);}function _login() {_login = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {var email, storeResult;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.prev = 0;

            email = req.body.email;if (!
            email) {_context.next = 9;break;}_context.next = 5;return (
              _sqlHelpers["default"].getStoreInfoFromEmail(email));case 5:storeResult = _context.sent;
            if (!storeResult) {
              res.status(400).send({ err: "Store email does not exist" });
            } else
            {
              res.status(200).send({
                storeId: storeResult["store_id"],
                name: storeResult["name"],
                email: storeResult["email"] });

            }_context.next = 10;break;case 9:

            res.status(400).send({ err: "Missing email in request body " });case 10:_context.next = 16;break;case 12:_context.prev = 12;_context.t0 = _context["catch"](0);


            _errorHandler["default"].handleError(_context.t0, "stores/login");
            res.status(500).send();case 16:case "end":return _context.stop();}}}, _callee, null, [[0, 12]]);}));return _login.apply(this, arguments);}var _default =



{
  login: login };exports["default"] = _default;