# Sharedot Backend Project

## Introduction

This is the backend system for [Sharedot](https://sharedot.azurewebsites.net) - a website to store, share and search documents, built with **Node.js** and **Express**, work with PostgreSQL, MongoDB and Azure Blob Storage.

## Installation

1. Clone or download this repository:

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file to configure environment variables:
   ```env
   CLIENT_URL=
   DB_USER=
   DB_HOST=
   DB_NAME=
   DB_PASSWORD=
   DB_PORT=
   JWT_SECRET=
   EMAIL_USER=
   EMAIL_PASSWORD=
   AZURE_STORAGE_CONNECTION_STRING=
   PAYPAL_CLIENT_ID=
   PAYPAL_SECRET_KEY=
   PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
   PAYPAL_WEBHOOK_ID=
   MONGODB_URI=
   ```

## Usage

1. Run the server:
   ```bash
   npm start
   ```

2. Open your browser and access via this url:
   ```
   http://localhost:3000
   ```

## Directory structure

```
.
├── package.json # Dependencies and scripts information
├── server.js # Main file that launches the application
├── routes/ # Routes of the application
├── models/ # Data model
├── services/ # Services
```

## Author
👤 Phạm Lê Khánh Minh <br>
👤 Nguyễn Hoàng Trung <br>

## Feedback

If you have any feedback or find a bug, please create an [issue](https://github.com/hoangtrungSiscon/ShareDotBackend/issues).

## License

This repository is distributed under the MIT license. See the [LICENSE](LICENSE).
