const API_KEY = process.env.EXPO_PUBLIC_PEXELS_API_KEY;
const BASE_URL = 'https://api.pexels.com/v1';

// Define the structure of an image object as expected from the Pexels API response
export type PexelsImage = {
    id: number;
    url: string;
    photographer: string;
    photographerUrl: string;
    avgColor: string;
    width: number;
    height: number;
    alt: string;
    src: {
        original: string;
        large: string;
        medium: string;
        small: string;
        portrait: string;
        landscape: string;
        tiny: string;
    };
};

// Define the structure of the response from the Pexels API when searching for images
export type PexelsResponse = {
    images: PexelsImage[];
    totalResults: number;
    nextPage: string | null;
    prevPage: string | null;
    page: number;
};

// Define types for image search filters (not yet implemented in the UI, but included here for possible future use)
export type ImageOrientation = 'landscape' | 'portrait' | 'square';
export type ImageSize = 'large' | 'medium' | 'small';
export type ImageColor =
    | 'red' | 'orange' | 'yellow' | 'green' | 'turquoise'
    | 'blue' | 'violet' | 'pink' | 'brown' | 'black' | 'gray' | 'white';


// Helper function to parse a raw photo object from the Pexels API into a PexelsImage type
const parsePhoto = (photo: any): PexelsImage => ({
    id: photo.id,
    url: photo.url,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    avgColor: photo.avg_color,
    width: photo.width,
    height: photo.height,
    alt: photo.alt || '',
    src: {
        original: photo.src.original,
        large: photo.src.large,
        medium: photo.src.medium,
        small: photo.src.small,
        portrait: photo.src.portrait,
        landscape: photo.src.landscape,
        tiny: photo.src.tiny,
    },
});

// Function to search for images on Pexels based on a query and optional filters, returning a structured response
export const searchImages = async (
    query: string,
    options: {
        page?: number;
        perPage?: number;
        orientation?: ImageOrientation;
        size?: ImageSize;
        color?: ImageColor | string;
    } = {}
): Promise<PexelsResponse> => {
    const {
        page = 1,
        perPage = 20,
        orientation,
        size,
        color,
    } = options;

    // Build the API URL with query parameters based on the provided options
    let url = `${BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
    if (orientation) url += `&orientation=${orientation}`;
    if (size) url += `&size=${size}`;
    if (color) url += `&color=${color}`;

    const response = await fetch(url, {
        headers: { Authorization: API_KEY! },
    });
    if (!response.ok) throw new Error('Failed to fetch images');
    const data = await response.json();

    return {
        images: data.photos.map(parsePhoto),
        totalResults: data.total_results,
        nextPage: data.next_page || null,
        prevPage: data.prev_page || null,
        page: data.page,
    };
};

// Function to fetch curated images from Pexels without a search query (to fill the mooodboard screen with inpiration before the user starts searching), returning a structured response
export const getCuratedImages = async (
    page: number = 1,
    perPage: number = 20
): Promise<PexelsResponse> => {
    const response = await fetch(
        `${BASE_URL}/curated?page=${page}&per_page=${perPage}`,
        { headers: { Authorization: API_KEY! } }
    );
    if (!response.ok) throw new Error('Failed to fetch curated images');
    const data = await response.json();

    return {
        images: data.photos.map(parsePhoto),
        totalResults: data.total_results,
        nextPage: data.next_page || null,
        prevPage: data.prev_page || null,
        page: data.page,
    };
};