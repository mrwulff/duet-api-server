"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports["default"] = void 0;
var _config = _interopRequireDefault(require("./../config/config.js"));
var _cluster = require("cluster");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { "default": obj };} // Imports
var conn = _config["default"].dbInitConnect();

function getNeeds(req, res) {
  var query =
  "SELECT beneficiary_id, first_name, last_name, story, " +
  "origin_city, origin_country, current_city, current_country, family_image_url";
  if (req.query.beneficiary_id) {
    var beneficiaryId = req.query.beneficiary_id;
    conn.execute(
    query + " FROM beneficiaries WHERE beneficiary_id = ?",
    [beneficiaryId],
    function (err, rows) {
      if (err) {
        console.log(err);
        res.status(500).send({ error: err });
      } else if (rows.length == 0) {
        res.status(400).json({
          err: "Invalid Beneficiary ID" });

      } else {
        var beneficiaryObj = {
          beneficiaryId: beneficiaryId,
          firstName: rows[0].first_name,
          lastName: rows[0].last_name,
          story: rows[0].story,
          originCity: rows[0].origin_city,
          originCountry: rows[0].origin_country,
          currentCity: rows[0].current_city,
          currentCountry: rows[0].current_country,
          familyImage: rows[0].family_image_url };

        conn.execute(
        "SELECT item_id, link, items.name, pickup_code, price_euros, " +
        "status, store_id, icon_url, " +
        "stores.name as store_name, stores.google_maps as store_maps_link, " +
        "donations.timestamp as donation_timestamp " +
        "FROM items " +
        "INNER JOIN categories USING(category_id) " +
        "INNER JOIN stores USING(store_id) " +
        "LEFT JOIN donations USING(donation_id)" +
        "WHERE beneficiary_id = ?",
        [beneficiaryId],
        function (err, rows) {
          if (err) {
            console.log(err);
            res.status(400).send();
          } else if (rows.length == 0) {
            res.send({
              msg: "Beneficiary Has No Item Needs" });

          } else {
            var item;
            var needs = [];
            rows.forEach(function (obj) {
              item = {
                itemId: obj.item_id,
                image: obj.link,
                name: obj.name,
                price: obj.price_euros,
                storeId: obj.store_id,
                storeName: obj.store_name,
                storeMapsLink: obj.store_maps_link,
                icon: obj.icon_url,
                status: obj.status,
                pickupCode: obj.pickup_code,
                donationTimestamp: obj.donation_timestamp };

              needs.push(item);
            });
            beneficiaryObj["needs"] = needs;
            res.json(beneficiaryObj);
          }
        });

      }
    });

  } else {
    var result = [];
    conn.execute(
    query +
    ", item_id, link, items.name, pickup_code, price_euros, status, store_id, icon_url, " +
    "stores.name AS store_name, donations.timestamp AS donation_timestamp " +
    "FROM beneficiaries INNER JOIN items USING(beneficiary_id) INNER JOIN categories USING(category_id) " +
    "INNER JOIN stores USING(store_id) LEFT JOIN donations USING(donation_id) ORDER BY beneficiary_id",
    function (err, rows) {
      if (err) {
        console.log(err);
        res.status(500).send({ error: err });
      } else if (rows.length == 0) {
        res.json({
          msg: "No Item Needs" });

      } else {
        var current = -1;
        var beneficiaryObj;
        var _result = [];
        rows.forEach(function (obj) {
          if (current != obj.beneficiary_id) {
            if (beneficiaryObj) {
              _result.push(beneficiaryObj);
            }
            beneficiaryObj = {
              beneficiaryId: obj.beneficiary_id,
              firstName: obj.first_name,
              lastName: obj.last_name,
              story: obj.story,
              originCity: obj.origin_city,
              originCountry: obj.origin_country,
              currentCity: obj.current_city,
              currentCountry: obj.current_country,
              familyImage: obj.family_image_url,
              needs: [
              {
                itemId: obj.item_id,
                image: obj.link,
                name: obj.name,
                price: obj.price_euros,
                storeId: obj.store_id,
                storeName: obj.store_name,
                icon: obj.icon_url,
                status: obj.status,
                pickupCode: obj.pickup_code,
                donationTimestamp: obj.donation_timestamp }] };



          } else {
            beneficiaryObj["needs"].push({
              itemId: obj.item_id,
              image: obj.link,
              name: obj.name,
              price: obj.price_euros,
              storeId: obj.store_id,
              storeName: obj.store_name,
              icon: obj.icon_url,
              status: obj.status,
              pickupCode: obj.pickup_code,
              donationTimestamp: obj.donation_timestamp });

          }
          current = obj.beneficiary_id;
        });
        _result.push(beneficiaryObj);
        res.json(_result);
      }
    });

  }
}var _default =

{ getNeeds: getNeeds };exports["default"] = _default;