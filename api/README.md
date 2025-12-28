# Email API Setup

This directory contains Vercel serverless functions for the portfolio application.

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
