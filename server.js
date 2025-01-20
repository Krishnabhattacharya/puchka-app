const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const PORT = 8000;
require('dotenv').config();

const Database = mongoose.connection;

Database.on('Connected',()=>{
    console.log("Database connected");
});

// starting point of the server

app.get("/",cors(),(req,res)=>{
    res.status(200).json(
        "welcome to the 8 Store API"
    );
});

var corsOptions = {
    origin : '*',
    Credential : true,
    optionSuccessStatus : 200,
    port : PORT,
};

app.use(cors(corsOptions));
app.use(express.json());


const routes = require("./routes");


app.use("/api",routes);

mongoose.connect(process.env.MONGODB_URL,).then(() => console.log("MongoDB Connected"))
.catch((error) => console.error("MongoDB connection error:", error));

app.listen(PORT, ()=>{
    console.log(
        `Server started at port number : ${PORT}`
    )
})

module.exports = app;