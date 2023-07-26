export const MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validatePdfUpload(file) {
  if (!file) {
    return "Choose a PDF file first.";
  }

  const lowerName = String(file.name || "").toLowerCase();
  if (!lowerName.endsWith(".pdf")) {
    return "Only PDF files are supported.";
  }

  if (Number(file.size) > MAX_PDF_UPLOAD_BYTES) {
    return "PDF is too large. Maximum size is 10 MB.";
  }

  return "";
}

export function createMultipartFilePayload(file) {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

export function triggerFileDownload(blob, fileName) {
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(blobUrl);
}
