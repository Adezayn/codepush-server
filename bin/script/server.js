"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaultServer = require("./default-server");
const https = require("https");
const fs = require("fs");
defaultServer.start(function (err, app) {
    if (err) {
        throw err;
    }
    const httpsEnabled = Boolean(process.env.HTTPS) || false;
    const defaultPort = httpsEnabled ? 8443 : 3000;
    const port = Number(process.env.API_PORT) || Number(process.env.PORT) || defaultPort;
    // Use environment variable for server URL
    const serverUrl = process.env.SERVER_URL; // Default to localhost if not set
    let server;
    if (httpsEnabled) {
        const options = {
            key: fs.readFileSync("./certs/cert.key", "utf8"),
            cert: fs.readFileSync("./certs/cert.crt", "utf8"),
        };
        server = https.createServer(options, app).listen(port, function () {
            console.log(`API host listening at ${serverUrl}`);
            console.log(`CodePush Server URL: ${process.env.SERVER_URL}`);
            console.log(`process.env.EMULATED: ${process.env.EMULATED}`);
            console.log(`AZURE_STORAGE_ACCOUNT: ${process.env.AZURE_STORAGE_ACCOUNT}`);
        });

    }
    else {
        server = app.listen(port, '0.0.0.0', function () {
            console.log("API host listening at http://0.0.0.0:" + port);
        });
    }
    server.setTimeout(0);
});
