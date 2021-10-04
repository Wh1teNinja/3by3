const express = require("express");
const path = require("path");
const db = require("./model/db");

const app = express();

require("dotenv").config({ path: path.resolve(__dirname, "./.env")});

db.initialize().then(() => {
  console.log("DB connection successful");
}).catch((err) => {
  console.log("Error ocurred connecting to database: " + err);
});

const PORT = process.env.PORT || 3001;

app.use(express.static(path.resolve(__dirname, '../client/build')))

app.use(express.urlencoded({extended: false}));
app.use(express.json());

// get controllers
const animeController = require("./controllers/anime");
const gamesController = require("./controllers/games");

app.get("/api", (req, res) => {
  res.json({"message": "hello from server!"})
})

app.get("/api/image/:id", (req, res) => {
  db.getImage(req.params.id).then((image) => {
    res.sendFile(image);
  }).catch(err => {
    res.status(404);
  })
});

app.use("/api/anime", animeController);
app.use("/api/games", gamesController);

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
});

app.listen(PORT, () => {
  console.log("Server listening on " + PORT);
});