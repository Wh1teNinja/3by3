const Jimp = require("jimp");

module.exports.generate3by3 = (imageUrls, options, offsets) => {
  return new Promise(async (resolve, reject) => {
    if (imageUrls.length !== 9) reject("Array should contain 9 url to images");
    else {
      let color = options.dark_background ? "#000000" : "#ffffff"
      let canvas = new Jimp(1024, 1024, color);
      for (let i = 0; i < 9; i++) {
        let image = await Jimp.read(imageUrls[i])
          .then((img) => {
            if (options.image_cover) {
              let offsetY = offsets[i].offset_y / 2 * (img.bitmap.height / offsets[i].image_size);
              let offsetX = offsets[i].offset_x / 2 * (img.bitmap.width / offsets[i].image_size);

              return img.crop(offsetX, offsetY, img.bitmap.width - offsetX, img.bitmap.height - offsetY)
                        .cover(330, 330, Jimp.HORIZONTAL_ALIGN_LEFT | Jimp.VERTICAL_ALIGN_TOP);
            }
            else return img.contain(330, 330, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
          })
          .catch((err) => console.log(err));
        let x = 12 + (i % 3) * 330 + (i % 3 * 5);
        let y = 12 + Math.floor(i / 3) * 330 + (Math.floor(i / 3) * 5);
        canvas.composite(image, x, y);
      }
      resolve(canvas);
    }
  });
};
