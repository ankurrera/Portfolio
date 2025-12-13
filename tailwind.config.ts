import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'playfair': ['"IBM Plex Mono"', 'Courier New', 'monospace'],
        'inter': ['"IBM Plex Mono"', 'Courier New', 'monospace'],
        'heading': 'var(--font-heading)',
        'body': 'var(--font-body)',
        'mono': 'var(--font-mono)',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          dark: "hsl(var(--surface-dark))",
          light: "hsl(var(--surface-light))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        gray: {
          50: "hsl(var(--gray-50))",
          100: "hsl(var(--gray-100))",
          200: "hsl(var(--gray-200))",
          300: "hsl(var(--gray-300))",
          400: "hsl(var(--gray-400))",
          500: "hsl(var(--gray-500))",
          600: "hsl(var(--gray-600))",
          800: "hsl(var(--gray-800))",
          900: "hsl(var(--gray-900))",
        },
        "folder-back": "hsl(var(--folder-back))",
        "folder-front": "hsl(var(--folder-front))",
        "folder-tab": "hsl(var(--folder-tab))",
      },
      boxShadow: {
        'subtle': 'var(--subtle-shadow)',
        'card': 'var(--card-shadow)',
        'hover': 'var(--hover-shadow)',
      },
      spacing: {
        'header': 'var(--header-height)',
        'section': 'var(--section-padding)',
      },
      maxWidth: {
        'content': 'var(--content-width)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "fade-out": {
          "0%": {
            opacity: "1",
            transform: "translateY(0)"
          },
          "100%": {
            opacity: "0",
            transform: "translateY(10px)"
          }
        },
        "scale-in": {
          "0%": {
            transform: "scale(0.95)",
            opacity: "0"
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1"
          }
        },
        "fadeIn": {
          from: { 
            opacity: "0", 
            transform: "translateY(20px)" 
          },
          to: { 
            opacity: "1", 
            transform: "translateY(0)" 
          }
        },
        "slideUp": {
          from: { 
            opacity: "0", 
            transform: "translateY(40px)" 
          },
          to: { 
            opacity: "1", 
            transform: "translateY(0)" 
          }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "fadeIn": "fadeIn 0.8s ease-out",
        "slideUp": "slideUp 0.6s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
