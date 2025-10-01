import parseBody from "./body-parser-req";

function enhanceRequest(req, url) {
  const parsed = url.parse(req.url || '', true);
  req.query = parsed.query || {};
  req.path = parsed.pathname || '/';
  req.params = {};

  let bodyParsed = false;
  let _body;
  req.getBody = async () => {
    if (bodyParsed) return _body;
    _body = await parseBody(req);
    bodyParsed = true;
    return _body;
  };
}

module.exports = enhanceRequest;
