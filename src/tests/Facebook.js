export default async function Facebook(handle) {
  let res = await fetch(`https://www.facebook.com/${handle}`, {
    cf: {
      cacheTtl: 7 * 24 * 60, // Cache 7 days
      cacheEverything: true
    }
  });

  if (res.ok) return true;

  throw {
    title: 'Facebook handle not found',
    message: `Failed to find the Facebook page https://facebook.com/${handle}%0AThe page might be private or not exist.`
  };
}
