var axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require( "node-cache" );
const ApiUtility = require('../../lib/api-utility');
const searchWebsites = require('../models/search_website');

const research = module.exports;

research.getSearchs = async function (req, res) {
    const { searchTerm, keywords, filter, page = 1, startDate, endDate } = req.query;

    const keywordsArray = (keywords).split(',').filter(Boolean) || [];
    const result = await getSearchResults(searchTerm, keywordsArray, filter,
        page, startDate, endDate);
    res.send(ApiUtility.success({ result, isCategoryWise: keywordsArray.length !== 0 }, "Researchs fetched sucssefully"))
}

const getSearchResults = async (
    searchTerm,
    keywords = [],
    filter = 'all',
    page = 1,
    startDate,
    endDate
) => {
    const apiKey = process.env.SEARCH_API_KEY;
    const cx = process.env.SEARCH_ENGINE_ID;
    const url = process.env.SEARCH_API_URL ? process.env.SEARCH_API_URL : "";

    if (!apiKey || !cx || !url) {
        throw new Error("Missing API configuration: ensure SEARCH_API_KEY, SEARCH_ENGINE_ID, and SEARCH_API_URL are set.");
    }

    if (keywords.length) {
        const searchPromises = keywords.map(async (keyword) => {
            const combinedSearch = `${searchTerm} ${keyword}`;
            const results = await fetchSearchResults(
                combinedSearch,
                apiKey,
                cx,
                url,
                filter,
                page,
                startDate,
                endDate
            );
            return { keyword, results };
        });

        const allSettled = (promises) => 
            Promise.all(promises.map(p => 
                p.then(value => ({ status: "fulfilled", value }))
                 .catch(reason => ({ status: "rejected", reason }))
            ));

        const results = await allSettled(searchPromises);

        return results.map((result, index) => {
            if (result.status === "fulfilled") {
                return result.value;
            } else {
                console.error(`Error processing keyword "${keywords[index]}":`, result.reason);
                return {
                    keyword: keywords[index],
                    results: [],
                    isCategoryWise: true
                };
            }
        });
    }

    return await fetchSearchResults(
        searchTerm,
        apiKey,
        cx,
        url,
        filter,
        page,
        startDate,
        endDate
    );
};

const fetchSearchResults = async (
    query,
    apiKey,
    cx,
    url,
    filter = 'all',
    page = 1,
    startDate,
    endDate
)=> {
    try {
        const startIndex = (page - 1) * 10 + 1;

        let queryWithFilter = query;

        if (filter === 'news') {
            const newsSites = await searchWebsites.find({}).lean().exec();
            const sitesQuery = newsSites.map(site => `site:${site.url}`).join(' OR '); 
            queryWithFilter = `${query} (${sitesQuery})`;
        }

        if (startDate) {
            const formattedStartDate = new Date(startDate)
                .toISOString()
                .split('T')[0];
            queryWithFilter += ` after:${formattedStartDate}`;
        }

        if (endDate) {
            const formattedEndDate = new Date(endDate)
                .toISOString()
                .split('T')[0];
            queryWithFilter += ` before:${formattedEndDate}`;
        }

        const params = {
            q: queryWithFilter,
            key: apiKey,
            cx,
            start: startIndex
        };
        const response = await axios.get(url, { params });

        return response.data.items.map((item) => ({
            title: item.title,
            url: item.link,
            description: item.snippet,
        })) || [];
    } catch (error) {
        console.error(`Error fetching search results for query "${query}":`, error);
        return [];
    }
};

research.getScrappedData = async function (req, res) {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
        throw(createHttpError('URLs array is required' ));
    }

    const results = await Promise.all(
        urls.map(async (url) => {
            try {
            const content = await scrapeUrl(url);
            return { url, content, success: true };
            } catch (error) {
            return { url, error: error.message, success: false };
            }
        })
    );

    res.send(ApiUtility.success(results, "Scrapped data fetched successfully"));
}

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600, useClones: false });

const axiosInstance = axios.create({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    },
    maxRedirects: 5,
});

const SELECTORS = {
    title: ['meta[property="og:title"]', 'title', 'h1', 'meta[name="title"]'],
    description: [
        'meta[property="og:description"]',
        'meta[name="description"]',
        '.description',
        'meta[property="twitter:description"]',
    ],
    datePublished: [
        'meta[property="article:published_time"]',
        'meta[name="date"]',
        'time',
        '[datetime]',
        '.date',
        'meta[name="publishedDate"]',
    ],
    author: [
        'meta[property="article:author"]',
        'meta[name="author"]',
        '[rel="author"]',
        '.author',
        '[class*="author"]',
        '.byline',
    ],
    content: [
        'article',
        'main',
        '.article-content',
        '.post-content',
        '#content',
        '.content',
        '.entry-content',
        '.post',
        'article[class*="content"]',
        'div[class*="article"]',
    ],
};

