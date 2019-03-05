import db from "./../config/config.js";

const conn = db.dbInitConnect();

function processTypeform(req, res) {
  let body = req.body;
  // insert entry into refugee (name -> fname, desc -> lname)
  // THIS WILL NEED TO BE MODIFIED LATER
  console.log(req);
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
  res.json([
    {
      id: 398,
      name: "Almasi",
      origin: "Damascus, Syria",
      currentResettled: "Munich, Germany",
      familyImage:
        "https://www.rescue.org/sites/default/files/styles/window_width_breakpoints_theme_rescue_large_1x/public/article/1488/teaser/dsc_0997-edit.jpg?itok=GsB-pi9g&timestamp=1499184376",
      needs: [
        {
          icon: "http://cdn.onlinewebfonts.com/svg/img_472233.png",
          blurb: "Clothes for Winter"
        },
        {
          icon:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTePAHJnsC-yJuZ_m5_HU0Jh_p7qp-RcZFl91PkYMjRBNjz1UpcHA",
          blurb: "Textbooks for children's education"
        },
        {
          icon: "https://static.thenounproject.com/png/88457-200.png",
          blurb: "Kettle for making Tea"
        }
      ]
    },
    {
      id: 399,
      name: "Omid",
      origin: "Kabul, Afghanistan",
      currentResettled: "Munich, Germany",
      familyImage:
        "http://cdn3.spiegel.de/images/image-1172522-860_poster_16x9-urwv-1172522.jpg",
      needs: [
        {
          icon: "http://cdn.onlinewebfonts.com/svg/img_472233.png",
          blurb: "Clothes for Winter"
        },
        {
          icon:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTePAHJnsC-yJuZ_m5_HU0Jh_p7qp-RcZFl91PkYMjRBNjz1UpcHA",
          blurb: "Textbooks for children's education"
        },
        {
          icon: "https://static.thenounproject.com/png/88457-200.png",
          blurb: "Kettle for making Tea"
        }
      ]
    },
    {
      id: 400,
      name: "Khan",
      origin: "Tehran, Iran",
      currentResettled: "Lesvos, Greece",
      familyImage:
        "https://www.680news.com/wp-content/blogs.dir/sites/2/2015/09/15/HAL102_20150915298586_hd.jpg",
      needs: [
        {
          icon: "http://cdn.onlinewebfonts.com/svg/img_472233.png",
          blurb: "Clothes for Winter"
        },
        {
          icon:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTePAHJnsC-yJuZ_m5_HU0Jh_p7qp-RcZFl91PkYMjRBNjz1UpcHA",
          blurb: "Textbooks for children's education"
        },
        {
          icon: "https://static.thenounproject.com/png/88457-200.png",
          blurb: "Kettle for making Tea"
        }
      ]
    }
  ]);
}

function getFamilyInfo(req, res) {
  res.json({
    beneficiaryId: 398,
    name: "Almasi",
    story: "",
    originCity: "Damascus",
    originCountry: "Syria",
    currentCity: "Munich",
    currentCountry: "Germany",
    familyImage:
      "https://www.rescue.org/sites/default/files/styles/window_width_breakpoints_theme_rescue_large_1x/public/article/1488/teaser/dsc_0997-edit.jpg?itok=GsB-pi9g&timestamp=1499184376",
    needs: [
      {
        itemId: 1,
        image:
          "https://cdn.shopify.com/s/files/1/1143/7052/products/1_167caef8-830d-45e8-80ea-92e1d7167d13_600x.png?v=1518105578",
        name: "Coat",
        price: 17.0,
        fulfilled: false,
        storeId: 1
      },
      {
        itemId: 2,
        image:
          "https://i.pinimg.com/originals/68/5d/61/685d61a47e631a12cef4156a62cf2557.jpg",
        name: "Mathematics",
        price: 24.0,
        fulfilled: false,
        storeId: 2
      },
      {
        itemId: 3,
        image: "https://www.chantal.com/images/D/init_image896.jpg",
        name: "Kettle",
        price: 10.0,
        fulfilled: false,
        storeId: 3
      }
    ]
  });
}

export default { processTypeform, getNeeds, getFamilyInfo };
