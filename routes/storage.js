const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const initModels = require('../models/init-models');
const models = initModels(sequelize);

const { BlobServiceClient } = require("@azure/storage-blob");
const { BlobClient } = require("@azure/storage-blob");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

router.get('/', async (req, res) => {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobs = await containerClient.listBlobsFlat();
        res.json(blobs);
    } catch (error) {
        console.error("Error fetching blobs:", error);
        res.status(500).json({ error: "Error fetching blobs" });
    }
});

module.exports = router