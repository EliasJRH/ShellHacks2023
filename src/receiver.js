console.clear();
require("dotenv").config();
const {
  AccountId,
  PrivateKey,
  Client,
  TopicCreateTransaction,
  TopicMessageQuery,
  TopicMessageSubmitTransaction,
} = require("@hashgraph/sdk");
const fs = require('fs')

// Grab the OPERATOR_ID and OPERATOR_KEY from the .env file
const myAccountId = process.env.MY_ACCOUNT_ID;
const myPrivateKey = process.env.MY_PRIVATE_KEY;

// Build Hedera testnet and mirror node client
const client = Client.forTestnet();

// Set the operator account ID and operator private key
client.setOperator(myAccountId, myPrivateKey);

async function receiveMessages() {
  // Create a new topic
  let txResponse = await new TopicCreateTransaction().execute(client);

  // Grab the newly generated topic ID
  let receipt = await txResponse.getReceipt(client);
  let topicId = receipt.topicId;

  let fileContents = [];

  fs.readFile(".env", 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    fileContents = data.split("\n")
    if (fileContents.length == 2){
      fileContents.push(`TOPIC_ID="${topicId}"`)
    }else{
      fileContents[2]=`TOPIC_ID="${topicId}"`
    }
  });

  // Wait 5 seconds between consensus topic creation and subscription creation
  await new Promise((resolve) => setTimeout(resolve, 5000));
  fs.writeFile(".env", fileContents.join("\n"), (err)=>{
    if (err) {
      console.error(err);
      return;
    }
  })
  console.log("Ready to receive messages")

  // Create the topic and starts listening
  new TopicMessageQuery()
    .setTopicId(topicId)
    .subscribe(client, null, (message) => {
      let messageAsString = Buffer.from(message.contents, "utf8").toString();
      console.log(
        `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
      );
    });
}

receiveMessages();