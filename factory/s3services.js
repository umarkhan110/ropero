import AWS from 'aws-sdk';
import "dotenv/config";

AWS.config.update({
    accessKeyId:process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
    region:process.env.AWS_REGION,
  });
  
  const s3 = new AWS.S3()

  // Upload images to S3
  const uploadImagesToS3 = async (images) => {
    const uploadedImages = [];
  
    for (const image of images) {
      const { imageData, fileName } = image;
      const timestamp = new Date().getTime();
      const fileNameWithTimestamp = `${timestamp}_${fileName}`;
      const params = {
        Bucket: 'ropero',
        Key: fileNameWithTimestamp,
        Body: imageData,
        ACL: "public-read", // can be either "public-read" or "private"
        ContentType: 'image/jpeg',
      };
  
      try {
        await s3.putObject(params).promise();
        uploadedImages.push(`https://ropero.s3.sa-east-1.amazonaws.com/${fileNameWithTimestamp}`);
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }
    return uploadedImages;
  };

  export default uploadImagesToS3
