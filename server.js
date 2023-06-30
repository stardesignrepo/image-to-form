const express = require("express");
const multer = require("multer");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const vision = require("@google-cloud/vision");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = 3000;
const fs = require("fs");
require("dotenv").config();

const visionClient = new vision.ImageAnnotatorClient();

// MySQL Connection
// const db = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: "formDB",
//   port: process.env.DB_PORT,
// });

// db.connect((err) => {
//   if (err) throw err;
//   console.log("Connected to MySQL database");
// });

// Express Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS

// Define mysqlDB API endpoints
app.get("/api/users", (req, res) => {
  console.log("api works");
  return res.status(200).send("api works");
});

// Define Vision API endpoint

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "../uploads/"); // Specify the directory to which the uploaded files should be saved
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = file.mimetype.split("/")[1]; // Get the file extension from the mimetype
    const filename = `${uniqueSuffix}.${fileExtension}`;
    cb(null, filename); // Set the filename for the uploaded file
  },
});

const upload = multer({ storage: storage });

app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
  console.log("API was hit!!");
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    var base64Image;
    fs.readFile(req.file.path, (error, data) => {
      if (error) {
        return res.status(400).json({ error: "Unable to read file data " });
      } else {
        base64Image = Buffer.from(data).toString("base64");
      }
    });
    console.log("Running API!!");
    const response = await axios.post(
      "https://vision.googleapis.com/v1/images:annotate?key=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",
      {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: "DOCUMENT_TEXT_DETECTION",
              },
            ],
          },
        ],
      }
    );

    if (response.status !== 200) {
      console.log("Google API failed!!");
      throw new Error("Google API failed");
    }
    console.log("API ran with no errors!");

    const textAnnotations = response.data.responses[0].textAnnotations;
    console.log("Text:");
    textAnnotations.forEach((text) => console.log(text));

    res.json(textAnnotations);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error analyzing image text");
  }
});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
