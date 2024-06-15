import logger from '../logger.js';

const test = 'SimilarWeb';

export default async function(domain, env) {
	const res = await fetch(
		`https://api.similarweb.com/v1/similar-rank/${domain}/rank?api_key=${env.SIMILARWEB_API_KEY}`,
		{
			cf: {
				cacheTtlByStatus: {
					"200-299": 7 * 24 * 60, // Cache 7 days
					"300-599": 60 // Cache 1 hour
				}
			}
		});

 	if (res.status === 404) throw new Error(`${domain} doesn't have a Similarweb rank.`)
	if (!res.ok) throw new Error('Unable to fetch website rank');

	const json = await res.json();

	// Soft fail on failure
	// console.log(json.meta.status)
	if(json.meta.status !== 'Success') return 1;

	if (!Object.keys(json).includes('similar_rank'))
		throw new Error(`${domain} doesn't have a Similarweb rank.`);

	const { rank } = json.similar_rank;

	if (rank > env.SIMILARWEB_RANK_LIMIT)
		throw new Error(`${domain} Similarweb rank ${rank.toLocaleString()} exceeds the limit of ${env.SIMILARWEB_RANK_LIMIT.toLocaleString()}.`);

	logger.addMessage(test, `${domain} ranked ${rank.toLocaleString()}`);

	return 0;
}
