import db from "./../config/config.js";

const conn = db.dbInitConnect();

function processTypeform(req, res) {
  let body = req.body;
  // insert entry into refugee (name -> fname, desc -> lname)
  // THIS WILL NEED TO BE MODIFIED LATER
  console.log(req.body);
  res.status(200).send();
  // conn.execute(
  //   "INSERT INTO requests (refugee_id,name,donor_id) VALUES (?,?,2)",
  //   [body.user_id, body.desc],
  //   function(err) {
  //     if (err) {
  //       console.log(err);
  //       res.status(500).send({ error: err });
  //     } else {
  //       console.log("inserted refugee need");
  //       res.status(200).send({ status: "ok" });
  //     }
  //   }
  // );
}

function getNeeds(req, res) {
  // get name, address, and description of needs from db
  // NEED TO BE MODIFIED LATER ACCORDING TO CODE ABOVE
  // conn.execute(
  //   "SELECT CONCAT(refugees.fname, ' ', refugees.lname) AS `name`, addresses.street_name AS address, requests.name AS `desc` " +
  //     "FROM refugees INNER JOIN addresses USING(address_id) INNER JOIN requests USING(refugee_id)",
  //   function(err, rows) {
  //     if (err) {
  //       console.log(err);
  //     }
  //     res.json(rows);
  //   }
  // );
  // res.json([
  //   {
  //     id: 398,
  //     name: "Almasi",
  //     origin: "Damascus, Syria",
  //     currentResettled: "Munich, Germany",
  //     familyImage:
  //       "https://www.rescue.org/sites/default/files/styles/window_width_breakpoints_theme_rescue_large_1x/public/article/1488/teaser/dsc_0997-edit.jpg?itok=GsB-pi9g&timestamp=1499184376",
  //     needs: [
  //       {
  //         icon: "http://cdn.onlinewebfonts.com/svg/img_472233.png",
  //         blurb: "Clothes for Winter"
  //       },
  //       {
  //         icon:
  //           "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTePAHJnsC-yJuZ_m5_HU0Jh_p7qp-RcZFl91PkYMjRBNjz1UpcHA",
  //         blurb: "Textbooks for children's education"
  //       },
  //       {
  //         icon: "https://static.thenounproject.com/png/88457-200.png",
  //         blurb: "Kettle for making Tea"
  //       }
  //     ]
  //   },
  //   {
  //     id: 399,
  //     name: "Omid",
  //     origin: "Kabul, Afghanistan",
  //     currentResettled: "Munich, Germany",
  //     familyImage:
  //       "http://cdn3.spiegel.de/images/image-1172522-860_poster_16x9-urwv-1172522.jpg",
  //     needs: [
  //       {
  //         icon: "http://cdn.onlinewebfonts.com/svg/img_472233.png",
  //         blurb: "Clothes for Winter"
  //       },
  //       {
  //         icon:
  //           "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTePAHJnsC-yJuZ_m5_HU0Jh_p7qp-RcZFl91PkYMjRBNjz1UpcHA",
  //         blurb: "Textbooks for children's education"
  //       },
  //       {
  //         icon: "https://static.thenounproject.com/png/88457-200.png",
  //         blurb: "Kettle for making Tea"
  //       }
  //     ]
  //   },
  //   {
  //     id: 400,
  //     name: "Khan",
  //     origin: "Tehran, Iran",
  //     currentResettled: "Lesvos, Greece",
  //     familyImage:
  //       "https://www.680news.com/wp-content/blogs.dir/sites/2/2015/09/15/HAL102_20150915298586_hd.jpg",
  //     needs: [
  //       {
  //         icon: "http://cdn.onlinewebfonts.com/svg/img_472233.png",
  //         blurb: "Clothes for Winter"
  //       },
  //       {
  //         icon:
  //           "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTePAHJnsC-yJuZ_m5_HU0Jh_p7qp-RcZFl91PkYMjRBNjz1UpcHA",
  //         blurb: "Textbooks for children's education"
  //       },
  //       {
  //         icon: "https://static.thenounproject.com/png/88457-200.png",
  //         blurb: "Kettle for making Tea"
  //       }
  //     ]
  //   }
  // ]);
}

function getFamilyInfo(req, res) {
  let beneficiaryId = req.query.beneficiary_id;
  let query =
    "SELECT CONCAT(beneficiaries.first_name, ' ', beneficiaries.last_name) as 'beneficiary_name', story, " +
    "origin_city, origin_country, current_city, current_country, family_image_url " +
    "FROM beneficiaries";
  if (req.query.beneficiaryId) {
    query += " WHERE beneficiary_id = ?";
  }

  conn.execute("", [beneficiaryId], function(err, rows) {
    if (err) {
      console.log(err);
    }
    let beneficiaryObj = {
      beneficiaryId: beneficiaryId,
      name: rows[0].beneficiary_name,
      story: rows[0].story,
      originCity: rows[0].origin_city,
      originCountry: rows[0].origin_country,
      currentCity: rows[0].current_city,
      currentCountry: rows[0].currentCountry,
      familyImage: rows[0].family_image_url
    };
    conn.execute(
      "SELECT item_id, display_link, name, price_euros, is_fulfilled, store_id FROM items WHERE beneficiary_id = ?",
      [beneficiaryId],
      function(err, rows) {
        if (err) {
          console.log(err);
        }
        let item;
        let needs = [];
        rows.forEach(function(obj) {
          item = {
            itemId: obj.item_id,
            image: obj.display_link,
            name: obj.name,
            price: obj.price_euros,
            fulfilled: obj.is_fulfilled,
            storeId: obj.store_id
          };
          needs.push(item);
        });
        beneficiaryObj["needs"] = needs;
        res.json(beneficiaryObj);
      }
    );
  });
}

export default { processTypeform, getNeeds, getFamilyInfo };
