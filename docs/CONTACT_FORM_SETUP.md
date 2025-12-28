# Contact Form Email Feature - Complete Setup Guide

This guide explains how to configure and use the contact form email sending functionality on the Technical and About pages.

## 🚀 Features Implemented

- ✅ **Full-stack email implementation** using Nodemailer
- ✅ **Secure Gmail SMTP** integration
- ✅ **Two contact forms**: Technical page (with subject field) and About page
- ✅ **Complete validation**: Frontend (React Hook Form + Zod) and backend
- ✅ **Rate limiting**: Prevents spam (5 emails/hour per IP)
- ✅ **Professional email formatting**: HTML and plain text versions
- ✅ **Reply-To support**: Allows direct replies to senders
- ✅ **Loading states**: Visual feedback during submission
- ✅ **Error handling**: User-friendly error messages
- ✅ **Input sanitization**: Prevents XSS and injection attacks

## 📋 Prerequisites

1. A Gmail account (or Google Workspace account)
2. A Google App Password (NOT your regular Gmail password)
3. Access to Vercel environment variables (for deployment)

## 🔐 Setting Up Gmail App Password

### Step 1: Enable 2-Step Verification
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** in the left sidebar
3. Find **2-Step Verification** and enable it if not already enabled
4. Follow the prompts to set up 2-step verification

### Step 2: Generate App Password
1. Once 2-Step Verification is enabled, scroll down to **App passwords**
2. Click on **App passwords** (you may need to sign in again)
3. In the "Select app" dropdown, choose **Mail**
4. In the "Select device" dropdown, choose **Other (Custom name)**
5. Enter a name like "Portfolio Contact Form"
6. Click **Generate**
7. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)
   - **Important**: Save this password securely, you won't be able to see it again!

## ⚙️ Environment Configuration

### For Vercel Deployment (Production)

1. Go to your Vercel project dashboard: https://vercel.com/
2. Select your project
3. Navigate to **Settings** > **Environment Variables**
4. Add the following three variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `OFFICIAL_EMAIL` | `ankurrera@gmail.com` | Email where you receive contact form submissions |
| `GMAIL_USER` | `ankurr.tf@gmail.com` | Gmail account used to send emails |
| `GMAIL_PASSWORD` | `[your-app-password]` | 16-character Google App Password |

5. Click **Save** for each variable
6. Redeploy your application for changes to take effect

**Important Notes:**
- `OFFICIAL_EMAIL`: The destination email where all contact form submissions will be sent
- `GMAIL_USER`: The Gmail account used as the sender (can be different from OFFICIAL_EMAIL)
- `GMAIL_PASSWORD`: Use the App Password you generated, NOT your regular Gmail password

### For Local Development (Optional)

For local testing with actual email sending:

1. Create a `.env` file in the project root
2. Add the following content:

```env
# Email Configuration
OFFICIAL_EMAIL=ankurrera@gmail.com
GMAIL_USER=ankurr.tf@gmail.com
GMAIL_PASSWORD=your_16_character_app_password_here
```

3. Save the file (it's already in `.gitignore`, so it won't be committed)

**Note**: Local development with Vite won't run the serverless function. Use `vercel dev` for full local testing with the API.

## 📝 Form Specifications

### Technical Page Contact Form
**Location**: `/technical` page → Scroll to "Contact" section

**Fields:**
- **Name*** (required, max 100 chars)
- **Email*** (required, valid email format)
- **Subject** (optional, for specifying the topic)
- **Message*** (required, min 10 chars, max 1000 chars)

**Email Behavior:**
```
Subject: [Technical Page] {user's subject or "New Contact Form Submission"}
From: "Portfolio Contact" <ankurr.tf@gmail.com>
Reply-To: {user's email}
To: ankurrera@gmail.com
```

### About Page Contact Form
**Location**: `/about` page → Scroll to "Contact" section

**Fields:**
- **Name*** (required, max 100 chars)
- **Email*** (required, valid email format)
- **Message*** (required, min 10 chars, max 1000 chars)

**Email Behavior:**
```
Subject: [About Page] New Contact Form Submission
From: "Portfolio Contact" <ankurr.tf@gmail.com>
Reply-To: {user's email}
To: ankurrera@gmail.com
```

## 🔒 Security Features

### Frontend Validation
- **React Hook Form**: Controlled form state management
- **Zod Schema**: Type-safe validation with error messages
- **Real-time feedback**: Errors shown as user types
- **Email regex**: Validates proper email format
- **Length checks**: Enforces min/max character limits

### Backend Security
- **Server-side validation**: All inputs validated again on server
- **Input sanitization**: Strips HTML tags and dangerous characters
- **Email validation**: Regex pattern validation
- **Rate limiting**: Prevents spam and abuse
- **Environment variables**: Credentials never exposed to client
- **Error handling**: Doesn't leak sensitive information

