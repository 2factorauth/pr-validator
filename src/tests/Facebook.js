export default async function Facebook(handle) {
	let res = await fetch(`https://www.facebook.com/${handle}`, {
		cf: {
			cacheTtl: 7 * 24 * 60, // Cache 7 days
			cacheEverything: true
		}
	});
	console.debug(`Facebook ${handle}: ${res.status}`)

	if (!res.ok) throw new Error(`Failed to fetch Facebook page ${handle}`);
	return true;
}
