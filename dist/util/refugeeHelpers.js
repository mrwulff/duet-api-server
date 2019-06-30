"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;
var _sqlHelpers = _interopRequireDefault(require("../util/sqlHelpers.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function

getSingleBeneficiaryInfoAndNeeds(_x) {return _getSingleBeneficiaryInfoAndNeeds.apply(this, arguments);}function _getSingleBeneficiaryInfoAndNeeds() {_getSingleBeneficiaryInfoAndNeeds = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(beneficiaryId) {var beneficiaryInfoResult, beneficiaryObj, beneficiaryNeeds, item, needs;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:_context.next = 2;return (

              _sqlHelpers["default"].getBeneficiaryInfo(beneficiaryId));case 2:beneficiaryInfoResult = _context.sent;
            if (beneficiaryInfoResult.length === 0) {
              res.status(400).json({
                err: "Invalid Beneficiary ID" });

            }
            // Convert beneficiary object fields
            beneficiaryObj = {
              beneficiaryId: beneficiaryId,
              firstName: beneficiaryInfoResult.first_name,
              lastName: beneficiaryInfoResult.last_name,
              story: beneficiaryInfoResult.story,
              originCity: beneficiaryInfoResult.origin_city,
              originCountry: beneficiaryInfoResult.origin_country,
              currentCity: beneficiaryInfoResult.current_city,
              currentCountry: beneficiaryInfoResult.current_country,
              familyImage: beneficiaryInfoResult.family_image_url };

            // Get beneficiary needs in SQL format
            _context.next = 7;return _sqlHelpers["default"].getBeneficiaryNeeds(beneficiaryId);case 7:beneficiaryNeeds = _context.sent;if (!(
            beneficiaryNeeds.length === 0)) {_context.next = 11;break;}
            console.log("Beneficiary has no item needs!");return _context.abrupt("return",
            null);case 11:


            needs = [];
            // Convert to format that the front-end code expects
            beneficiaryNeeds.forEach(function (row) {
              item = {
                itemId: row.item_id,
                image: row.link,
                name: row.name,
                price: row.price_euros,
                storeId: row.store_id,
                storeName: row.store_name,
                storeMapsLink: row.store_maps_link,
                icon: row.icon_url,
                status: row.status,
                pickupCode: row.pickup_code,
                donationTimestamp: row.donation_timestamp };

              needs.push(item);
            });
            beneficiaryObj["needs"] = needs;return _context.abrupt("return",
            beneficiaryObj);case 15:case "end":return _context.stop();}}}, _callee);}));return _getSingleBeneficiaryInfoAndNeeds.apply(this, arguments);}function


getAllBeneficiariesInfoAndNeeds() {return _getAllBeneficiariesInfoAndNeeds.apply(this, arguments);}function _getAllBeneficiariesInfoAndNeeds() {_getAllBeneficiariesInfoAndNeeds = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {var rows, currentBeneficiaryId, beneficiaryObj, allBeneficiaryObjs;return regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_context2.next = 2;return (
              _sqlHelpers["default"].getAllBeneficiaryInfoAndNeeds());case 2:rows = _context2.sent;if (!(
            rows.length === 0)) {_context2.next = 6;break;}
            console.log("No beneficiary needs");return _context2.abrupt("return",
            null);case 6:

            currentBeneficiaryId = -1;

            allBeneficiaryObjs = [];
            // Convert to format that the front-end code expects
            rows.forEach(function (row) {
              // New beneficiary
              if (currentBeneficiaryId != row.beneficiary_id) {
                // Done with previous beneficiaryObj
                if (beneficiaryObj) {
                  allBeneficiaryObjs.push(beneficiaryObj);
                }
                // Create beneficiaryObj with first need
                beneficiaryObj = {
                  beneficiaryId: row.beneficiary_id,
                  firstName: row.first_name,
                  lastName: row.last_name,
                  story: row.story,
                  originCity: row.origin_city,
                  originCountry: row.origin_country,
                  currentCity: row.current_city,
                  currentCountry: row.current_country,
                  familyImage: row.family_image_url,
                  needs: [
                  {
                    itemId: row.item_id,
                    image: row.link,
                    name: row.name,
                    price: row.price_euros,
                    storeId: row.store_id,
                    storeName: row.store_name,
                    icon: row.icon_url,
                    status: row.status,
                    pickupCode: row.pickup_code,
                    donationTimestamp: row.donation_timestamp }] };



              }
              // Continue current beneficiary
              else {
                  // Append next item need
                  beneficiaryObj["needs"].push({
                    itemId: row.item_id,
                    image: row.link,
                    name: row.name,
                    price: row.price_euros,
                    storeId: row.store_id,
                    storeName: row.store_name,
                    icon: row.icon_url,
                    status: row.status,
                    pickupCode: row.pickup_code,
                    donationTimestamp: row.donation_timestamp });

                }
              // Move to next row (but possibly still the same beneficiaryId)
              currentBeneficiaryId = row.beneficiary_id;
            });
            // Push last beneficiaryObj
            allBeneficiaryObjs.push(beneficiaryObj);
            // Return result
            return _context2.abrupt("return", allBeneficiaryObjs);case 11:case "end":return _context2.stop();}}}, _callee2);}));return _getAllBeneficiariesInfoAndNeeds.apply(this, arguments);}var _default =


{
  getSingleBeneficiaryInfoAndNeeds: getSingleBeneficiaryInfoAndNeeds,
  getAllBeneficiariesInfoAndNeeds: getAllBeneficiariesInfoAndNeeds };exports["default"] = _default;