### Rate Limiting
- **Limit**: 5 emails per hour per IP address
- **Tracking**: In-memory store (sufficient for serverless)
- **Response**: HTTP 429 (Too Many Requests) when exceeded
- **Auto-reset**: Counter resets after 1 hour

**Note**: For high-traffic production use, consider Redis-based rate limiting.

## 🧪 Testing the Implementation

### 1. Test Form Validation

**Empty Fields Test:**
1. Go to Technical or About page
2. Click "Send Message" without filling any fields
3. ✅ Should show validation errors for required fields

**Invalid Email Test:**
1. Enter name: "John Doe"
2. Enter email: "invalid-email"
3. Enter message: "Test message"
4. Click "Send"
5. ✅ Should show "Invalid email address" error

**Short Message Test:**
1. Fill all fields
2. Enter message: "Hi" (less than 10 chars)
3. Click "Send"
4. ✅ Should show "Message must be at least 10 characters long"

### 2. Test Successful Submission

1. Fill all required fields with valid data:
   - Name: "Test User"
   - Email: "test@example.com"
   - Subject: "Test Inquiry" (Technical page only)
   - Message: "This is a test message with more than 10 characters."

2. Click "Send Message" or "Send"

3. ✅ Expected behavior:
   - Loading spinner appears
   - Button shows "Sending..."
   - After ~2-3 seconds: Success toast notification
   - Message: "Thank you for reaching out. I'll get back to you soon."
   - Form resets to empty state

4. Check your `OFFICIAL_EMAIL` inbox
   - ✅ Should receive a professionally formatted HTML email
   - Subject should indicate source page
   - All user details should be present
   - Reply-To should be set to user's email

### 3. Test Rate Limiting

1. Send 5 emails quickly from the same page
2. Try to send a 6th email immediately
3. ✅ Should receive error:
   - Toast notification with error
   - Message: "Please wait before sending another message"
   - HTTP status: 429

4. Wait 1 hour and try again
5. ✅ Should work normally

### 4. Test Error Handling

**Invalid API Configuration (for testing only):**
1. Temporarily remove one environment variable in Vercel
2. Try sending an email
3. ✅ Should show user-friendly error:
   - "Failed to send email"
   - "An error occurred while processing your request"
4. ✅ Backend logs should show configuration error
5. Restore the environment variable

## 📧 Email Format Examples

### What Senders Experience

**Loading State:**
- Button shows spinner icon
- Text changes to "Sending..."
- Form fields disabled
- No multiple submissions possible

**Success State:**
- Green toast notification
- Message: "Message Sent! Thank you for reaching out."
- Form automatically clears
- Can send another message (within rate limit)

**Error State:**
- Red toast notification
- Message describes the issue
- Form data preserved
- User can correct and retry

### What You Receive (HTML Email)

```
──────────────────────────────────────────
New Contact Form Submission
──────────────────────────────────────────

Name: John Doe
Email: john@example.com
Source: Technical Page
Subject: Website Development Inquiry

──────────────────────────────────────────
Message:

Hi, I'm interested in discussing a potential 
collaboration for a new project. Could we 
schedule a call next week?

──────────────────────────────────────────
This message was sent from your portfolio 
contact form.
──────────────────────────────────────────
```

**Reply Feature**: 
- Click "Reply" in your email client
- Email will go directly to the sender's email address
- No need to copy-paste their email

## 🐛 Troubleshooting

### Issue: "Failed to send email" Error

**Possible Causes & Solutions:**

1. **Missing Environment Variables**
   - Check Vercel Dashboard → Settings → Environment Variables
   - Verify all three variables are set (OFFICIAL_EMAIL, GMAIL_USER, GMAIL_PASSWORD)
   - Redeploy after adding/updating variables

2. **Invalid Google App Password**
   - Password must be the 16-character App Password, not regular password
   - Regenerate a new App Password if needed
   - Make sure there are no extra spaces in the password

3. **2-Step Verification Not Enabled**
   - App Passwords only work with 2-Step Verification enabled
   - Go to Google Account → Security → Enable 2-Step Verification

4. **Gmail Security Blocking**
   - Check Gmail → Settings → Security
   - Look for any security alerts or blocked sign-in attempts
   - Allow less secure apps if needed (not recommended)

5. **SMTP Port Blocked**
   - Vercel should support port 465
   - Contact Vercel support if you suspect network issues

### Issue: "Rate limit exceeded"

**Solution:**
- Normal behavior after 5 emails/hour per IP
- Wait 60 minutes before trying again
- For testing, use different devices/IPs
- For production scaling, implement Redis-based rate limiting

### Issue: API Endpoint Not Found (404)

**Solutions:**

1. **Check Vercel Deployment**
   - Ensure `/api` directory is in project root
   - Verify `send-email.ts` file exists in `/api` folder
   - Check Vercel deployment logs for build errors

2. **Check vercel.json Configuration**
   - Ensure API rewrite rule exists:
   ```json
   {
     "source": "/api/(.*)",
     "destination": "/api/$1"
   }
   ```

