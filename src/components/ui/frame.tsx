import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Blob path keyframes for animation - these will be interpolated by Framer Motion
// Using JavaScript-based animation ensures cross-browser compatibility including mobile
const blobPaths = [
  "M0.81,0.56 C0.84,0.73 0.69,0.88 0.52,0.92 C0.35,0.96 0.17,0.85 0.09,0.68 C0.01,0.51 0.07,0.3 0.23,0.19 C0.39,0.08 0.61,0.11 0.72,0.26 C0.8,0.37 0.78,0.47 0.81,0.56 Z",
  "M0.88,0.56 C0.93,0.69 0.8,0.86 0.63,0.9 C0.46,0.94 0.25,0.88 0.16,0.74 C0.07,0.6 0.11,0.41 0.25,0.3 C0.39,0.19 0.61,0.21 0.73,0.33 C0.82,0.42 0.85,0.48 0.88,0.56 Z",
  "M0.84,0.62 C0.88,0.73 0.75,0.88 0.58,0.91 C0.41,0.94 0.24,0.86 0.15,0.72 C0.06,0.58 0.12,0.38 0.27,0.27 C0.42,0.16 0.62,0.2 0.73,0.33 C0.81,0.43 0.81,0.53 0.84,0.62 Z",
  "M0.8,0.66 C0.84,0.78 0.7,0.91 0.54,0.92 C0.38,0.93 0.21,0.84 0.13,0.7 C0.05,0.56 0.13,0.37 0.28,0.26 C0.43,0.15 0.62,0.2 0.71,0.33 C0.78,0.43 0.77,0.57 0.8,0.66 Z",
  "M0.81,0.56 C0.84,0.73 0.69,0.88 0.52,0.92 C0.35,0.96 0.17,0.85 0.09,0.68 C0.01,0.51 0.07,0.3 0.23,0.19 C0.39,0.08 0.61,0.11 0.72,0.26 C0.8,0.37 0.78,0.47 0.81,0.56 Z",
];

// Define the props for the component
interface AnimatedBlobImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** The source URL of the image. */
  src: string;
  /** The alternative text for the image, for accessibility. */
  alt: string;
  /** Optional class names for custom styling. */
  className?: string;
}

/**
 * A component that displays an image within a subtly animating blob shape.
 * Uses Framer Motion for path animation to ensure cross-browser compatibility,
 * including mobile browsers that don't support CSS `d` property animation.
 * 
 * Note: The initial `d` attribute on the path element is required for WebKit/Safari
 * tablet browsers to properly render the clip-path before animation begins.
 */
const AnimatedBlobImage = React.forwardRef<
  HTMLImageElement,
  AnimatedBlobImageProps
>(({ src, alt, className, ...props }, ref) => {
  // Generate unique ID for this instance to support multiple components
  const uniqueId = React.useId();
  const clipPathId = `blob-shape-${uniqueId}`;

  return (
    <div
      className={cn(
        "relative w-full max-w-sm aspect-square", // Responsive container with a square aspect ratio
        className
      )}
    >
      <img
        ref={ref}
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover" // Ensure image covers the container
        style={{
          // The clip-path creates the blob shape.
          // WebkitClipPath provides fallback for older WebKit browsers (tablets)
          WebkitClipPath: `url(#${clipPathId})`,
          clipPath: `url(#${clipPathId})`,
        }}
        {...props}
      />
      {/* Define the SVG clip-path with Framer Motion animated path */}
      {/* Using visibility:hidden instead of w-0 h-0 for better WebKit compatibility */}
      <svg 
        className="absolute" 
        style={{ width: 0, height: 0, visibility: 'hidden' }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            <motion.path
              // Initial d attribute is required for WebKit/Safari tablet browsers
              // Without it, the clip-path may not render until animation starts
              d={blobPaths[0]}
              animate={{
                d: blobPaths,
              }}
              transition={{
                d: {
                  duration: 15,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "loop",
                  times: [0, 0.25, 0.5, 0.75, 1],
                },
              }}
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
});

AnimatedBlobImage.displayName = "AnimatedBlobImage";

export { AnimatedBlobImage };
