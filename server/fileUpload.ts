import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = 'uploads/project_files/';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Define allowed MIME types
const allowedMimeTypes = [
  'application/pdf', // PDF
  'application/msword', // DOC
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.ms-excel', // XLS
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'image/jpeg', // JPG/JPEG
  'image/png', // PNG
  'application/acad', // DWG (often application/octet-stream or application/dwg)
  'application/dwg', 
  'application/vnd.dwg',
  'image/vnd.dwg', // Common MIME types for DWG
  'application/dxf', // DXF
  'image/vnd.dxf',
  // Add other relevant architectural/engineering file types if needed
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize originalname to prevent path traversal or invalid characters
    const sanitizedOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '-' + sanitizedOriginalName);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, DWG, DXF files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 50 // 50MB limit
  }
});

export default upload;