3. **Redeploy**
   - Push latest changes to GitHub
   - Vercel should auto-deploy
   - Or manually redeploy from Vercel dashboard

### Issue: Emails Not Arriving

**Check:**

1. **Spam Folder**
   - Check spam/junk folder in your inbox
   - Mark as "Not Spam" if found there

2. **Gmail Filters**
   - Check if you have filters that might move/delete emails
   - Gmail Settings → Filters and Blocked Addresses

3. **Email Address Typo**
   - Verify OFFICIAL_EMAIL environment variable
   - No typos or extra spaces

4. **Gmail Account Status**
   - Ensure Gmail account is active
   - Check if account has any restrictions

## 📁 Project Structure

```
portfolio-main/
├── api/
│   ├── send-email.ts          # Serverless function for email sending
│   └── README.md              # API documentation
│
├── src/
│   ├── pages/
│   │   ├── About.tsx          # About page with contact form
│   │   └── Technical.tsx      # Technical page (imports MinimalContact)
│   │
│   └── components/
│       └── MinimalContact.tsx # Technical page contact form
│
├── docs/
│   └── CONTACT_FORM_SETUP.md  # This guide
│
├── .env.example               # Environment variable template
├── vercel.json                # Vercel config with API routing
└── package.json               # Dependencies (includes nodemailer)
```

## 🚀 Deployment Checklist

Before going live, verify:

- [ ] Environment variables set in Vercel
  - [ ] OFFICIAL_EMAIL configured
  - [ ] GMAIL_USER configured
  - [ ] GMAIL_PASSWORD (App Password) configured
- [ ] Google App Password generated and tested
- [ ] 2-Step Verification enabled on Gmail account
- [ ] Code pushed to GitHub
- [ ] Vercel auto-deployed successfully
- [ ] `/api/send-email` endpoint is accessible
- [ ] Test email from Technical page works
- [ ] Test email from About page works
- [ ] Emails received at OFFICIAL_EMAIL
- [ ] Reply-To functionality tested
- [ ] Rate limiting confirmed working
- [ ] Error handling tested
- [ ] Mobile responsive forms tested

## 💡 Future Enhancements (Optional)

Consider implementing these features for enhanced functionality:

- [ ] **Database Storage**: Store email submissions in Supabase
  - Track submission history
  - Export to CSV for analysis
  - View stats in admin dashboard

- [ ] **Admin Dashboard Integration**
  - View recent submissions
  - Mark as read/unread
  - Quick reply interface
  - Email statistics

- [ ] **Advanced Rate Limiting**
  - Redis-based distributed rate limiting
  - Per-user rate limits (for logged-in users)
  - CAPTCHA for suspicious activity

- [ ] **Email Templates**
  - Branded HTML templates
  - Customizable email designs
  - Dynamic content based on source page

- [ ] **Auto-responder**
  - Send confirmation email to user
  - "Thank you" message with expected response time
  - Include your contact information

- [ ] **reCAPTCHA v3**
  - Invisible bot protection
  - Score-based filtering
  - Reduce spam without user friction

- [ ] **Webhook Integration**
  - Slack notifications for new submissions
  - Discord bot integration
  - SMS alerts for urgent inquiries

- [ ] **Email Preferences**
  - Admin toggle to enable/disable forms
  - Change OFFICIAL_EMAIL from dashboard
  - Set custom auto-reply messages

## 📞 Support & Maintenance

### Monitoring Email Delivery

**Check Vercel Function Logs:**
1. Go to Vercel Dashboard
2. Select your project
3. Click on **Functions**
4. View logs for `/api/send-email`
5. Look for success/error messages

**Successful Log Example:**
```
Email sent successfully from technical page at 2024-01-15T10:30:00.000Z
```

**Error Log Example:**
```
Error sending email: Invalid credentials
```

### Updating Email Credentials

If you need to change credentials:

1. Generate new Google App Password (if needed)
2. Update Vercel environment variables
3. **Important**: Redeploy your application
   - Environment variable changes don't auto-deploy
   - Go to Deployments → Click ⋯ → Redeploy
4. Test the forms again

### Security Best Practices

- ✅ Never commit `.env` file to git
- ✅ Never share your Google App Password
- ✅ Rotate App Password every 6 months
- ✅ Monitor Vercel function logs regularly
- ✅ Keep dependencies updated (`npm audit`)
- ✅ Review rate limit logs for abuse patterns

### Performance Considerations

- Email sending typically takes 2-3 seconds
- Rate limiting prevents abuse
- Serverless function cold starts may add 1-2 seconds
- Consider using edge functions for faster response

---

## 🎉 Setup Complete!

Your contact forms are now fully functional with:
- ✅ Professional email delivery
- ✅ Security and validation
- ✅ Rate limiting protection
- ✅ Great user experience

Test the forms thoroughly and enjoy your new contact functionality!

**Questions or Issues?**
- Check Vercel function logs
- Review this guide
- Verify all environment variables
- Test with `vercel dev` locally

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Author**: Portfolio Email Feature Implementation
