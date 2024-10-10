// const express = require('express');
// const pool = require('./config/db');

// const app = express();
// // app.use(express.json());

// // app.use('/api/auth', authRoutes);

// app.get("/", (req, res) => {
//     res.send("Hello from Express!");
//   });
  
  

// const PORT = 5433;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const http = require('http');
const app = require('./app');

const port = 3000;

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
})