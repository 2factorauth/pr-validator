import logger from '../logger.js';

const test = 'Blocklist';
/**
 * List of URLs for different blocklist categories.
 */
const lists = {
  malware: 'https://blocklistproject.github.io/Lists/alt-version/malware-nl.txt',
  piracy: 'https://blocklistproject.github.io/Lists/alt-version/piracy-nl.txt',
  porn: 'https://blocklistproject.github.io/Lists/alt-version/porn-nl.txt'
};

/**
 * Checks if a given domain is present in any of the blocklists.
 *
 * @param {string} domain - The domain to check against the blocklists.
 * @returns {Promise<void>} Resolves if the domain is not found in any list, otherwise throws an error.
 * @throws Will throw an error if the domain is found in any blocklist, specifying the category.
 */
export default async function(domain) {
  await Promise.all(
    Object.entries(lists).map(async ([list, url]) => {
      const domainSet = await findDomain(domain, url);
      if (domainSet) {
        throw {
          title: `${domain} labeled as ${list} website`,
          message: `According to [The Block List Project](https://github.com/blocklistproject/Lists), the site ${domain} hosts content marked as ${list}.\\nSuch content is against our guidelines.`
        };
      }
    }));
  logger.addDebug(test, `${domain} not found in any list`);
}

/**
 * Fetches a blocklist from a given URL, parses it, searches for domain matches
 *
 * @param {string} domain - The Domain to find
 * @param {string} url - The URL of the blocklist to fetch
 * @returns {Promise<Awaited<boolean|undefined>[]>} Returns true if a match is found, otherwise null
 */
async function findDomain(domain, url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': '2factorauth/twofactorauth (+https://2fa.directory/bots)'
    },
    cf: {
      cacheEverything: true,
      cacheTtl: 7 * 24 * 60 // Cache 1 week
    }
  });

  let domains = (await res.text()).split('\n');
  let match = false;
  await Promise.all(domains.map(async (d) => {
    if (d === domain) {
      match = true;
      return true;
    }
  }));
  return match;
}
