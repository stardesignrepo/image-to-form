const express = require('express');
const multer = require('multer');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const vision = require('@google-cloud/vision');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;
require('dotenv').config();


const visionClient = new vision.ImageAnnotatorClient();

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'formDB',
  port: process.env.DB_PORT
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Express Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS

// Define mysqlDB API endpoints
app.get('/api/users', (req, res) => {
  db.query('SELECT * FROM formDB', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving users');
    } else {
      console.log(result);
      res.json(result);
    }
  });
});

// Define Vision API endpoint


const storage = multer.diskStorage({
  destination: '../uploads/', // Specify the destination folder to store uploaded files
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original file name as the stored file name
  },
});

const upload = multer({ storage });

app.post('/api/analyze-image',upload.single('image'), async (req, res) => {
  console.log("API was hit!!");
  try {

	if (!req.file) {
		return res.status(400).json({ error: 'No image file provided' });
	}

    const base64Image = req.file.buffer.toString('base64');
  console.log("Running API!!");
    const response = await axios.post(
      'https://vision.googleapis.com/v1/images:annotate?key=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',
      {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION'
              }
            ]
          }
        ]
      }
    );

    if (response.status !== 200) {
      console.log("Google API failed!!");
      throw new Error("Google API failed");
    }
    console.log("API ran with no errors!");

    const textAnnotations = response.data.responses[0].textAnnotations;
    console.log('Text:');
    textAnnotations.forEach((text) => console.log(text));

    res.json(textAnnotations);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error analyzing image text');
  }
});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

