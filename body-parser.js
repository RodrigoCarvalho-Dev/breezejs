import querystring from 'querystring';

/**
 * 
 * @param {Object} req 
 * @returns {Promise<Object>}
 */

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const contentType = (req.headers['content-type'] || '').split(';')[0];
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      if (!body) return resolve(undefined);
      try {
        if (contentType === 'application/json') return resolve(JSON.parse(body));
        if (contentType === 'application/x-www-form-urlencoded') return resolve(querystring.parse(body));
        return resolve(body);
      } catch (err) {
        return reject(err);
      }
    });
    req.on('error', reject);
  });
}

export default parseBody;
