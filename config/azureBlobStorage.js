const { toLowerCaseNonAccentVietnamese } = require('../functions/non-accent-vietnamese-convert')
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters } = require('@azure/storage-blob');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

async function getBlobURL(filepath, duration_minutes = 60) {
    const pathParts = filepath.split('/');

    const containerName = pathParts[0];

    const blobFilePath = pathParts.slice(1).join('/');

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobFilePath);

    const sasToken = generateBlobSASQueryParameters({
        containerName,
        blobName: blobFilePath,
        permissions: BlobSASPermissions.parse("r"), // read-only permission
        expiresOn: new Date(new Date().valueOf() + duration_minutes * 60 * 1000) // 1-hour expiration, subject to change
    }, blobServiceClient.credential).toString();

    return `${blockBlobClient.url}?${sasToken}`;
}

async function uploadBlob(filepath, fileBuffer, originalFileName) {
    try {
        filepath = formatName(filepath);

        const pathParts = filepath.split('/');

        const containerName = pathParts[0];

        const blobFilePath = pathParts.slice(1).join('/');

        const containerClient = blobServiceClient.getContainerClient(containerName);

        const extension = path.extname(originalFileName);
        const fileName = path.basename(originalFileName, extension);
        const blobName = `${fileName}-${uuidv4()}${extension}`;

        console.log('blobName:' + blobName)
        console.log('blobFilePath:' + blobFilePath)

        const blockBlobClient = containerClient.getBlockBlobClient(`${blobFilePath}/${blobName}`);

        await blockBlobClient.uploadData(fileBuffer);

        const storageFilePath = `${containerName}/${blobFilePath}/${blobName}`;

        return storageFilePath;
    } catch (error) {
        console.error("Error uploading file:", error.message);
        throw new Error("Upload failed.");
    }
}

function formatName(name) {
    return toLowerCaseNonAccentVietnamese(name).replace(/ /g, '-');
}


async function createContainer(containerName) {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const createContainerResponse = await containerClient.createIfNotExists();
        console.log(`Container "${containerName}" ${createContainerResponse.succeeded ? 'created' : 'already exists'}`);
        return containerClient;
    } catch (error) {
        console.error(`Error creating container "${containerName}":`, error.message);
    }
}

async function createFolders(containerClient, folderPath) {
    if (!containerClient) return; // Kiểm tra containerClient có hợp lệ không
    try {
        // Nối các phần của đường dẫn bằng dấu "/"
        const fullPath = folderPath.join('/');
        const blockBlobClient = containerClient.getBlockBlobClient(`${fullPath}/dummy.txt`);
        await blockBlobClient.upload('', 0); // Tạo thư mục giả
        console.log(`Folder path "${fullPath}" created successfully.`);
    } catch (error) {
        console.error(`Error creating folder path "${fullPath}":`, error.message);
    }
}

module.exports = { getBlobURL, uploadBlob, formatName };