import logger from '../logger.js';

const test = 'Similarweb';

/**
 * Retrieve the Similarweb rank for a given domain
 * @param {string} entryDomain The domain to check
 * @param {*} env The environment
 * @param {string} [file] The filename of the entry, should only be set for non-primary domains
 * @returns {Promise<number>} Returns `0` if it's a success, `1` otherwise
 */
export default async function (entryDomain, env, file) {
	const domain = getBaseDomain(entryDomain);
	const res = await fetch(`https://api.similarweb.com/v1/similar-rank/${domain}/rank?api_key=${env.SIMILARWEB_API_KEY}`, {
		cf: {
			cacheTtlByStatus: {
				'200-299': 7 * 24 * 60, // Cache 7 days
				'300-599': 60, // Cache 1 hour
			},
		},
	});

	if (res.status === 404) {
		if (!file) throw new Error(`${domain} doesn't have a Similarweb rank.`);
		else logger.addWarning(file, `Additional domain ${domain} doesn't have a Similarweb rank.`);
	}

	if (!res.ok) {
		const errorDetails = `HTTP error ${res.status}\nError message: ${await res.text()}`;
		if (!file) throw new Error(`Unable to fetch website rank — ${errorDetails}`);
		else logger.addWarning(file, `Unable to fetch website rank for additional domain ${domain} — ${errorDetails}`);

		return 1;
	}

	const json = await res.json();

	// Soft fail on failure
	if (json.meta.status !== 'Success') return 1;

	if (!Object.keys(json).includes('similar_rank')) {
		if (!file) throw new Error(`${domain} doesn't have a Similarweb rank.`);
		else logger.addWarning(file, `Additional domain ${domain} doesn't have a Similarweb rank.`);
	}

	const { rank } = json.similar_rank;
	if (rank > env.SIMILARWEB_RANK_LIMIT) {
		if (!file)
			throw new Error(
				`${domain} Similarweb rank ${rank.toLocaleString()} exceeds the limit of ${env.SIMILARWEB_RANK_LIMIT.toLocaleString()}.`,
			);
		else
			logger.addWarning(
				file,
				`Additional domain ${domain} Similarweb rank ${rank.toLocaleString()} exceeds the limit of ${env.SIMILARWEB_RANK_LIMIT.toLocaleString()}.`,
			);
	}

	logger.addMessage(test, `${domain} ranked ${rank.toLocaleString()}`);

	return 0;
}

/**
 * Return the base domain of a domain with possible subdomains
 * @param {string} domain The domain to parse
 * @returns {string} The base domain
 */
function getBaseDomain(hostname) {
	let parts = hostname.split('.');
	if (parts.length <= 2) return hostname;

	parts = parts.slice(-3);
	if (['co', 'com'].includes(parts[1])) return parts.join('.');

	return parts.slice(-2).join('.');
}
