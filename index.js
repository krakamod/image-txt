const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;

const parseImgData = (imgData) => {
  const arrayEntries = new Uint8Array(imgData.data);
  const acc = [{}];
  let index = 0;
  for (const pixelColorPart of arrayEntries) {
    switch (index % 4) {
      case 0:
        acc[acc.length - 1].r = pixelColorPart;
        break;
      case 1:
        acc[acc.length - 1].g = pixelColorPart;
        break;
      case 2:
        acc[acc.length - 1].b = pixelColorPart;
        break;
      case 3:
        acc[acc.length - 1].a = pixelColorPart;
        if (arrayEntries.length - 1 !== index) {
          acc.push({});
        }
        break;
      default:
        break;
    }

    index += 1;
  }

  const imgMap = [];
  for (let i = 0; i < imgData.height; i += 1) {
    for (let j = 0; j < imgData.width; j += 1) {
      if (!imgMap[i]) {
        imgMap.push([]);
      }
      imgMap[i].push(acc[(i * imgData.height) + j]);
    } 
  }
  
  return imgMap;
}

const parsePng = (imageSrc) => new Promise((resolve, reject) => {
  const png = new PNG();
  png.parse(imageSrc, (err, imgData) => {
    if (err) {
      reject(err);
    }

    const imgMap = parseImgData(imgData);

    resolve(imgMap);
  });
});

const parse = async (imageSrc) => {
  const parsed = await parsePng(imageSrc);
  return parsed;
};

const readFile = (path) => new Promise((resolve, reject) => {
  fs.readFile(path, (err, data) => {
    if (err) {
      reject(err);
    }
    resolve(data);
  });
});

const writeFile = (path, data) => new Promise((resolve, reject) => {
  fs.writeFile(path, data, (err) => {
    if (err) {
      reject(err);
    }
    resolve();
  });
});

const generateImage = (path, imageData) => new Promise((resolve, reject) => {
  let png = new PNG({
    width: imageData[0].length,
    height: imageData.length,
    filterType: -1
  });

  imageData.forEach((row, y) => {
    row.forEach((color, x) => {
      let idx = (png.width * y + x) << 2;
      png.data[idx] = Number(color.r); // red
      png.data[idx + 1] = Number(color.g); // green
      png.data[idx + 2] = Number(color.b); // blue
      png.data[idx + 3] = Number(color.a); // alpha (0 is transparent)
    });
  });

  png.pack().pipe(fs.createWriteStream(path));
});

const main = async () => {
  try {
    const imageSrc = await readFile(path.join(__dirname, 'test-img.png'));

    const parsedImage = await parse(imageSrc);

    await writeFile(path.join(__dirname, 'test-img.txt'), JSON.stringify(parsedImage));

    const imageTextSrc = await readFile(path.join(__dirname, 'test-img.txt'));
    const parsedTextImage = JSON.parse(imageTextSrc);

    await generateImage(path.join(__dirname, 'test.png'), parsedTextImage);

  } catch (err) {
    console.error('error:', err);
  }
};

main();
