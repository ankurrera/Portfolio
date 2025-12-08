import { type ImgHTMLAttributes } from "react";
import Zoom, { type UncontrolledProps } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { cn } from "@/lib/utils";

export interface ImageZoomProps extends ImgHTMLAttributes<HTMLImageElement> {
  zoomInProps?: ImgHTMLAttributes<HTMLImageElement>;
  zoomProps?: UncontrolledProps;
  className?: string;
}

export function ImageZoom({
  zoomInProps,
  zoomProps,
  className,
  children,
  ...props
}: ImageZoomProps) {
  return (
    <Zoom
      {...zoomProps}
      zoomImg={{
        src: props.src,
        className: cn(
          "cursor-zoom-out object-contain", 
          zoomInProps?.className
        ),
        ...zoomInProps,
      }}
    >
      {children ?? (
        <img
          className={cn(
            "cursor-zoom-in transition-all object-contain",
            className
          )}
          loading="lazy"
          {...props}
        />
      )}
    </Zoom>
  );
}
