// Pexels API Service
const PEXELS_API_KEY = 'mLmLepwe813Hq6XaUbSP52rzAXKrnOWghYojNQz7oVuclLnznDewdL1P';
const PEXELS_API_BASE = 'https://api.pexels.com/v1';

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsResponse {
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  total_results: number;
  next_page?: string;
  prev_page?: string;
}

// Category-specific search queries for fashion photography
export const categoryQueries: Record<string, string> = {
  'SELECTED': 'luxury fashion campaign editorial',
  'COMMISSIONED': 'fashion brand campaign product',
  'EDITORIAL': 'fashion editorial minimalist vogue',
  'PERSONAL': 'black and white portrait artistic'
};

export const fetchPexelsPhotos = async (
  category: string,
  page: number = 1,
  perPage: number = 15
): Promise<PexelsResponse> => {
  const query = categoryQueries[category] || categoryQueries['ALL'];

  const response = await fetch(
    `${PEXELS_API_BASE}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`,
    {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.statusText}`);
  }

  return response.json();
};

// Pexels Video API types
export interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number | null;
  height: number | null;
  fps: number;
  link: string;
}

export interface PexelsVideoPicture {
  id: number;
  picture: string;
  nr: number;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: PexelsVideoFile[];
  video_pictures: PexelsVideoPicture[];
}

export interface PexelsVideosResponse {
  page: number;
  per_page: number;
  videos: PexelsVideo[];
  total_results: number;
  url: string;
  next_page?: string;
  prev_page?: string;
}

export const fetchPexelsVideos = async (
  category: string,
  page: number = 1,
  perPage: number = 5
): Promise<PexelsVideosResponse> => {
  const query = categoryQueries[category] || categoryQueries['ALL'];

  const response = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`,
    {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Pexels Videos API error: ${response.statusText}`);
  }

  return response.json();
};

export const fetchMixedMedia = async (
  category: string,
  page: number = 1,
  totalItems: number = 20
) => {
  // Fetch ~80% photos, ~20% videos
  const photoCount = Math.floor(totalItems * 0.8);
  const videoCount = Math.floor(totalItems * 0.2);

  const [photosData, videosData] = await Promise.all([
    fetchPexelsPhotos(category, page, photoCount),
    fetchPexelsVideos(category, page, videoCount),
  ]);

  // Transform photos
  const photos = photosData.photos.map((photo: PexelsPhoto) => ({
    ...transformPexelsToGalleryImage(photo),
    type: 'image' as const,
  }));

  // Transform videos
  const videos = videosData.videos.map((video: PexelsVideo) => ({
    type: 'video' as const,
    src: video.image, // Thumbnail for gallery
    videoSrc: video.video_files.find(f => f.quality === 'hd')?.link || video.video_files[0].link,
    highResSrc: video.image, // Use same thumbnail for lightbox
    alt: `Video by ${video.user.name}`,
    photographer: video.user.name,
    client: 'Pexels',
    location: '',
    details: `Video by ${video.user.name} on Pexels`,
    category: 'PEXELS',
    width: video.width,
    height: video.height,
  }));

  // Interleave videos throughout photos (every 4-5 items)
  const mixed: any[] = [];
  let videoIndex = 0;

  photos.forEach((photo, idx) => {
    mixed.push(photo);
    // Insert video every 4 items if we have videos left
    if ((idx + 1) % 4 === 0 && videoIndex < videos.length) {
      mixed.push(videos[videoIndex]);
      videoIndex++;
    }
  });

  // Add any remaining videos at the end
  while (videoIndex < videos.length) {
    mixed.push(videos[videoIndex]);
    videoIndex++;
  }

  return {
    items: mixed,
    total_results: photosData.total_results + videosData.total_results,
  };
};

export const transformPexelsToGalleryImage = (photo: PexelsPhoto) => {
  return {
    src: photo.src.large, // Gallery thumbnail (~940px) - fast loading
    highResSrc: photo.src.large2x, // Lightbox display (~1880px) - 2x retina resolution
    alt: photo.alt || 'Fashion photography',
    photographer: photo.photographer,
    client: 'Pexels',
    location: '',
    details: `Photo by ${photo.photographer} on Pexels`,
    category: 'PEXELS',
    width: photo.width, // Intrinsic width for aspect ratio
    height: photo.height // Intrinsic height for aspect ratio
  };
};
