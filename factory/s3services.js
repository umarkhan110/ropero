const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: 'sa-east-1',
  });
  
  const s3 = new AWS.S3()

  // Upload images to S3
  const uploadImagesToS3 = async (images) => {
    const uploadedImages = [];
  
    for (const image of images) {
      const { imageData, fileName } = image;
console.log(image)
      const params = {
        Bucket: 'ropero',
        Key: fileName,
        Body: imageData,
        ACL: "public-read", // can be either "public-read" or "private"
        ContentType: 'image/jpeg',
      };
  
      try {
        await s3.putObject(params).promise();
        uploadedImages.push(fileName);
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }
  console.log(uploadedImages)
    return uploadedImages;
  };

  module.exports= uploadImagesToS3
