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
  // if (userId) {
  //   var params = {
  //     TableName: process.env.API_AMPLIFIEDTODO_USERSTATSTABLE_NAME,
  //     FilterExpression: "userId = :this_userId",
  //     ExpressionAttributeValues: { ":this_userId": userId },
  //   };
  //   myDocumentClient.scan(params, function (err, data) {
  //     console.log(err);
  //     console.log(data);

  //     if (data.Items.length !== 0) {
  //       console.log("update working");
  //       myDocumentClient.update(
  //         {
  //           TableName: process.env.API_AMPLIFIEDTODO_USERSTATSTABLE_NAME,
  //           Key: {
  //             id: data.Items[0].id,
  //           },
  //           UpdateExpression: "SET #c = :s",
  //           ExpressionAttributeValues: {
  //             ":s": data.Items[0].count + 1,
  //           },
  //           ExpressionAttributeNames: {
  //             "#c": "count",
  //           },
  //         },
  //         function (err, data) {
  //           if (err) console.log(err);
  //           else console.log(data);
  //         }
  //       );
  //     } else {
  //       console.log("put working");
  //       myDocumentClient.put(
  //         {
  //           Item: {
  //             id: uuid.v1(),
  //             userId: userId,
  //             count: 1,
  //           },
  //           TableName: process.env.API_AMPLIFIEDTODO_USERSTATSTABLE_NAME,
  //         },
  //         function (err, data) {
  //           if (err) {
  //             console.log(err);
  //           } else {
  //             console.log(data);
  //           }
  //         }
  //       );
  //     }
  //   });
  // }
};
