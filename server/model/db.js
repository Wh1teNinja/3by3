const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let db;

const tokenSchema = new Schema({
  type: String,
  expiration_date: Date,
  access_token: String,
  refresh_token: String,
});

let Tokens;

module.exports.initialize = () => {
  return new Promise((resolve, reject) => {
    db = mongoose.createConnection(
      `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.e4l7t.mongodb.net/3by3app?retryWrites=true&w=majority`,
      { useNewUrlParser: true, useUnifiedTopology: true }
    );

    db.on("error", (err) => {
      reject(err);
    });

    db.once("open", () => {
      Tokens = db.model("tokens", tokenSchema);
      resolve();
    });
  });
};

module.exports.updateMALTokens = (data) => {
  return new Promise(async (resolve, reject) => {
    if (data.error) reject(data.error + " " + data.message);

    let expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + data.expires_in);

    let newTokenData = {
      type: "MAL",
      expiration_date: expirationDate,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };

    let tokens = await Tokens.findOne({ type: "MAL" });
    if (!tokens) {
      let newTokens = new Tokens(newTokenData);
      newTokens.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      Tokens.updateOne({ _id: tokens._id }, { $set: newTokenData })
        .exec()
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    }
  });
};

module.exports.getMALAccessToken = () => {
  return new Promise(async (resolve, reject) => {
    tokens = await Tokens.findOne({ type: "MAL" });
    if (tokens) {
      resolve(tokens.access_token);
    } else {
      reject("authorization required");
    }
  });
};

module.exports.getMALRefreshToken = () => {
  return new Promise(async (resolve, reject) => {
    tokens = await Tokens.findOne({ type: "MAL" });
    if (tokens) {
      resolve(tokens.refresh_token);
    } else {
      reject("authorization required");
    }
  });
};

module.exports.getMALTokenExpirationDate = () => {
  return new Promise(async (resolve, reject) => {
    tokens = await Tokens.findOne({ type: "MAL" });
    if (tokens) {
      resolve(tokens.expiration_date);
    } else {
      reject("authorization required");
    }
  });
};
