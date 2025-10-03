import parseBody from "./body-parser-req.js";
import { IncomingMessage } from "http";


/**
 * 
 * @param {Request} req 
 * @param {IncomingMessage} url 
 * @returns {Promise<string>} 
 * 
 */

function enhanceRequest(req, url) {

  const parsed = url.parse(req.url || '', true); // aqui quebramos a url em partes
  req.query = parsed.query || {};
  req.path = parsed.pathname || '/';
  req.params = {};

  let bodyParsed = false;
  let _body;
  req.getBody = async () => {
    if (bodyParsed) return _body;
    _body = await parseBody(req); // aqui usamos nossa função que já faz automaticamente o reconhecimento do body
    bodyParsed = true;
    return _body;
  };

}

export default enhanceRequest ;
