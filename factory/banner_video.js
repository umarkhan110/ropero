import AWS from 'aws-sdk';
import "dotenv/config";

AWS.config.update({
    accessKeyId:process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
    region:process.env.AWS_REGION,
  });
  
  const s3 = new AWS.S3;

  const bannerVideoToS3 = async (videoData, fileName) => {
    const params = {
      Bucket: "ropero",
      Key: fileName,
      Body: videoData,
      ACL: "public-read",
      ContentType: "video/mp4",
    };
  
    try {
      const response = await s3.putObject(params).promise();
      if(response){
          const s3ImageUrl = `https://ropero.s3.sa-east-1.amazonaws.com/${fileName}`;
          return s3ImageUrl;
      }
    
    } catch (error) {
      console.error("Error uploading video:", error);
      throw error;
    }
  };
  export default bannerVideoToS3
