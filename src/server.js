'use strict';

const debug = require('debug')('grpc-server');

const PORT = 5000;
const HOST = 'localhost';
const PROTO_PATH = __dirname + '/../proto/services.proto';
const MSGS_PATH = __dirname + '/../proto/messages.proto';

const AMQP_TAG = " [AMQP *] ===> ";

let grpc = require('grpc');
let amqp = require('amqplib/callback_api');

let services = grpc.load(PROTO_PATH).services;
let messages = grpc.load(PROTO_PATH).messages;

const AMQP_QUEUE = 'repository_enrollments';

/**
 * Implements the enroll RPC method.
 */
function enroll(call, callback) {
  debug("Request: " + JSON.stringify(call.request));

  let encoded_repository = messages.Repository.encode(call.request);
  let encoded_buffer = encoded_repository.toBuffer();

  debug("Encoded request: " + JSON.stringify(encoded_repository));

  let decoded_repository = messages.Repository.decode(encoded_repository);
  debug("Decoded request: " + decoded_repository);

  enqueue(encoded_repository);

  callback(null, { ack: true });
}

function enqueue(encoded_repository) {
  debug(AMQP_TAG + "Connecting to RabbitMQ...");
  amqp.connect('amqp://localhost', function(err, conn) {
    if (null != err) {
      debug('Failed to connecto to RabbitMQ');
      return;
    }

    debug(AMQP_TAG + "Connected!");
    debug(encoded_repository.buffer);

    conn.createChannel((err, ch) => {
      ch.assertQueue(AMQP_QUEUE, { durable: true });
      ch.sendToQueue(AMQP_QUEUE, encoded_repository.buffer);

      debug(AMQP_TAG + "Sending data to RabbitMQ...");
    });
  });
}

/**
 * Starts an RPC server that receives requests for the
 * RepositoryEnrollerService service at the server port.
 */
function main() {
  let server = new grpc.Server();

  server.addService(services.RepositoryEnrollerService.service, { enroll: enroll });
  server.bind((HOST + ':' + PORT), grpc.ServerCredentials.createInsecure());
  server.start();

  debug('Listening on port ' + PORT);
}

main();
