const express = require("express");
const fetch = require("node-fetch");
const pkce = require("pkce-challenge");
const db = require("../model/db");
const utils = require("../utils");
const Jimp = require("jimp");
const router = express.Router();

let challenge;
let state;

router.get("/", (req, res) => {
  res.json({
    message:
      "api anime route, yeah, what do you want, use search, provide id or smth?",
  });
});

router.get("/authorize/:password", (req, res) => {
  if (req.params.password === process.env.ADMIN_PASSWORD) {
    challenge = pkce();

    state = Math.floor(Math.random() * 100000);

    res.redirect(
      `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${process.env.MAL_CLIENT_ID}&state=${state}&code_challenge=${challenge.code_verifier}`
    );
  } else {
    res.status(404);
  }
});

router.get("/callback", (req, res) => {
  if (req.query.state == state) {
    let params = {
      client_id: process.env.MAL_CLIENT_ID,
      client_secret: process.env.MAL_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: req.query.code,
      code_verifier: challenge.code_verifier,
    };

    let formBody = [];
    for (let param in params) {
      let key = encodeURIComponent(param);
      let value = encodeURIComponent(params[param]);
      formBody.push(key + "=" + value);
    }
    formBody = formBody.join("&");

    fetch("https://myanimelist.net/v1/oauth2/token", {
      method: "POST",
      body: formBody,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    })
      .then((res) => res.json())
      .then(async (data) => {
        db.updateMALTokens(data)
          .then(() => {
            res.send("authorization complete");
          })
          .catch((err) => {
            res.send("authorization failed: " + err);
          });
      }).catch(error => console.log());
  } else {
    res.status(404);
  }
});

router.use(async (req, res, next) => {
  if ((await db.getMALTokenExpirationDate()) - new Date() < 0) {
    let refreshToken = await db.getMALRefreshToken();
    if (refreshToken) {
      let params = {
        client_id: process.env.MAL_CLIENT_ID,
        client_secret: process.env.MAL_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      };

      let formBody = [];
      for (let param in params) {
        let key = encodeURIComponent(param);
        let value = encodeURIComponent(params[key]);
        formBody.push(key + "=" + value);
      }
      formBody = formBody.join("&");

      fetch("https://myanimelist.net/v1/oauth2/token", {
        method: "POST",
        body: formBody,
        headers: {
          "Content-Type": "application/x-www-for-urlencoded",
        },
      })
        .then((res) => res.json())
        .then(async (data) => {
          await db.updateMALTokens(data);
          next();
        });
    } else {
      res.json({ msg: "Error ocurred, valid token missing" });
    }
  } else {
    next();
  }
});

router.get("/search", async (req, res) => {
  const searchText = req.query.q;
  if (!searchText || searchText.length < 3)
    return res.json({ search_text: "", result: [] });

  fetch(`https://api.myanimelist.net/v1/anime?q=${searchText}&limit=21`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + (await db.getMALAccessToken()),
    },
  })
    .then((res) => res.json())
    .then((data) => {
      res.json({
        completed: true,
        search_text: req.query.q,
        result: data.data.map((anime) => ({
          id: anime.node.id,
          title: anime.node.title,
          img_url: anime.node.main_picture.medium,
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
  let animeArray = req.body.items;
  let options = req.body.options;
  if (animeArray.length === 9) {
    let imgUrls = {};

    let promises = [];
    for (let anime of animeArray) {
      promises.push(
        fetch(`https://api.myanimelist.net/v1/anime?q=${anime.title}`, {
          method: "GET",
          headers: {
            Authorization: "Bearer " + (await db.getMALAccessToken()),
          },
        })
          .then((res) => res.json())
          .then((data) => {
            let fetchedAnime = data.data.find((a) => a.node.id == anime.id).node;
            imgUrls[anime.id] = fetchedAnime.main_picture.large;
          })
      );
    }

    Promise.all(promises)
      .then(async () => {
        let temp = imgUrls;
        imgUrls = [];
        for (let i = 0; i < 9; i++) {
          imgUrls.push(temp[animeArray[i].id]);
        }

        let offsets;
        if (options.image_cover)
          offsets = animeArray.map((anime) => ({
            offset_y: anime.offset_y,
            offset_x: anime.offset_x,
            image_size: anime.image_size,
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
      msg: "please pass a valid array of anime",
      type: "error",
      completed: false,
    });
  }
});

module.exports = router;
