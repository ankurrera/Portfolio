import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { 
  EMAIL_REGEX, 
  VALIDATION_RULES, 
  sanitizeInput 
} from '../src/lib/validation/contactFormValidation';

// Rate limiting using in-memory store
// NOTE: In-memory rate limiting has limitations in serverless environments:
// - Does not persist across function cold starts
// - Does not work across multiple function instances
// - For production at scale, consider using Redis, Vercel KV, or similar persistent store
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;

// Check rate limit
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userRequests = requestLog.get(identifier) || [];
  
  // Filter out old requests outside the window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  // Add current request
  recentRequests.push(now);
  requestLog.set(identifier, recentRequests);
  
  return true;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message, source } = req.body;

    // Validate required fields
    if (!name || !email || !message || !source) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Name, email, message, and source are required' 
      });
    }

    // Validate source
    if (!['technical', 'about'].includes(source)) {
      return res.status(400).json({ 
        error: 'Invalid source',
        details: 'Source must be either "technical" or "about"' 
      });
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        details: 'Please provide a valid email address' 
      });
    }

    // Validate message length
    if (message.trim().length < VALIDATION_RULES.message.min) {
      return res.status(400).json({ 
        error: 'Message too short',
        details: `Message must be at least ${VALIDATION_RULES.message.min} characters long` 
      });
    }

    if (message.trim().length > VALIDATION_RULES.message.max) {
      return res.status(400).json({ 
        error: 'Message too long',
        details: `Message must be less than ${VALIDATION_RULES.message.max} characters` 
      });
    }

    // Rate limiting check
    const identifier = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(identifier)) {
      return res.status(429).json({ 
        error: 'Too many requests',
        details: 'Please wait before sending another message' 
      });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedSubject = subject ? sanitizeInput(subject) : '';
    const sanitizedMessage = sanitizeInput(message);

    // Get email credentials from environment variables
    const OFFICIAL_EMAIL = process.env.OFFICIAL_EMAIL;
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;

    if (!OFFICIAL_EMAIL || !GMAIL_USER || !GMAIL_PASSWORD) {
      console.error('Missing email configuration');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Email service is not properly configured' 
      });
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASSWORD,
      },
    });

    // Format subject based on source
    const sourceLabel = source === 'technical' ? 'Technical Page' : 'About Page';
    const emailSubject = sanitizedSubject 
      ? `[${sourceLabel}] ${sanitizedSubject}`
      : `[${sourceLabel}] New Contact Form Submission`;

    // Email options
    const mailOptions = {
      from: `"Portfolio Contact" <${GMAIL_USER}>`,
      to: OFFICIAL_EMAIL,
      replyTo: sanitizedEmail,
      subject: emailSubject,
      text: `
Name: ${sanitizedName}
Email: ${sanitizedEmail}
Source: ${sourceLabel}
${sanitizedSubject ? `Subject: ${sanitizedSubject}\n` : ''}
Message:
${sanitizedMessage}
      `.trim(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Name:</strong> ${sanitizedName}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${sanitizedEmail}">${sanitizedEmail}</a></p>
            <p style="margin: 10px 0;"><strong>Source:</strong> ${sourceLabel}</p>
            ${sanitizedSubject ? `<p style="margin: 10px 0;"><strong>Subject:</strong> ${sanitizedSubject}</p>` : ''}
          </div>
          <div style="background: #ffffff; padding: 20px; border-left: 4px solid #007bff;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${sanitizedMessage}</p>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>This message was sent from your portfolio contact form.</p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Log success (without sensitive data)
    console.log(`Email sent successfully from ${source} page at ${new Date().toISOString()}`);

    return res.status(200).json({ 
      success: true,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    // Log error without exposing sensitive information
    console.error('Error sending email:', error instanceof Error ? error.message : 'Unknown error');
    
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: 'An error occurred while processing your request. Please try again later.' 
    });
  }
}
