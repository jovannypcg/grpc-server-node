'use strict';

const debug = require('debug')('grpc-client');
const readline = require('readline');

const PORT = 5000;
const HOST = 'localhost';
const PROTO_PATH = __dirname + '/../proto/services.proto';

const AMQP_TAG = " [AMQP *] ===> ";

let grpc = require('grpc');
let amqp = require('amqplib/callback_api');

let services = grpc.load(PROTO_PATH).services;
let messages = grpc.load(PROTO_PATH).messages;

const AMQP_QUEUE = 'repository_enrollments';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function main() {
  let exit = false;

  rl.prompt();
  console.log();

  rl.on('line', function(line) {
      if (line === "e") rl.close();

      switch (line) {
        case 'r':
          read();
          break;

        default:
          send();
      }

      rl.prompt();
  }).on('close',function(){
      process.exit(0);
  });
}

function read() {
  debug(AMQP_TAG + "Connecting to RabbitMQ...");
  amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
      ch.assertQueue(AMQP_QUEUE, { durable: true });

      debug("#{AMQP_TAG}Waiting for messages in #{AMQP_QUEUE}. To exit press CTRL+C");
      ch.consume(AMQP_QUEUE, function(msg) {
        let buffer = new Buffer(msg.content);
        let decoded_repository = messages.Repository.decode(buffer);

        debug("Decoded repository: " + decoded_repository);
      }, {noAck: true});
    });
  });
}

function send() {
  let stub = new services.RepositoryEnrollerService((HOST + ':' + PORT), grpc.credentials.createInsecure());

  let repository = {
    name: "worker_ui",
    description: "Frontend application for the Worker UI.",
    starts: 13451,
    code_frequency: 13.52,
    language_contributions: {
      "ada": 45,
      "smalltalk": 9,
      "elm": 435
    }
  };

  debug("Sending repository with name: #{repository.name}...");

  stub.enroll(repository, function(err, response) {
    debug("Error: " + err);
    debug("Response: " + JSON.stringify(response));
  });
}

main();
