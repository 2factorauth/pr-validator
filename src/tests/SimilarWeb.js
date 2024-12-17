import logger from '../logger.js';

/**
 * Retrieve the Similarweb rank for a given domain
 * @param {string} domain The domain to check
 * @param {*} env The environment
 * @returns {Promise<string>} Returns SimilarWeb rank if found
 * @throws {Object<message, title>} Throws error object if fetching fails or rank exceeds limit
 */
export default async function(domain, env) {
  const API_KEY = getAPIKey();
  const res = await fetch(
    `https://api.similarweb.com/v1/similar-rank/${domain}/rank?api_key=${API_KEY}`,
    {
      cf: {
        cacheTtlByStatus: {
          '200-299': 14 * 24 * 60, // Cache 2 weeks
          '429': 0, // Force refresh
          '300-599': 60 // Cache 1 hour
        }
      }
    });

  switch (res.status) {
    case 403:
      throw {
        title: 'Manual review required',
        message: 'Monthly API limit reached.\nPlease wait for a maintainer to review your pull request.\nhttps://www.similarweb.com/website/${domain}'
      };
    case 404:
      throw {
        title: `${domain} is unranked`,
        message: `${domain} lacks a SimilarWeb rank.\nIf this domain is an additional domain, this warning can be ignored`
      };
    case 429:
      throw {
        title: 'Manual review required',
        message: `Rate limit exceeded for SimilarWeb API while fetching ${domain} rank.\nPlease wait for a maintainer to review your pull request.\nhttps://www.similarweb.com/website/${domain}`
      };
    case 200:
      break;
    default:
      throw {
        title: `Failed to review ${domain}`,
        message: `Unable to fetch the SimilarWeb global rank for ${domain}\nStatus: ${res.statusText} (${res.status})`
      };
  }

  const json = await res.json();

  // Soft fail on failure
  if (json.meta.status !== 'Success') throw {
    title: `Failed to review ${domain}`,
    message: 'Unable to parse message from SimilarWeb API\nPlease wait for a maintainer to review your pull request.\nhttps://www.similarweb.com/website/${domain}'
  };

  if (!Object.keys(json).includes('similar_rank')) {
    throw {
      title: `${domain} is unranked`,
      message: `${domain} lacks a SimilarWeb rank.\nIf this domain is an additional domain, this warning can be ignored`
    };
  }

  const { rank } = json.similar_rank;
  if (rank > env.SIMILARWEB_RANK_LIMIT) {
    throw {
      title: `${domain} exceeds SimilarWeb rank limit`,
      message: `Similarweb rank ${rank.toLocaleString()} exceeds the limit of ${env.SIMILARWEB_RANK_LIMIT.toLocaleString()}.`
    };
  }

  logger.addMessage('SimilarWeb', `${domain} ranked ${rank.toLocaleString()}.`);
  return rank.toLocaleString();
}

function getAPIKey() {
  const keys = env.SIMILARWEB_API_KEY.split(' ');
  return keys[Math.floor(Math.random() * keys.length)];
}
