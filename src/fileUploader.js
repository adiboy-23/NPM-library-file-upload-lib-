import axios from "axios";
import imageCompression from "browser-image-compression";
import CryptoJS from "crypto-js";

class FileUploader {
  constructor(options) {
    this.url = options.url;
    this.allowedTypes = options.allowedTypes || [];
    this.onProgress = options.onProgress || (() => {});
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    this.chunkSize = options.chunkSize || 1 * 1024 * 1024; // Default 1MB
    this.maxRetries = options.maxRetries || 3;
    this.pause = false;
  }

  init(dropzone) {
    this.dropzone = dropzone;
    this.setupDragEvents();
  }

  setupDragEvents() {
    this.dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      this.dropzone.classList.add("dragging");
    });

    this.dropzone.addEventListener("dragleave", () => {
      this.dropzone.classList.remove("dragging");
    });

    this.dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      this.dropzone.classList.remove("dragging");
      const files = event.dataTransfer.files;
      this.handleFiles(files);
    });
  }

  validateFileType(file) {
    return this.allowedTypes.length === 0 || this.allowedTypes.includes(file.type);
  }

  async handleFiles(files) {
    [...files].forEach(async (file) => {
      if (this.validateFileType(file)) {
        const compressedFile = await this.compressFile(file);
        this.uploadFileWithRetry(compressedFile, this.maxRetries);
      } else {
        this.onError("Invalid file type");
      }
    });
  }

  async compressFile(file) {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      this.onError("Compression error: " + error);
      return file; 
    }
  }

  async encryptFile(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = (event) => {
        const wordArray = CryptoJS.lib.WordArray.create(event.target.result);
        const encrypted = CryptoJS.AES.encrypt(wordArray, "secretKey").toString();
        resolve(new Blob([encrypted], { type: "text/plain" }));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file); // Updated to read as ArrayBuffer
    });
  }

  async uploadFileWithRetry(file, retries) {
    try {
      await this.uploadFileInChunks(file);
    } catch (error) {
      if (retries > 0) {
        setTimeout(() => {
          this.uploadFileWithRetry(file, retries - 1);
        }, 1000);
      } else {
        this.onError("Failed to upload after multiple attempts");
      }
    }
  }

  async uploadFileInChunks(file) {
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    let currentChunk = 0;

    while (currentChunk < totalChunks && !this.pause) {
      const chunk = file.slice(currentChunk * this.chunkSize, (currentChunk + 1) * this.chunkSize);
      const encryptedChunk = await this.encryptFile(chunk);
      const formData = new FormData();
      formData.append("file", encryptedChunk);
      formData.append("chunkNumber", currentChunk + 1);
      formData.append("totalChunks", totalChunks);

      try {
        await axios.post(this.url, formData, {
          onUploadProgress: (event) => {
            const progress = ((currentChunk + (event.loaded / event.total)) / totalChunks) * 100;
            this.onProgress(progress);
          },
        });
      } catch (error) {
        this.onError(error);
        throw error;
      }

      currentChunk++;
    }

    if (currentChunk === totalChunks) {
      this.onSuccess("File uploaded successfully");
    }
  }

  pauseUpload() {
    this.pause = true;
  }

  resumeUpload(file) {
    this.pause = false;
    this.uploadFileWithRetry(file, this.maxRetries);
  }

  previewImage(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgElement = document.createElement("img");
      imgElement.src = event.target.result;
      document.body.appendChild(imgElement); 
    };
    reader.readAsDataURL(file);
  }
}

export default FileUploader;