import express from 'express';
import cacheManager from 'cache-manager';
import fsStore from 'cache-manager-fs-hash';
import { getValueFromAttributePath } from './utils/getValueFromAttributePath.mjs';

const app = express();
const port = 3000;

// Cache for requests
const requestCache = await cacheManager.caching(fsStore.create, {
    ttl: 60 * 60,
    path: './requestCache',
});

// Cache for URL content
const contentCache = await cacheManager.caching(fsStore.create, {
    ttl: 60 * 60,
    path: './contentCache',
});

app.get('/', async (req, res) => {
    const { url, searchQuery, filter } = req.query;

    if (!url || !searchQuery) {
        return res.status(400).json({ error: 'Both URL and searchQuery are required parameters' });
    }

    const cacheKey = `${url}_${searchQuery}_${JSON.stringify(filter)}`;
    const cachedResult = await requestCache.get(cacheKey);

    if (cachedResult) {
        return res.json(cachedResult);
    }

    try {
        let content = await contentCache.get(url);
        if (!content) {
            const response = await fetch(url);
            content = await response.text();
            await contentCache.set(url, content);
        }

        let _filter
        try {
            _filter = JSON.parse(filter)
        } catch(err) {
            _filter = filter
        }
        const searchResults = searchFunction(content, searchQuery, _filter);

        await requestCache.set(cacheKey, searchResults);

        res.json(searchResults);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function searchFunction(content, searchQuery, filter) {
    const jsonObject = JSON.parse(content)
    return getValueFromAttributePath(jsonObject, searchQuery, filter);
}


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
