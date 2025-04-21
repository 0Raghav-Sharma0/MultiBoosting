const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('status');
const speedText = document.getElementById('speed');

let selectedFile = null;

fileInput.addEventListener('change', (e) => {
  selectedFile = e.target.files[0];
  statusText.textContent = `Selected: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`;
});

uploadBtn.addEventListener('click', () => {
  if (!selectedFile) {
    alert('Please select a file!');
    return;
  }
  uploadFileInChunksParallel(selectedFile);
});

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

async function uploadChunk(chunk, fileName, chunkIndex, totalChunks, pathIndex) {
  const formData = new FormData();
  formData.append('file', chunk, fileName);
  formData.append('chunkIndex', chunkIndex);
  formData.append('totalChunks', totalChunks);

  const delays = [100, 200, 300];
  await new Promise(resolve => setTimeout(resolve, delays[pathIndex]));

  const response = await fetch('http://localhost:5000/upload', {
    method: 'POST',
    body: formData,
  });

  return response.ok;
}

async function uploadFileInChunksParallel(file) {
  const chunks = chunkFile(file);
  const totalChunks = chunks.length;
  let completedChunks = 0;
  const startTime = Date.now();

  statusText.textContent = `Uploading ${file.name}...`;

  const uploadPromises = chunks.map((chunk, index) => {
    const pathIndex = index % 3; // Round-robin across 3 paths
    return uploadChunk(chunk, file.name, index, totalChunks, pathIndex).then((success) => {
      if (success) {
        completedChunks++;
        const percentage = (completedChunks / totalChunks) * 100;
        progressBar.style.width = percentage + '%';

        const elapsed = (Date.now() - startTime) / 1000;
        const uploadedBytes = completedChunks * 1024 * 1024; // assuming 1MB chunks
        const speed = uploadedBytes / elapsed / (1024 * 1024); // MB/sec

        speedText.textContent = `Speed: ${speed.toFixed(2)} MB/s`;
      }
    });
  });

  await Promise.all(uploadPromises);

  statusText.textContent = "✅ Upload complete!";
}
