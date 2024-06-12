import logger from '../logger.js';

export default async function Facebook(handle) {
	let res = await fetch(`https://www.facebook.com/${handle}`, {
		cf: {
			cacheTtl: 7 * 24 * 60, // Cache 7 days
			cacheEverything: true
		}
	});

	if (!res.ok) throw new Error(`Failed to fetch Facebook page ${handle}`);
	logger.addMessage('Facebook', `${handle} found.`)
	return true;
}
