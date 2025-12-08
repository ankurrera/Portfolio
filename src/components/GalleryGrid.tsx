import { ImageZoom } from "./ImageZoom";

interface GalleryImage {
  src: string;
  alt: string;
}

interface GalleryGridProps {
  images: GalleryImage[];
}

const GalleryGrid = ({ images }: GalleryGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-16 w-full px-8 py-20 animate-fade-in">
      {images.map((image, index) => (
        <div
          key={index}
          className="overflow-hidden flex justify-center"
        >
          <ImageZoom
            src={image.src}
            alt={image.alt}
            className="h-[400px] w-auto hover:scale-105 transition-transform duration-700"
          />
        </div>
      ))}
    </div>
  );
};

export default GalleryGrid;
