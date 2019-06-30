// Imports
import config from './config.js';
const s3 = config.s3Init();
import errorHandler from './errorHandler.js';
const rp = require('request-promise');
const path = require('path');
const mime = require('mime-types');

async function uploadItemImageToS3(itemId, imageUrl) {
    try {
        var options = {
            uri: imageUrl,
            encoding: null
        };
        let extension = path.extname(imageUrl);
        let contentType = mime.contentType(extension);

        let body = await rp(options);
        let data = await s3.upload({
            Body: body,
            Key: 'item-photos/item-' + itemId + extension,
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            ACL: "public-read",
            ContentType: contentType
        }).promise();
        let s3PhotoUrl = data.Location;
        console.log("success uploading image to s3: " + s3PhotoUrl);
        return s3PhotoUrl;
    } catch (err) {
        errorHandler.handleError(err, "s3Helpers/uploadItemImageToS3");
        throw err;
    }
}

export default { 
    uploadItemImageToS3 
};