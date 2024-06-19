import logger from '../logger.js';

const test = 'Blocklist';
/**
 * List of URLs for different blocklist categories.
 */
const lists = {
	malware: 'https://blocklistproject.github.io/Lists/alt-version/malware-nl.txt',
	piracy: 'https://blocklistproject.github.io/Lists/alt-version/piracy-nl.txt',
	porn: 'https://blocklistproject.github.io/Lists/alt-version/porn-nl.txt',
};
const cache = {}; // To cache the fetched lists

/**
 * Checks if a given domain is present in any of the blocklists.
 *
 * @param {string} domain - The domain to check against the blocklists.
 * @returns {Promise<void>} Resolves if the domain is not found in any list, otherwise throws an error.
 * @throws Will throw an error if the domain is found in any blocklist, specifying the category.
 */
export default async function (domain) {
	const listPromises = Object.entries(lists).map(async ([list, url]) => {
		const domainSet = await fetchAndCacheList(url);
		if (domainSet.has(domain)) {
			throw new Error(`${domain} is categorized as a ${list} website.`);
		}
	});

	await Promise.all(listPromises);
	logger.addMessage(test, `${domain} not found in any list`);
}

/**
 * Fetches a blocklist from a given URL, parses it, and caches the result.
 *
 * @param {string} url - The URL of the blocklist to fetch.
 * @returns {Promise<Set<string>>} A promise that resolves to a set of domains from the blocklist.
 */
async function fetchAndCacheList(url) {
	if (!cache[url]) {
		const res = await fetch(url, {
			headers: {
				'user-agent': '2factorauth/twofactorauth (+https://2fa.directory/bots)',
			},
			cf: {
				cacheEverything: true,
				cacheTtl: 24 * 60, // Cache 1 day
			},
		});
		const text = await res.text();
		const lines = text.split('\n');
		const domainSet = new Set();

		lines.forEach((line) => {
			const trimmedLine = line.trim();
			if (trimmedLine && !trimmedLine.startsWith('#')) {
				domainSet.add(trimmedLine);
			}
		});

		cache[url] = domainSet;
	}
	return cache[url];
}
