'use strict';

const debug = require('debug')('grpc-client');

const PORT = 5000;
const HOST = 'localhost';
const PROTO_PATH = __dirname + '/../proto/services.proto';

let grpc = require('grpc');
let services = grpc.load(PROTO_PATH).services;
let messages = grpc.load(PROTO_PATH).messages;

function main() {
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

  debug("Stub: " + stub);
  debug("Repository: " + repository);

  stub.enroll(repository, function(err, response) {
    debug("Error: " + err);
    debug("Response: " + JSON.stringify(response));
  });
}

main();
