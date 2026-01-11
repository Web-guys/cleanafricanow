<?php
/**
 * CleanAfricaNow File Upload API
 * Handle photo uploads for reports
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

class UploadAPI {
    
    /**
     * Upload file
     */
    public static function upload(): array {
        $user = Auth::requireAuth();
        
        if (!isset($_FILES['file'])) {
            errorResponse('No file uploaded', 400);
        }
        
        $file = $_FILES['file'];
        
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
            ];
            errorResponse($errors[$file['error']] ?? 'Unknown upload error', 400);
        }
        
        // Check file size
        if ($file['size'] > MAX_FILE_SIZE) {
            errorResponse('File too large. Maximum size is ' . (MAX_FILE_SIZE / 1024 / 1024) . 'MB', 400);
        }
        
        // Check file extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, ALLOWED_EXTENSIONS)) {
            errorResponse('Invalid file type. Allowed: ' . implode(', ', ALLOWED_EXTENSIONS), 400);
        }
        
        // Verify it's actually an image
        $imageInfo = getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            errorResponse('File is not a valid image', 400);
        }
        
        // Create upload directory if it doesn't exist
        $uploadDir = UPLOAD_DIR . $user['id'] . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique filename
        $filename = time() . '-' . bin2hex(random_bytes(4)) . '.' . $extension;
        $filepath = $uploadDir . $filename;
        
        // Move file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            errorResponse('Failed to save file', 500);
        }
        
        // Generate public URL
        $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') 
                   . '://' . $_SERVER['HTTP_HOST'];
        $publicUrl = $baseUrl . '/uploads/' . $user['id'] . '/' . $filename;
        
        logActivity($user['id'], 'file_uploaded', 'file', $filename);
        
        return [
            'success' => true,
            'url' => $publicUrl,
            'filename' => $filename,
            'size' => $file['size'],
            'type' => $imageInfo['mime']
        ];
    }
    
    /**
     * Delete file
     */
    public static function delete(string $filename): array {
        $user = Auth::requireAuth();
        
        $filepath = UPLOAD_DIR . $user['id'] . '/' . basename($filename);
        
        if (!file_exists($filepath)) {
            errorResponse('File not found', 404);
        }
        
        if (!unlink($filepath)) {
            errorResponse('Failed to delete file', 500);
        }
        
        logActivity($user['id'], 'file_deleted', 'file', $filename);
        
        return ['success' => true, 'message' => 'File deleted'];
    }
    
    /**
     * List user's uploads
     */
    public static function list(): array {
        $user = Auth::requireAuth();
        
        $uploadDir = UPLOAD_DIR . $user['id'] . '/';
        $files = [];
        
        if (is_dir($uploadDir)) {
            $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') 
                       . '://' . $_SERVER['HTTP_HOST'];
            
            foreach (scandir($uploadDir) as $file) {
                if ($file !== '.' && $file !== '..') {
                    $filepath = $uploadDir . $file;
                    $files[] = [
                        'filename' => $file,
                        'url' => $baseUrl . '/uploads/' . $user['id'] . '/' . $file,
                        'size' => filesize($filepath),
                        'created_at' => date('Y-m-d H:i:s', filemtime($filepath))
                    ];
                }
            }
        }
        
        return $files;
    }
}

// Router
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$filename = $_GET['filename'] ?? null;

switch ($method) {
    case 'GET':
        jsonResponse(UploadAPI::list());
        break;
        
    case 'POST':
        jsonResponse(UploadAPI::upload(), 201);
        break;
        
    case 'DELETE':
        if (!$filename) {
            errorResponse('Filename required', 400);
        }
        jsonResponse(UploadAPI::delete($filename));
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}
