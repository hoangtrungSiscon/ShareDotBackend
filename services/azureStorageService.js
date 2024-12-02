const { toLowerCaseNonAccentVietnamese } = require('../functions/non-accent-vietnamese-convert')
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const slugify = require('slugify')
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
        const pathParts = filepath.split('/');

        const containerName = pathParts[0];

        const blobFilePath = pathParts.slice(1).join('/');

        const containerClient = blobServiceClient.getContainerClient(containerName);

        const extension = path.extname(originalFileName);
        // const fileName = path.basename(originalFileName, extension);
        const blobName = `document-${uuidv4()}${extension}`;

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

async function deleteBlob(filepath) {
    try {
        const pathParts = filepath.split('/');

        const containerName = pathParts[0];

        const blobFilePath = pathParts.slice(1).join('/');

        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobFilePath);

        const exists = await blockBlobClient.exists();
        if (exists) {
            await blockBlobClient.delete();
        }
    } catch (error) {
        console.error("Error deleting blob:", error.message);
        throw new Error("Xóa file không thành công.");
    }
}

async function uploadAvatar(fileBuffer, originalFileName, filepath = null) {
    try {
        const containerName = 'account-profile-image';

        const containerClient = blobServiceClient.getContainerClient(containerName);

        if (filepath != null){
            const oldBlobFilePath = filepath.replace('account-profile-image/', '');
            const oldFile_blockBlobClient = containerClient.getBlockBlobClient(oldBlobFilePath);

            const exists = await oldFile_blockBlobClient.exists();
            if (exists) {
                await oldFile_blockBlobClient.delete();
            }
        }

        const extension = path.extname(originalFileName);
        const blobName = `profile-${uuidv4()}${extension}`;

        const blockBlobClient = containerClient.getBlockBlobClient(`${blobName}`);

        await blockBlobClient.uploadData(fileBuffer);

        const storageFilePath = `${containerName}/${blobName}`;

        return storageFilePath;
    } catch (error) {
        console.error("Error uploading file:", error.message);
        throw new Error("Upload failed.");
    }
}

async function getAvatarURL(filepath) {
    const pathParts = filepath.split('/');

    const containerName = pathParts[0];

    const blobFilePath = pathParts.slice(1).join('/');

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobFilePath);

    return blockBlobClient.url;
}

function formatName(name) {
    return slugify(toLowerCaseNonAccentVietnamese(name), { lower: true });
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

module.exports = { getBlobURL, uploadBlob, formatName, uploadAvatar, getAvatarURL, deleteBlob };