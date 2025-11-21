const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes'); 
require('dotenv').config();

app.use(cors()); 
app.use(express.json());

app.use('/api', routes); 

app.get("/", (req, res) => {
  res.status(200).json("Welcome to the golgappa API");
});

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started at port number: ${PORT}`);
});

module.exports = app;
