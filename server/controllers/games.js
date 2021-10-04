const express = require("express");
const fetch = require("node-fetch");
const utils = require("../utils");
const Jimp = require("jimp");
const router = express.Router();

const xmlParser = new require("xml2js").Parser();

router.get("/", (req, res) => {
  res.json({
    message:
      "api game route, yeah, what do you want, use search, provide id or smth?",
  });
});

router.get("/search", async (req, res) => {
  const searchText = req.query.q;
  if (!searchText || searchText.length < 3)
    return res.json({ search_text: "", result: [] });

  fetch(
    `https://www.giantbomb.com/api/games/?api_key=${process.env.GIANTBOMB_API_KEY}&limit=21&filter=name:${searchText}`
  )
    .then((res) => res.text())
    .then((str) => xmlParser.parseStringPromise(str))
    .then((data) => {
      res.json({
        completed: true,
        search_text: req.query.q,
        result: data.response.results[0].game.map((game) => ({
          id: game.id[0],
          title: game.name,
          img_url: game.image[0].medium_url,
        })),
      });
    })
    .catch((err) => {
      res.json({
        msg: err,
        type: "error",
        completed: false,
      });
    });
});

router.post("/generate-3by3", async (req, res) => {
  let games = req.body.items;
  let options = req.body.options;
  if (games.length === 9) {
    let imgUrls = {};

    let promises = [];
    for (let game of games) {
      promises.push(
        fetch(`https://www.giantbomb.com/api/games/?api_key=${process.env.GIANTBOMB_API_KEY}&filter=name:${game.title}`)
        .then((res) => res.text())
        .then((str) => xmlParser.parseStringPromise(str))
        .then((data) => {
            let fetchedGame = data.response.results[0].game.find((g) => g.id[0] == game.id);
            imgUrls[game.id] = fetchedGame.image[0].medium_url[0];
          })
      );
    }

    Promise.all(promises)
      .then(async () => {
        let temp = imgUrls;
        imgUrls = [];
        for (let i = 0; i < 9; i++) {
          imgUrls.push(temp[games[i].id]);
        }

        let offsets;
        if (options.image_cover)
          offsets = games.map((game) => ({
            offset_y: game.offset_y,
            offset_x: game.offset_x,
            image_size: game.image_size,
          }));

        let image3by3;
        (await utils.generate3by3(imgUrls, options, offsets)).getBuffer(
          Jimp.MIME_JPEG,
          (err, buffer) => {
            image3by3 = buffer;
          }
        );

        res.writeHead(200, {
          "Content-Type": "image/jpeg",
          "Content-Length": image3by3.length,
        });
        res.end(image3by3);
      })
      .catch((err) => {
        res.json({
          msg: err,
          type: "error",
          completed: false,
        });
      });
  } else {
    res.json({
      msg: "please pass a valid array of games",
      type: "error",
      completed: false,
    });
  }
});

module.exports = router;
