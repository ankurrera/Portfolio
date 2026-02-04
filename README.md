## 🚀 Personal Portfolio & Content Management System
A modern, high-performance personal portfolio website designed to bridge the gap between Technical Engineering and Creative Arts. This project is not just a static showcase; it is a fully dynamic application powered by a custom Admin Dashboard, allowing for real-time content management of projects, photography, and professional achievements.

🌟 Key Features
1. Technical Portfolio (/technical)
A dedicated engineering section featuring a split-screen hero design with light/dark mode animations.

Project Showcase: Dynamic cards displaying GitHub repositories, live links, and tech stacks.
Skills & Experience: Interactive timeline and skill grids managed via the backend.
Minimalist Design: Clean typography and smooth scroll navigation (inspired by modern developer portfolios).

2. Creative Studio (/photoshoots & /artistic)
A visually immersive space for photography and art.

Masonry Galleries: Responsive image grids with "Selected," "Commissioned," and "Editorial" categories.

Artistic Section: A specialized gallery for sketches, paintings, and creative works.
Lightbox & Zoom: seamless image viewing experience with high-resolution support.

3. Achievements Hub (/achievement)
A centralized database for professional recognition.

Categorized Records: Filter achievements by College, Extracurricular, Internships, National, and Online Courses.
Credential Verification: Direct links to certificates and proof of work.

4. 🔐 The Command Center (Admin Dashboard)
A secure, role-based dashboard (/admin) that acts as a headless CMS for the entire site. No code edits are required to update the portfolio.

Content Management: Create, edit, and delete Technical Projects, Artistic Works, and Experience entries.
Media Manager: Drag-and-drop upload for Photoshoots and Hero images directly to Supabase Storage.
Live Updates: Changes made in the dashboard reflect immediately on the production site.
Security: Protected routes with Supabase Authentication and RLS (Row Level Security).

🛠️ Tech Stack
Frontend: React 18, TypeScript, Vite

Styling: Tailwind CSS, Shadcn UI, Framer Motion (Animations)
Backend & Auth: Supabase (PostgreSQL, Authentication, Storage)
State Management: TanStack Query (React Query)
Forms: React Hook Form + Zod Validation
