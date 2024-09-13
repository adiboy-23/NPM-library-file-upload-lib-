# file-upload-lib

An advanced file upload library with drag-and-drop, progress tracking, chunked uploads, pause/resume, file compression, encryption, and retries.

## Features
- Drag-and-drop file uploads
- Chunked uploads for large files
- Pause and resume uploads
- File compression before upload
- Client-side encryption of files
- Automatic retry for failed uploads
- File type validation
- Image preview before upload
- Progress tracking

## Installation

```bash
npm install file-upload-lib
```

## USAGE

- Normal Usage

    ```
        import FileUploader from "file-upload-lib";
        import "file-upload-lib/styles.css";

        const uploader = new FileUploader({
        url: "/upload",
        allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
        chunkSize: 1 * 1024 * 1024, // 1MB
        onProgress: (progress) => console.log(`Progress: ${progress}%`),
        onSuccess: (data) => console.log("Upload Success!", data),
        onError: (error) => console.error("Error during upload", error),
        });

        const dropzone = document.getElementById("dropzone");
        uploader.init(dropzone);

        // For pause and resume functionality
        document.getElementById("pauseButton").addEventListener("click", () => uploader.pauseUpload());
        document.getElementById("resumeButton").addEventListener("click", () => uploader.resumeUpload());
    ```

- Advance Usage

    - Chunk Upload

    ```
        const uploader = new FileUploader({
            url: "/upload",
            chunkSize: 2 * 1024 * 1024, // 2MB chunks
        });
    ```

    - Image Preview

    ```
        uploader.previewImage(file);
    ```

    - Encryptic uploads -> Automatically encrypts file chunks before uploading



