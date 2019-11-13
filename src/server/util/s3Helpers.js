// Imports
require("dotenv").config();
import config from './config.js';
const s3 = config.s3Init();
import errorHandler from './errorHandler.js';
const rp = require('request-promise');
const path = require('path');
const mime = require('mime-types');
const jo = require('jpeg-autorotate');
import piexif from 'piexifjs';

// see: https://www.npmjs.com/package/jpeg-autorotate#thumbnail-too-large
function deleteThumbnailFromExif(imageBuffer) {
  const imageString = imageBuffer.toString('binary');
  const exifObj = piexif.load(imageString);
  delete exifObj.thumbnail;
  delete exifObj['1st'];
  const exifBytes = piexif.dump(exifObj);
  const newImageString = piexif.insert(exifBytes, imageString);
  return Buffer.from(newImageString, 'binary');
}

async function uploadItemImageToS3(itemId, imageUrl) {
  try {
    const extension = path.extname(imageUrl);
    const contentType = mime.contentType(extension);
    let imageBuffer = await rp({
      uri: imageUrl,
      encoding: null
    });
    try {
      console.log("Deleting thumbnail from exif...");
      imageBuffer = deleteThumbnailFromExif(imageBuffer);
      console.log("Rotating image...");
      const joResult = await jo.rotate(imageBuffer, {
        quality: 85
      });
      imageBuffer = joResult.buffer;
      console.log("Successfully rotated image");
    }
    catch (err) {
      console.log("jpeg-autorotate error: " + err);
    }
    console.log("Uploading image to s3...");
    const data = await s3.upload({
      Body: imageBuffer,
      Key: process.env.AWS_S3_IMAGE_FOLDER + '/item-' + itemId + extension,
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      ACL: "public-read",
      ContentType: contentType
    }).promise();
    const s3PhotoUrl = data.Location;
    console.log("Success uploading image to s3: " + s3PhotoUrl);

    // return image link hosted on AWS CDN (connected to S3 bucket)
    const imageCDNLink = `${process.env.AWS_CDN}/${process.env.AWS_S3_IMAGE_FOLDER}/item-${itemId}${extension}`; 
    return imageCDNLink;

  } catch (err) {
    errorHandler.handleError(err, "s3Helpers/uploadItemImageToS3");
    throw err;
  }
}

export default { 
  uploadItemImageToS3 
};