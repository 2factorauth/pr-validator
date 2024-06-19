import logger from '../logger.js';

const test = 'SimilarWeb';

export default async function (domain, env, file) {
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
		if (!file) throw new Error('Unable to fetch website rank');
		else logger.addWarning(file, `Unable to fetch website rank for additional domain ${domain}`);
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
