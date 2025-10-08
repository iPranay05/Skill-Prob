# Course Content Management API

This document describes the API endpoints for managing course content, including video uploads, file attachments, and downloadable resources.

## File Upload System

### Generate Presigned URL for Upload
```
POST /api/upload/presigned-url
```

**Request Body:**
```json
{
  "fileName": "video.mp4",
  "contentType": "video/mp4",
  "fileCategory": "video"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "key": "videos/1234567890-abc123.mp4",
    "publicUrl": "https://cdn.example.com/videos/1234567890-abc123.mp4",
    "maxSize": 524288000,
    "allowedTypes": ["video/mp4", "video/webm", ...]
  }
}
```

**File Categories:**
- `video`: MP4, WebM, OGG, AVI, MOV (max 500MB)
- `image`: JPEG, PNG, GIF, WebP (max 10MB)
- `document`: PDF, DOC, DOCX, PPT, PPTX, TXT (max 50MB)
- `audio`: MP3, WAV, OGG, MP4 (max 100MB)

## Course Chapters

### Create Chapter
```
POST /api/courses/{courseId}/chapters
```

**Request Body:**
```json
{
  "title": "Introduction to React",
  "description": "Learn the basics of React",
  "order_index": 1,
  "duration_minutes": 45,
  "is_free": false
}
```

### Get Chapters
```
GET /api/courses/{courseId}/chapters
```

### Update Chapter
```
PUT /api/courses/{courseId}/chapters/{chapterId}
```

### Delete Chapter
```
DELETE /api/courses/{courseId}/chapters/{chapterId}
```

## Course Content

### Create Content
```
POST /api/courses/{courseId}/chapters/{chapterId}/content
```

**Video Content Example:**
```json
{
  "title": "React Components Explained",
  "description": "Understanding React components",
  "type": "video",
  "order_index": 1,
  "duration_minutes": 30,
  "is_free": false,
  "content_data": {
    "video_url": "https://cdn.example.com/videos/react-components.mp4",
    "thumbnail_url": "https://cdn.example.com/images/react-thumb.jpg",
    "duration_seconds": 1800,
    "quality_options": [
      {
        "resolution": "1080p",
        "url": "https://cdn.example.com/videos/react-components-1080p.mp4"
      },
      {
        "resolution": "720p", 
        "url": "https://cdn.example.com/videos/react-components-720p.mp4"
      }
    ]
  }
}
```

**Document Content Example:**
```json
{
  "title": "React Cheat Sheet",
  "type": "document",
  "order_index": 2,
  "content_data": {
    "document_url": "https://cdn.example.com/documents/react-cheat-sheet.pdf",
    "preview_url": "https://cdn.example.com/previews/react-cheat-sheet.jpg",
    "page_count": 5,
    "file_size": 2048000
  }
}
```

**Quiz Content Example:**
```json
{
  "title": "React Basics Quiz",
  "type": "quiz",
  "order_index": 3,
  "duration_minutes": 15,
  "content_data": {
    "questions": [
      {
        "id": "q1",
        "question": "What is JSX?",
        "type": "multiple_choice",
        "options": ["JavaScript XML", "Java Syntax Extension", "JSON XML"],
        "correct_answer": "JavaScript XML",
        "explanation": "JSX stands for JavaScript XML",
        "points": 10
      }
    ],
    "time_limit_minutes": 15,
    "passing_score": 70,
    "max_attempts": 3
  }
}
```

### Get Content
```
GET /api/courses/{courseId}/chapters/{chapterId}/content
```

## Course Resources

### Create Resource
```
POST /api/courses/{courseId}/resources
```

**Request Body:**
```json
{
  "title": "React Documentation",
  "description": "Official React documentation PDF",
  "file_url": "https://cdn.example.com/documents/react-docs.pdf",
  "file_type": "application/pdf",
  "file_size": 5242880,
  "chapter_id": "optional-chapter-id",
  "is_free": false
}
```

### Get Resources
```
GET /api/courses/{courseId}/resources
```

### Download Resource
```
GET /api/courses/{courseId}/resources/{resourceId}/download
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://s3.amazonaws.com/presigned-download-url",
    "fileName": "React Documentation",
    "fileSize": 5242880,
    "fileType": "application/pdf"
  }
}
```

## Course Structure

### Get Complete Course Structure
```
GET /api/courses/{courseId}/structure
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chapters": [
      {
        "id": "chapter-1",
        "title": "Introduction",
        "order_index": 1,
        "content": [
          {
            "id": "content-1",
            "title": "Welcome Video",
            "type": "video",
            "order_index": 1,
            "content_data": { ... }
          }
        ]
      }
    ],
    "resources": [
      {
        "id": "resource-1",
        "title": "Course Materials",
        "file_url": "https://...",
        "is_free": false
      }
    ]
  }
}
```

## Authentication & Authorization

All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

**Permissions:**
- **Mentors**: Can create, update, delete content for their own courses
- **Students**: Can view content for enrolled courses, download resources
- **Public**: Can view free content and resources

## Error Responses

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes:**
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

## File Upload Workflow

1. **Request Presigned URL**: Call `/api/upload/presigned-url` with file details
2. **Upload to S3**: Use the presigned URL to upload directly to S3
3. **Create Content/Resource**: Use the returned `publicUrl` in content creation
4. **Access Control**: Files are publicly accessible via CDN, access control is handled at the API level

## Environment Variables

Required AWS configuration:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_CLOUDFRONT_URL=https://your-cdn-domain.cloudfront.net
```