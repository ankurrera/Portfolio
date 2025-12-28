# Email Feature - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Get Google App Password (2 minutes)
1. Visit: https://myaccount.google.com/apppasswords
2. Sign in to your Google account
3. Create new app password named "Portfolio Email"
4. Copy the 16-character password (example: `abcd efgh ijkl mnop`)

### Step 2: Configure Vercel (2 minutes)
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add three variables:

```
OFFICIAL_EMAIL = ankurrera@gmail.com
GMAIL_USER = ankurr.tf@gmail.com
GMAIL_PASSWORD = [paste your 16-char password here]
```

5. Click "Save" for each
6. Go to Deployments → Latest → ⋯ → Redeploy

### Step 3: Test (1 minute)
1. Visit your deployed site
2. Navigate to `/technical` page
3. Scroll to Contact section
4. Fill out the form:
   - Name: Test User
   - Email: your-email@example.com
   - Subject: Test
   - Message: This is a test message
5. Click "Send Message"
6. Look for success notification
7. Check `ankurrera@gmail.com` inbox

✅ **Done!** If you received the email, everything is working.

## 📍 Where Are The Forms?

### Technical Page Form
- **URL**: `yoursite.com/technical`
- **Section**: Scroll down to "Let's Work Together"
- **Fields**: Name, Email, Subject, Message
- **Email Subject**: `[Technical Page] {Your Subject}`

### About Page Form  
- **URL**: `yoursite.com/about`
- **Section**: Scroll to bottom "Contact" section
- **Fields**: Name, Email, Message
- **Email Subject**: `[About Page] New Contact Form Submission`

## ⚠️ Troubleshooting

### "Failed to send email" error
**Fix**: Check Vercel environment variables are set correctly and redeploy.

### "Rate limit exceeded" error
**Normal**: You can only send 5 emails per hour from the same IP address. Wait 60 minutes.

### Email not arriving
**Check**: Spam folder in `ankurrera@gmail.com`

### "Method not allowed" error
**Fix**: Redeploy the application. The API endpoint may not be properly configured.

## 📧 What You'll Receive

Each submission sends a professionally formatted HTML email to `ankurrera@gmail.com`:

```
Subject: [Technical Page] Website Development Inquiry

─────────────────────────────────────────
New Contact Form Submission
─────────────────────────────────────────

Name: John Doe
Email: john@example.com  [click to email]
Source: Technical Page
Subject: Website Development Inquiry

Message:
Hi, I'd like to discuss a potential project...

─────────────────────────────────────────
This message was sent from your portfolio 
contact form.
─────────────────────────────────────────
```

**To Reply**: Just click "Reply" in your email client - it will automatically go to the sender's email address.

## 🔐 Security Features

✅ Input sanitization (prevents XSS attacks)
✅ Email validation (frontend + backend)
✅ Rate limiting (prevents spam)
✅ Secure credentials (environment variables)
✅ 0 security vulnerabilities (CodeQL verified)

## 📖 Need More Help?

For detailed documentation, see:
- **Complete Guide**: `/docs/CONTACT_FORM_SETUP.md`
- **API Details**: `/api/README.md`
- **Summary**: `/IMPLEMENTATION_SUMMARY.md`

## 🎯 Testing Checklist

After setup, verify:
- [ ] Can submit form on Technical page
- [ ] Can submit form on About page
- [ ] Receive email at ankurrera@gmail.com
- [ ] Email subject shows correct page source
- [ ] Reply-To works (test by replying)
- [ ] Validation shows errors for invalid input
- [ ] Success message appears after sending
- [ ] Form resets after successful submission

---

**Questions?** Check the comprehensive setup guide in `/docs/CONTACT_FORM_SETUP.md`

**Ready to Deploy?** Just configure the environment variables and you're good to go! 🚀
