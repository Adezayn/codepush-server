"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
const api = require("./api");
const azure_storage_1 = require("./storage/azure-storage");
const file_upload_manager_1 = require("./file-upload-manager");
const json_storage_1 = require("./storage/json-storage");
const redis_manager_1 = require("./redis-manager");
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
const bodyParser = require("body-parser");
const domain = require("express-domain-middleware");
const express = require("express");
const q = require("q");
function bodyParserErrorHandler(err, req, res, next) {
    if (err) {
        if (err.message === "invalid json" || (err.name === "SyntaxError" && ~err.stack.indexOf("body-parser"))) {
            req.body = null;
            next();
        }
        else {
            next(err);
        }
    }
    else {
        next();
    }
}
async function start(done, useJsonStorage) {
    try {
      let storage;
      let isKeyVaultConfigured = false;
      let keyvaultClient;
  
      if (useJsonStorage) {
        storage = new JsonStorage();
      } else if (!process.env.AZURE_KEYVAULT_ACCOUNT) {
        storage = new AzureStorage();
      } else {
        isKeyVaultConfigured = true;
        const credential = new DefaultAzureCredential();
        const vaultName = process.env.AZURE_KEYVAULT_ACCOUNT;
        const url = `https://${vaultName}.vault.azure.net`;
        keyvaultClient = new SecretClient(url, credential);
        const secret = await keyvaultClient.getSecret(`storage-${process.env.AZURE_STORAGE_ACCOUNT}`);
        storage = new AzureStorage(process.env.AZURE_STORAGE_ACCOUNT, secret.value);
      }
  
      const app = express();
      // [ .. your existing middleware + route setup .. ]
      app.get("/", (req, res) => {
              res.send("Welcome to the CodePush REST API!");
            });
      app.get("/health", (req, res) => res.send("OK"));
      app.set("trust proxy", true);
  
      if (isKeyVaultConfigured) {
        setInterval(() => {
          keyvaultClient
            .getSecret(`storage-${process.env.AZURE_STORAGE_ACCOUNT}`)
            .then(secret => {
              return storage.reinitialize(process.env.AZURE_STORAGE_ACCOUNT, secret.value);
            })
            .catch(error => {
              console.error("Failed to reinitialize storage from Key Vault credentials");
            });
        }, Number(process.env.REFRESH_CREDENTIALS_INTERVAL) || 86400000);
      }
  
      done(null, app, storage);
    } catch (err) {
      console.error("Startup error", err);
      done(err);
    }
  }
  
