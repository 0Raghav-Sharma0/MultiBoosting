// 🧩 Split file into chunks
function chunkFile(file, chunkSize = 1024 * 1024) {
  const chunks = [];
  let start = 0;
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
    start = end;
  }
  return chunks;
}

// 🚀 Upload a single chunk with simulated path delay
async function uploadChunk(chunk, fileName, chunkIndex, totalChunks, pathIndex) {
  const formData = new FormData();
  formData.append('file', chunk, fileName);
  formData.append('chunkIndex', chunkIndex);
  formData.append('totalChunks', totalChunks);

  const delays = [100, 200, 300]; // Simulate network path delays (ms)
  await new Promise(resolve => setTimeout(resolve, delays[pathIndex]));

  try {
    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} uploaded on path ${pathIndex + 1}`);
    } else {
      console.error(`❌ Failed to upload chunk ${chunkIndex + 1}`);
    }
  } catch (error) {
    console.error(`❌ Error uploading chunk ${chunkIndex + 1}:`, error);
  }
}

// 🛠️ Upload chunks in parallel using simulated multipath
async function uploadFileInChunks(file) {
  const chunks = chunkFile(file);
  const totalChunks = chunks.length;

  const uploadPromises = chunks.map((chunk, i) => {
    const pathIndex = i % 3; // Simulate 3 network paths
    return uploadChunk(chunk, file.name, i, totalChunks, pathIndex);
  });

  await Promise.all(uploadPromises);

  // ✅ Notify background when done
  chrome.runtime.sendMessage({
    action: 'uploadComplete',
    fileName: file.name,
  });
}

// 🎯 Detect file input on any webpage
document.addEventListener("change", (e) => {
  if (e.target.type === "file" && e.target.files.length > 0) {
    const file = e.target.files[0];
    console.log("📁 File selected:", file.name, "Size:", file.size, "bytes");
    uploadFileInChunks(file);
  }
});
