const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
const BASE_URL = 'https://www.googleapis.com/books/v1';

// Define the structure of a book object as expected from the Google Books API response
export type Book = {
    id: string;
    title: string;
    authors: string[];
    description: string;
    categories: string[];
    thumbnail: string;
    pageCount: number;
    publisher: string;
    publishedDate: string;
    averageRating: number;
    ratingsCount: number;
    previewLink: string;
    infoLink: string;
    isPreviewable: boolean;
    isFullyAvailable: boolean;
};

// Define the available search filters for the Google Books API
export type SearchFilter = 'general' | 'intitle' | 'inauthor' | 'subject';

// Define the available preview filters for the Google Books API (only books with the specified preview availability will be returned)
export type PreviewFilter = 'all' | 'partial' | 'free-ebooks';

// Helper function to parse the raw API response into a Book object, providing default values for any missing fields to ensure consistent data structure
const parseBook = (item: any): Book => {
    const info = item.volumeInfo;
    const access = item.accessInfo;
    return {
        id: item.id,
        title: info.title || 'Unknown Title',
        authors: info.authors || ['Unknown Author'],
        description: info.description || 'No description available.',
        categories: info.categories || [],
        thumbnail: info.imageLinks?.thumbnail?.replace('http://', 'https://') || '', // Ensure thumbnail URL uses HTTPS for secure loading (some URLs from the API may use HTTP, which doesn't work well in React Native due to security restrictions)
        pageCount: info.pageCount || 0,
        publisher: info.publisher || '',
        publishedDate: info.publishedDate || '',
        averageRating: info.averageRating || 0,
        ratingsCount: info.ratingsCount || 0,
        previewLink: info.previewLink || '',
        infoLink: info.infoLink || '',
        isPreviewable:
            access?.viewability === 'PARTIAL' || access?.viewability === 'ALL_PAGES',
        isFullyAvailable: access?.viewability === 'ALL_PAGES',
    };
};

// Function to search for books based on a query string and optional filters for search type and preview availability
export const searchBooks = async (
    query: string,
    searchFilter: SearchFilter = 'general',
    previewFilter: PreviewFilter = 'all',
    startIndex: number = 0,
    maxResults: number = 20
): Promise<Book[]> => {
    if (!API_KEY) {
        throw new Error('Missing API key.');
    }

    // Sanitize user input by removing any quote characters they may have typed.
    // Users might paste "Harry Potter" or type "sci-fi" into the search box.
    // We strip these to prevent breaking the query syntax we construct below.
    const sanitized = query.trim().replace(/"/g, '');
    
    let formattedQuery: string;
    if (searchFilter === 'general') {
        // General search: just use the sanitized text as-is
        formattedQuery = sanitized;
    } else if (searchFilter === 'subject') {
        // Subject searches work best with exact phrases: subject:"science fiction" matches the category exactly.
        // Without quotes, subject:science fiction might match books with "science" OR "fiction" separately.
        // Quoting forces Google Books to find books tagged with the full phrase.
        formattedQuery = `${searchFilter}:"${sanitized}"`;
    } else {
        // Author/title searches use prefix syntax without quotes, e.g. inauthor:Tolkien or intitle:Dune
        formattedQuery = `${searchFilter}:${sanitized}`;
    }

    // Construct the full API URL with query parameters for search, pagination, and preview filtering
    let url = `${BASE_URL}/volumes?q=${encodeURIComponent(formattedQuery)}&startIndex=${startIndex}&maxResults=${maxResults}&printType=books&key=${API_KEY}`;

    if (previewFilter !== 'all') {
        url += `&filter=${previewFilter}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch books');
    const data = await response.json();
    if (!data.items) return [];
    // Return an array of Book objects that match the search criteria
    return data.items.map(parseBook);
};

// Function to fetch detailed information about a single book by its ID
export const getBookById = async (id: string): Promise<Book> => {
    if (!API_KEY) {
        throw new Error('Missing API key.');
    }

    const url = `${BASE_URL}/volumes/${id}?key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch book');
    return parseBook(await response.json());
};