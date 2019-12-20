// Imports
require("dotenv").config();
import config from './config.js';
const s3 = config.s3Init();
import errorHandler from './errorHandler.js';
const rp = require('request-promise');
const path = require('path');
const mime = require('mime-types');
const sharp = require('sharp');

// S3 bucket settings
const originalPhotosBucket = 'duet-web-assets'

// jpeg settings
const jpgQuality = 80;
const jpgExtension = '.jpg'
const jpgMimeType = mime.contentType(jpgExtension);

async function processImageBuffer(imageBuffer) {
  // convert to jpeg and auto-rotate
  try {
    const processedImageBuffer = await sharp(imageBuffer)
      .jpeg({
        quality: jpgQuality
      })
      .rotate()
      .toBuffer();
    return processedImageBuffer;
  } catch (err) {
    errorHandler.handleError(err, "s3Helpers/processImageBuffer");
    throw err;
  }
}

async function uploadItemImageToS3(itemId, imageUrl) {
  try {
    // download image from Typeform
    let imageBuffer = await rp({
      uri: imageUrl,
      encoding: null
    });

    // image processing
    imageBuffer = await processImageBuffer(imageBuffer);

    // upload image to S3
    console.log("Uploading image to s3...");
    const data = await s3.upload({
      Body: imageBuffer,
      Key: process.env.AWS_S3_IMAGE_FOLDER + '/item-' + itemId + jpgExtension,
      Bucket: originalPhotosBucket,
      ACL: "public-read",
      ContentType: jpgMimeType
    }).promise();
    const s3PhotoUrl = data.Location;
    console.log("Success uploading image to s3: " + s3PhotoUrl);

    // return image link hosted on AWS CDN (connected to S3 bucket)
    const imageCDNLink = `${process.env.AWS_CDN}/${process.env.AWS_S3_IMAGE_FOLDER}/item-${itemId}${jpgExtension}`; 
    return imageCDNLink;
  } catch (err) {
    errorHandler.handleError(err, "s3Helpers/uploadItemImageToS3");
    throw err;
  }
}

async function uploadPriceTagImageToS3(itemId, priceTagImageUrl) {
  try {
    // download image from Typeform
    let imageBuffer = await rp({
      uri: priceTagImageUrl,
      encoding: null
    });

    // image processing: convert to .jpg
    imageBuffer = await processImageBuffer(imageBuffer);

    // upload image to S3
    console.log("Uploading price-tag image to s3...");
    const data = await s3.upload({
      Body: imageBuffer,
      Key: process.env.AWS_S3_IMAGE_FOLDER + '/item-' + itemId + '-price-tag' + jpgExtension,
      Bucket: originalPhotosBucket,
      ACL: "public-read",
      ContentType: jpgMimeType
    }).promise();
    const s3PhotoUrl = data.Location;
    console.log("Success uploading price-tag image to s3: " + s3PhotoUrl);

    // return image link hosted on AWS CDN (connected to S3 bucket)
    const imageCDNLink = `${process.env.AWS_CDN}/${process.env.AWS_S3_IMAGE_FOLDER}/item-${itemId}-price-tag${jpgExtension}`;
    return imageCDNLink;
  } catch (err) {
    errorHandler.handleError(err, "s3Helpers/uploadPriceTagImageToS3");
    throw err;
  }
}

export default { 
  uploadItemImageToS3,
  uploadPriceTagImageToS3
};
