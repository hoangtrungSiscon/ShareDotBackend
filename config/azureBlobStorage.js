// const { BlobServiceClient } = require('@azure/storage-blob');

// class AzureBlobStorage {
//   constructor(connectionString, containerName) {
//     this.blobServiceClient = new BlobServiceClient(connectionString);
//     this.containerClient = this.blobServiceClient.getContainerClient(containerName);
//   }

//   async uploadFile(file, fileName) {
//     const blobClient = this.containerClient.getBlockBlobClient(fileName);
//     await blobClient.uploadFile(file.path, {
//       blobHTTPHeaders: {
//         'Content-Type': file.mimetype
//       }
//     });

//     return blobClient.url;
//   }

//   async getDownloadStream(fileName) {
//     const blobClient = this.containerClient.getBlockBlobClient(fileName);
//     return await blobClient.download();
//   }
// }

// module.exports = AzureBlobStorage;

const { BlobServiceClient } = require('@azure/storage-blob');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

async function getBlobURL(blobName) {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
}

module.exports = { getBlobURL };