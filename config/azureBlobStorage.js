const { BlobServiceClient } = require('@azure/storage-blob');

class AzureBlobStorage {
  constructor(connectionString, containerName) {
    this.blobServiceClient = new BlobServiceClient(connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(containerName);
  }

  async uploadFile(file, fileName) {
    const blobClient = this.containerClient.getBlockBlobClient(fileName);
    await blobClient.uploadFile(file.path, {
      blobHTTPHeaders: {
        'Content-Type': file.mimetype
      }
    });

    return blobClient.url;
  }

  async getDownloadStream(fileName) {
    const blobClient = this.containerClient.getBlockBlobClient(fileName);
    return await blobClient.download();
  }
}

module.exports = AzureBlobStorage;