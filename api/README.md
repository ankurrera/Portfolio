# API Documentation

This directory contains Vercel serverless functions for the portfolio application.

## Table of Contents

- [Email Sending Function](#email-sending-function)
- [Image Upload Functions](#image-upload-functions)

---

## Email Sending Function

The `send-email.ts` function handles contact form submissions from both the Technical and About pages.

### Environment Variables

Configure these environment variables in your Vercel project settings or `.env` file:

```
OFFICIAL_EMAIL=ankurrera@gmail.com
GMAIL_USER=ankurr.tf@gmail.com
GMAIL_PASSWORD=your_app_password_here
```

**Important:** 
- Use Google App Passwords, not your regular Gmail password
- Generate an App Password at: https://myaccount.google.com/apppasswords
- Never commit these values to the repository

### Features

- ✅ Gmail SMTP integration with Nodemailer
- ✅ Email validation (frontend + backend)
- ✅ Input sanitization to prevent injection attacks
- ✅ Rate limiting (5 requests per hour per IP)
- ✅ Minimum message length validation (10 characters)
- ✅ Source tracking (technical or about page)
- ✅ Reply-To header set to sender's email
- ✅ HTML and text email formats
- ✅ Proper error handling and logging

### API Endpoint

**POST** `/api/send-email`

**Request Body:**
```json
{
  "name": "Sender Name",
  "email": "sender@email.com",
  "subject": "Message Subject (optional)",
  "message": "Message body",
  "source": "technical | about"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

**Error Response (4xx/5xx):**
```json
{
  "error": "Error message",
  "details": "Detailed error description"
}
```

### Rate Limiting

The API implements basic rate limiting:
- **Limit:** 5 requests per hour per IP address
- **Response:** 429 Too Many Requests when limit is exceeded

For production with multiple instances, consider using Redis for distributed rate limiting.

### Security

- Email credentials are stored in environment variables
- Input sanitization prevents XSS and injection attacks
- HTML tags are stripped from user input
- Email addresses are validated with regex
- Maximum field lengths are enforced
- Rate limiting prevents spam

### Testing Locally

1. Create a `.env` file with the required variables
2. Run the development server: `npm run dev`
3. The API endpoint will be available at: `http://localhost:5173/api/send-email`

Note: For local testing, you may need to use Vercel CLI (`vercel dev`) to properly simulate the serverless function environment.

---

## Image Upload Functions

Server-side image optimization and upload functions for the portfolio. Images are processed using Sharp, converted to WebP format, and stored in Supabase Storage.

### Environment Variables

```
# Supabase Configuration (server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:**
- The service role key has admin privileges - never expose it client-side
- Get from: Supabase Dashboard > Settings > API > service_role key

### Features

- ✅ Server-side image optimization with Sharp
- ✅ Automatic WebP conversion (quality: 30, effort: 6)
- ✅ Max width resize to 2000px (maintains aspect ratio)
- ✅ File type validation (JPEG, JPG, PNG only)
- ✅ File size limit (10MB max)
- ✅ Filename sanitization with UUID generation
- ✅ Rate limiting (20 uploads per hour per IP)
- ✅ Optional original file preservation
- ✅ Structured folder organization per page type

### Supabase Storage Buckets

Create two storage buckets in your Supabase project:

1. **portfolio-originals** (private) - Stores original uploaded files
2. **portfolio-optimized** (public) - Stores optimized WebP images

#### Folder Structure

```
portfolio-optimized/
├── about/
│   ├── profile/
│   ├── education/
│   └── experience/
├── achievements/
├── photoshoot/
└── artistic/
```

### API Endpoints

All endpoints accept `multipart/form-data` with a file field.

| Endpoint | Page Type | Description |
|----------|-----------|-------------|
| `POST /api/upload/about/profile` | About | Profile picture (single image) |
| `POST /api/upload/about/education` | About | Education images (multiple) |
| `POST /api/upload/about/experience` | About | Experience images (multiple) |
| `POST /api/upload/achievements` | Achievement | Achievement images (multiple) |
| `POST /api/upload/photoshoot` | Photoshoot | High-resolution photoshoot images |
| `POST /api/upload/artistic` | Artistic | Artistic portfolio images |

### Request Format

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (required) - The image file to upload
- `keepOriginal` (optional) - Set to `"true"` to preserve original file

**Example using curl:**
```bash
curl -X POST \
  -F "file=@/path/to/image.jpg" \
  -F "keepOriginal=true" \
  https://your-domain.com/api/upload/about/profile
```

**Example using JavaScript fetch:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('keepOriginal', 'true');

const response = await fetch('/api/upload/about/profile', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
```

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "optimizedUrl": "https://your-bucket.supabase.co/storage/v1/object/public/portfolio-optimized/about/profile/image_1234567890_abc123.webp",
    "originalUrl": "https://your-bucket.supabase.co/storage/v1/object/public/portfolio-originals/about/profile/image_1234567890_abc123.jpg",
    "filename": "image_1234567890_abc123.webp",
    "width": 1920,
    "height": 1080
  }
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": "Error type",
  "details": "Detailed error message"
}
```

### Image Processing Specifications

| Setting | Value |
|---------|-------|
| Output Format | WebP (lossy) |
| Quality | 30 |
| Compression Effort | 6 |
| Max Width | 2000px |
| Aspect Ratio | Preserved |

### Rate Limiting

- **Limit:** 20 uploads per hour per IP address
- **Response:** 429 Too Many Requests when limit is exceeded

### Security

- Supabase service role key stored in environment variables
- File type validation (MIME type + extension)
- File size validation (10MB max)
- Filename sanitization to prevent path traversal
- UUID-based unique filename generation
- Rate limiting prevents abuse

### Error Codes

| HTTP Status | Error | Description |
|-------------|-------|-------------|
| 400 | Validation failed | Invalid file type, size, or format |
| 400 | No file uploaded | Missing file in request |
| 405 | Method not allowed | Only POST requests are allowed |
| 429 | Too many requests | Rate limit exceeded |
| 500 | Internal server error | Server-side processing error |
