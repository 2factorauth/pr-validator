import SimilarWeb from './tests/SimilarWeb.js';
import Facebook from './tests/Facebook.js';
import Blocklist from './tests/Blocklist.js';
import logger from './logger';

export default async function(req, env) {
  const { pr, repo } = req.params;
  const repository = `${env.OWNER}/${repo}`;

  try {
    // Fetch all entries in the PR
    const entries = await fetchEntries(repository, pr);

    // Process each entry
    await Promise.all(
      entries.map(async (entry) => {
        await Promise.allSettled([
          // Validate primary domain
          validateDomain(entry.domain, env, entry.file),

          // Validate additional domains
          validateAdditionalDomains(entry['additional-domains'] || [], env, entry.file),

          // Validate Facebook handle if present
          validateFacebookHandle(entry.contact?.facebook, entry.file)
        ]);
      })
    );

    // Return a success response if no errors were thrown
    return new Response(logger.getMessages().join('\n'), {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      }
    });

  } catch (e) {
    // Handle unexpected errors
    return new Response(
      `::warning:: Internal error: ${e.message}`,
      {
        status: 500,
        headers: {
          'content-type': 'text/plain; charset=utf-8'
        }
      }
    );
  }
}

// Validate a primary or additional domain
async function validateDomain(domain, env, file) {
  return Promise.all([
    SimilarWeb(domain, env).
      catch((e) => logger.addError(file, e.message, e.title)),
    Blocklist(domain).catch((e) => logger.addError(file, e.message, e.title))
  ]);
}

// Validate all additional domains
async function validateAdditionalDomains(domains, env, file) {
  return Promise.all(domains.map(async domain => await Promise.all([
    SimilarWeb(domain, env).
      catch((e) => logger.addWarning(file, e.message, e.title)),
    Blocklist(domain).
      catch((e) => logger.addError(file, e.message, e.title))])));
}

// Validate a Facebook handle
async function validateFacebookHandle(facebookHandle, file) {
  if (!facebookHandle) return Promise.resolve(); // No handle, skip validation
  return Facebook(facebookHandle).
    catch((e) => logger.addError(file, e.message, e.title));
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
