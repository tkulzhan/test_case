const express = require("express");
const EventEmitter = require("events");
const amqp = require("amqplib");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const PORT = 5001;

app.use(express.json());

const emitter = new EventEmitter();
var channel, connection;

connectQueue();
async function connectQueue() {
  try {
    connection = await amqp.connect(
      "amqps://mombwlwf:ST-l0O31nJnPfzAyuYc1iVyvV0Ns510y@cow.rmq2.cloudamqp.com/mombwlwf"
    );
    channel = await connection.createChannel();
    await channel.consume("actions", (data) => {
      console.log(`Received ${Buffer.from(data.content)}`);
      const action = JSON.parse(data.content);
      emitter.emit("action", action);
      channel.ack(data);
    });
    process.on("beforeExit", () => {
      console.log("closing");
      channel.close();
      connection.close();
    });
  } catch (error) {
    console.log(error);
  }
}

emitter.on("action", async (action) => {
  console.log("action => " + `${action}`);
  const history = await prisma.history.create({
    data: { ...action.data },
  });
  console.log(history);
});

app.listen(PORT, (error) => {
  if (error) {
    console.log("Error starting server");
    return;
  }
  console.log(`History service listening on http://localhost:${PORT}`);
});
