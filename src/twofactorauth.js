import SimilarWeb from './tests/SimilarWeb.js';
import Facebook from './tests/Facebook.js';
import Blocklist from './tests/Blocklist.js';
import logger from './logger';

export default async function(req, env) {
	const { pr, repo } = req.params;
	const repository = `${env.OWNER}/${repo}`;

	// Fetch all entries modified in the PR
	const entries = await fetchEntries(repository, pr);

	for (const entry of entries) {
		try {
			SimilarWeb(entry.domain, env).
				catch(e => logger.addError(entry.file, e.message, e.title));

			Blocklist(entry.domain).
				catch(e => logger.addError(entry.file, e.message, e.title));

			// Validate any additional domains
			for (const domain of entry['additional-domains'] || []) {
				SimilarWeb(domain, env).
					catch(e => logger.addWarning(entry.file, e.message, e.title));

				Blocklist(domain).
					catch(e => logger.addError(entry.file, e.message, e.title));
			}

			// If present, validate Facebook handle
			if (entry.contact?.facebook)
				Facebook(entry.contact.facebook).
					catch(e => logger.addError(entry.file, e.message, e.title));

		} catch (e) {
			// Return an error response if validation fails
			return new Response(`::error file=${entry.file}:: Internal error: ${e.message}`,
				{ status: 500 });
		}
	}
	// Return a success response if no errors were thrown
	return new Response(logger.getMessages().join('\n'));
}

/**
 * Fetch modified files in /entries/**
 *
 * @param repo Repository (owner/repo)
 * @param pr Pull Request number
 * @returns {Promise<*[]>} Returns all modified entry files as an array.
 */
async function fetchEntries(repo, pr) {
	const data = await fetch(
		`https://api.github.com/repos/${repo}/pulls/${pr}/files`, {
			headers: {
				Accept: 'application/vnd.github.v3+json',
				'User-Agent': '2factorauth/twofactorauth (+https://2fa.directory/bots)'
			}
		});

	if (!data.ok) throw new Error(await data.text());

	const json = await data.json();
	let files = [];
	for (const i in json) {
		const file = json[i];

		// Ignore deleted files
		if (file.status === 'removed') continue;

		const path = file.filename;
		if (path.startsWith('entries/')) {
			// Parse entry file as JSON
			const f = await (await fetch(file.raw_url)).json();

			// Get first object of entry file (f)
			const data = f[Object.keys(f)[0]];

			// Append file path to object
			data.file = file.filename;

			files.push(data);
		}
	}

	return files;
}
