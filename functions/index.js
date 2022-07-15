/*
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

var AWS = require("aws-sdk");
var uuid = require("uuid");
var axios = require("axios");
var myDocumentClient = new AWS.DynamoDB();
var s3 = new AWS.S3();

const fetchResourceFromURI = async (uri) => {
  const response = await axios.get(uri, {
    responseType: "blob",
  });
  return response.data;
};

exports.handler = async (event) => {
  const img = await fetchResourceFromURI(event.img);
  const fileKey = event.img.split("/").pop();
  console.log(img);
  try {
    await s3
      .putObject({
        Bucket: process.env.bucketName,
        Key: fileKey,
        Body: img,
      })
      .promise();

    console.log("image uploaded successfully");

    await myDocumentClient
      .putItem({
        TableName: process.env.databaseTableName,
        Item: {
          id: {
            S: uuid.v1(),
          },
          image: {
            S: fileKey,
          },
        },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        link: `https://${process.env.bucketName}.s3.amazonaws.com/${fileKey}`,
      }),
    };
  } catch (error) {
    console.log(error);
  }
 
};
