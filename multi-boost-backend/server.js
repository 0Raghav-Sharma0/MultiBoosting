const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Map to temporarily store chunks before reassembling them
let chunkStorage = {};

app.get("/", (req, res) => {
  res.send("Backend is running. Use POST /upload to send files.");
});

app.post("/upload", upload.single("file"), (req, res) => {
  const { chunkIndex, totalChunks } = req.body;
  const fileName = req.file.originalname;
  
  console.log(`📦 Received chunk ${chunkIndex} of ${totalChunks} for ${fileName}`);

  // If this is the first chunk, initialize chunk storage for this file
  if (!chunkStorage[fileName]) {
    chunkStorage[fileName] = {
      totalChunks: parseInt(totalChunks),
      chunksReceived: 0,
      chunks: []
    };
  }

  // Store the chunk in the correct position
  chunkStorage[fileName].chunks[chunkIndex] = req.file.buffer;
  chunkStorage[fileName].chunksReceived++;

  // Check if all chunks have been received
  if (chunkStorage[fileName].chunksReceived === chunkStorage[fileName].totalChunks) {
    // All chunks have been received, now reassemble the file
    const finalPath = path.join(UPLOAD_DIR, fileName);
    const writeStream = fs.createWriteStream(finalPath);

    // Write chunks in the correct order
    chunkStorage[fileName].chunks.forEach(chunk => {
      writeStream.write(chunk);
    });

    writeStream.end(() => {
      console.log(`✅ Reassembled full file: ${fileName}`);
      delete chunkStorage[fileName]; // Clear the chunk storage after reassembling
      return res.status(200).json({ message: "File fully uploaded." });
    });
  } else {
    res.status(200).json({ message: `Chunk ${chunkIndex} saved.` });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
