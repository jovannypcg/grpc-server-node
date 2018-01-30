'use strict';

const debug = require('debug')('grpc-server')

const PORT = 5000;
const HOST = 'localhost';
const PROTO_PATH = __dirname + '/../proto/services.proto';

let grpc = require('grpc');
let services = grpc.load(PROTO_PATH).services;

/**
 * Implements the enroll RPC method.
 */
function enroll(call, callback) {
  callback(null, { ack: true });
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
