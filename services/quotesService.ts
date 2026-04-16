const API_KEY = process.env.EXPO_PUBLIC_API_NINJAS_KEY;
const BASE_URL = "https://api.api-ninjas.com/v2/quotes";

// Define the available quote categories as a constant array (based on what is available from the API)
export const quoteCategories = [
    "wisdom",
    "philosophy",
    "life",
    "truth",
    "inspirational",
    "relationships",
    "love",
    "faith",
    "humor",
    "success",
    "courage",
    "happiness",
    "art",
    "writing",
    "fear",
    "nature",
    "time",
    "freedom",
    "death",
    "leadership",
] as const;

// Define the QuoteCategory type as a union of the values in the quoteCategories array (aka a category can only be one of the predefined strings in the quoteCategories array)
export type QuoteCategory = typeof quoteCategories[number];

// Define the structure of a quote object as expected from the API response
export type Quote = {
    quote: string;
    author: string;
    work: string;
    categories: string[];
};

// Define the parameters that can be used to search for quotes
export type QuoteSearchParams = {
    categories?: QuoteCategory[];
    excludeCategories?: QuoteCategory[];
    author?: string;
    work?: string; // Work search not yet implemented in the UI, but supported by the API so can be used in the future if desired
};

// Helper function to build the query string for the API request based on the provided search parameters
const buildQueryString = (params: QuoteSearchParams) => {
    const query = new URLSearchParams();

    if (params.categories && params.categories.length > 0) {
        query.set("categories", params.categories.join(","));
    }

    if (params.excludeCategories && params.excludeCategories.length > 0) {
        query.set("exclude_categories", params.excludeCategories.join(","));
    }

    if (params.author && params.author.trim()) {
        query.set("author", params.author.trim());
    }

    if (params.work && params.work.trim()) {
        query.set("work", params.work.trim());
    }

    const queryString = query.toString();
    return queryString ? `?${queryString}` : "";
};

// Function to make the API request to fetch quotes based on the provided search parameters
const requestQuotes = async (params: QuoteSearchParams = {}): Promise<Quote[]> => {
    if (!API_KEY) {
        throw new Error("Missing API key.");
    }

    const response = await fetch(`${BASE_URL}${buildQueryString(params)}`, {
        headers: {
            "X-Api-Key": API_KEY,
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching quote: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<Quote[]>;
};

// Public function to fetch a single quote based on the provided search parameters
export const fetchSingleQuote = async (params: QuoteSearchParams = {}) => {
    const results = await requestQuotes(params);
    return results[0] ?? null;
};

