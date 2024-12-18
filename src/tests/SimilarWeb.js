import logger from '../logger.js';

/**
 * Retrieve the Similarweb rank for a given domain
 * @param {string} fqdn The domain to check
 * @param {*} env The environment
 * @returns {Promise<string>} Returns SimilarWeb rank if found
 * @throws {Object<message, title>} Throws error object if fetching fails or rank exceeds limit
 */
export default async function(fqdn, env) {
  const domain = getBaseDomain(fqdn);
  const apiKey = getAPIKey(env);
  const res = await fetch(
    `https://api.similarweb.com/v1/similar-rank/${domain}/rank?api_key=${apiKey}`,
    {
      cf: {
        cacheTtlByStatus: {
          '200-299': 14 * 24 * 60 * 60, // Cache 2 weeks
          '400-403': -1, // Force refresh
          '405-599': -1, // Force refresh
          '404': 14 * 24 * 60 * 60, // Cache 2 weeks
        }
      }
    });

  switch (res.status) {
    case 403:
      throw {
        title: 'Manual review required',
        message: 'Monthly API limit reached.%0APlease wait for a maintainer to review your pull request.%0Ahttps://www.similarweb.com/website/${domain}'
      };
    case 404:
      throw {
        title: `${domain} is unranked`,
        message: `${domain} lacks a SimilarWeb rank.%0AIf this domain is an additional domain, this warning can be ignored`
      };
    case 429:
      throw {
        title: 'Manual review required',
        message: `Rate limit exceeded for SimilarWeb API while fetching ${domain} rank.%0APlease wait for a maintainer to review your pull request.%0Ahttps://www.similarweb.com/website/${domain}`
      };
    case 200:
      break;
    default:
      throw {
        title: `Failed to review ${domain}`,
        message: `Unable to fetch the Similarweb global rank for ${domain}%0AStatus: ${res.statusText} (${res.status})`
      };
  }

  const json = await res.json();

  // Soft fail on failure
  if (json.meta.status !== 'Success') throw {
    title: `Failed to review ${domain}`,
    message: 'Unable to parse message from Similarweb API%0APlease wait for a maintainer to review your pull request.%0Ahttps://www.similarweb.com/website/${domain}'
  };

  if (!Object.keys(json).includes('similar_rank')) {
    throw {
      title: `${domain} is unranked`,
      message: `${domain} lacks a Similarweb rank.%0AIf this domain is an additional domain, this warning can be ignored`
    };
  }

  const { rank } = json.similar_rank;
  if (rank > env.SIMILARWEB_RANK_LIMIT) {
    throw {
      title: `${domain} exceeds Similarweb rank limit`,
      message: `Similarweb rank ${rank.toLocaleString()} exceeds the limit of ${env.SIMILARWEB_RANK_LIMIT.toLocaleString()}.`
    };
  }

  logger.addDebug('Similarweb', `${domain} ranked ${rank.toLocaleString()}.`);
  return rank.toLocaleString();
}

function getAPIKey(env) {
  const keys = env.SIMILARWEB_API_KEY.split(' ');
  return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * Return the base domain of a domain with possible subdomains
 * @param {string} hostname The domain to parse
 * @returns {string} The base domain
 */
function getBaseDomain(hostname) {
  let parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  parts = parts.slice(-3);
  if (['co', 'com'].includes(parts[1])) return parts.join('.');
  return parts.slice(-2).join('.');
}
