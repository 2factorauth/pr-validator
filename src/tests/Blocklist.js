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

/**
 * Checks if a given domain is present in any of the blocklists.
 *
 * @param {string} domain - The domain to check against the blocklists.
 * @returns {Promise<void>} Resolves if the domain is not found in any list, otherwise throws an error.
 * @throws Will throw an error if the domain is found in any blocklist, specifying the category.
 */
export default async function (domain) {
  await Promise.all(
    Object.entries(lists).map(async ([list, url]) => {
      const isBlocked = await isDomainBlocked(domain, url);
      if (isBlocked) {
        throw {
          title: `${domain} labeled as ${list} website`,
          message: `According to [The Block List Project](https://github.com/blocklistproject/Lists), the site ${domain} hosts content marked as ${list}.\nSuch content is against our guidelines.`,
        };
      }
    })
  );
  logger.addDebug(test, `${domain} not found in any list`);
}

/**
 * Fetches a blocklist from a given URL, parses it into a Set, and checks if the domain exists.
 *
 * @param {string} domain - The Domain to find.
 * @param {string} url - The URL of the blocklist to fetch.
 * @returns {Promise<boolean>} Returns true if a match is found, otherwise false.
 */
async function isDomainBlocked (domain, url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': '2factorauth/twofactorauth (+https://2fa.directory/bots)',
    },
    cf: {
      cacheEverything: true,
      cacheTtl: 7 * 24 * 60, // Cache 1 week
    },
  });

  if (!res.ok) {
    logger.addDebug(test, `Unable to fetch blocklist ${url}. ${res.status}`);
    return false; // Assume no match if the blocklist can't be fetched
  }

  const blocklist = new Set((await res.text()).split('\n').map((d) => d.trim()));
  return blocklist.has(domain);
}
