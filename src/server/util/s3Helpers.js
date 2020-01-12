// Imports
require("dotenv").config();
import config from './config.js';
import errorHandler from './errorHandler.js';
const s3 = config.s3Init();
const request = require('request');
const mime = require('mime-types');
const sharp = require('sharp');

// S3 bucket settings
const originalPhotosBucket = 'duet-web-assets';

// jpeg settings
const jpgQuality = 80;
const jpgExtension = '.jpg';
const jpgMimeType = mime.contentType(jpgExtension);

async function uploadItemImageToS3(itemId, imageUrl) {
  try {
    // stream image from Typeform, convert to jpeg, auto-rotate
    const imageTransformer = sharp().jpeg({ quality: jpgQuality }).rotate();
    const imageStream = request(imageUrl).pipe(imageTransformer);

    // upload image to S3
    console.log("Uploading image to s3...");
    const data = await s3.upload({
      Body: imageStream,
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
    // stream image from Typeform, convert to jpeg, auto-rotate
    const imageTransformer = sharp().jpeg({ quality: jpgQuality }).rotate();
    const imageStream = request(priceTagImageUrl).pipe(imageTransformer);

    // upload image to S3
    console.log("Uploading price-tag image to s3...");
    const data = await s3.upload({
      Body: imageStream,
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