const findFirstMatch = ($, selectors, attr) => {
    return selectors
        .map((selector) => (attr ? $(selector).attr(attr) : $(selector).first().text().trim()))
        .find((value) => value) || '';
};

const extractContent = ($, selectors) => {
    for (const selector of selectors) {
        const $content = $(selector);
        if ($content.length) {
            return $content
                .find('p')
                .not('nav p, header p, footer p, .menu p')
                .map((_, element) => $(element).text().trim().replace(/\s+/g, ' '))
                .toArray()
                .filter((text) => text.length > 20 && !/^(copyright|all rights reserved)/i.test(text));
        }
    }
    return [];
};

const scrapeUrl = async (url) => {
    const cachedContent = cache.get(url);
    if (cachedContent) return cachedContent;

    try {
        const response = await axiosInstance.get(url);
        if (!response.data) throw new Error('Empty response data');

        const $ = cheerio.load(response.data);
        const result = {
            title: findFirstMatch($, SELECTORS.title),
            description: findFirstMatch($, SELECTORS.description),
            author: findFirstMatch($, SELECTORS.author),
            datePublished: findFirstMatch($, SELECTORS.datePublished),
            article: extractContent($, SELECTORS.content),
        };

        cache.set(url, result);
        return result;
    } catch (error) {
        console.error(`Scraping error for URL ${url}:`, error);
        return { title: '', description: '', article: [] };
    }
};


research.getSummarizedArticles = async (req, res) => {
    const { urls, searchQuery } = req.body;
    
    if (!urls || !searchQuery) {
        throw createHttpError({ error: 'urls and search query are required' });
    }

    const results = await Promise.all(
        urls.map(async (url) => {
            try {
                const content = await scrapeUrl(url);
                return {
                    url,
                    title: content.title || 'No Title',
                    scrapedContent: {
                        article: content.article || [],
                    },
                };
            } catch (error) {
                return { url, title: 'Error fetching content', scrapedContent: { article: [] }, error: error.message };
            }
        })
    );
    const summaries = await SummarizeArticles(results, searchQuery)

    res.send(ApiUtility.success({
        summaries,
        searchQuery
    }, 'Summarized articles fetched successfully'));
};


const SummarizeArticles = async (articles, searchQuery) => {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        const summaries = [];
        const maxOutputToken = articles.length * 5000;

        for (const article of articles) {
            const prompt = preparePrompt(article, searchQuery);

            const body = {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE",
                    },
                ],
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: maxOutputToken,
                    topP: 0.8,
                    topK: 40,
                },
            };

            try {
                const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, body, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const summary = response.data.candidates[0].content.parts[0].text || 'No summary generated';

                summaries.push({
                    title: article.title,
                    summary,
                    url: article.url,
                });
            } catch (error) {
                console.log(`Error summarizing article "${article.title}":`, error.response.data || error.message);
                summaries.push({
                    title: article.title,
                    summary: 'Error generating summary',
                    url: article.url,
                });
            }
        }

        return summaries;
    } catch (error) {
        console.log("An error occurred while summarizing articles:", error.message);
        throw error;
    }
};

function preparePrompt(article, searchQuery) {
    const articleText = article.scrapedContent.article.join(' ');

    return `
        You are a summarization expert. Your goal is to summarize the following article with the utmost detail while ensuring it is concise, accurate, and relevant to the given search query.

        Search Query: ${searchQuery}

        **Article Information:**
        - Title: ${article.title}
        - Content Length: Approximately ${articleText.length} characters
        - Content: ${articleText}

        Summary Requirements:
        1. Capture all key points from the article.
        2. Address the search query comprehensively.
        3. Avoid redundancy and repetition.
        4. Use bullet points or structured paragraphs to enhance readability.
        5. Provide sufficient detail to convey the main ideas clearly and accurately.
        6. Keep the tone professional and informative.
        7. Maintain **clarity and coherence** without redundancy or filler content.
        8. Add some bullet points if that makes content more meaningful.
        8. **Avoid markdown symbols** (such as ** or *) in the output.


        Please generate a detailed and well-structured summary of the article. Focus on providing actionable information that aligns with the search query.`;
}
