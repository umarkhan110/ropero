import AWS from 'aws-sdk';
import "dotenv/config";

AWS.config.update({
    accessKeyId:process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
    region:process.env.AWS_REGION,
  });
  
  const s3 = new AWS.S3;

  const profileImageToS3 = async (imageData, fileName) => {
    const params = {
      Bucket: "ropero",
      Key: fileName,
      Body: imageData, // The binary data of the image
      ACL: "public-read",
      ContentType: "image/jpeg", // Set the appropriate content type
    };
  
    try {
      const response = await s3.putObject(params).promise();
      console.log("Image uploaded successfully:", response);
      return response;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };
  export default profileImageToS3
