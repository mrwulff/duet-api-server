// Imports
import config from '../config/config.js';
const s3 = config.s3Init();
const request = require('request');
const path = require('path');
const mime = require('mime-types');

// TODO: use this in typeform.js
function uploadItemImageToS3(itemId, imageUrl) {
    var options = {
        uri: imageUrl,
        encoding: null
    };
    let extension = path.extname(imageUrl);
    let contentType = mime.contentType(extension);
    request(options, function (error, response, body) {
        if (error || response.statusCode !== 200) {
            console.log("failed to get Typeform image: " + imageUrl);
            console.log(error);
            throw error;
        } else {
            s3.upload({
                Body: body,
                Key: 'item-photos/item-' + itemId + extension,
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                ACL: "public-read",
                ContentType: contentType
            }, function (error, data) {
                if (error) {
                    console.log("error uploading image to s3!");
                    console.log("itemId: " + itemId);
                    console.log("imageUrl: " + imageUrl);
                    console.log(error);
                    throw error;
                } else {
                    console.log("success uploading image to s3. itemId: ", itemId);
                    console.log("contentType: " + contentType);
                    console.log("URL: ", data.Location);
                }
            });
        }
    });
}

// function testUploadItemImageToS3(req, res) {
//   try {
//     uploadItemImageToS3(req.body.itemId, req.body.imageUrl);
//     res.status(200).send();
//   } catch (e) {
//     res.status(500).send({ error: e });
//   }
// }

export default { uploadItemImageToS3 };