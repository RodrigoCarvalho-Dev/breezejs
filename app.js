import * as http from "http"
import * as url from "url"
import createLayer from "./layer";
import enhanceResponse from "./response-app";
import enhanceRequest from "./request-app"
import handleError from "./utils/error";

// o app.js vai orquestrar tudo 

function breeze() {
  const layers = [];

  const app = {};

  app.use = (pathOrFn, maybeFn) => {
    if (typeof pathOrFn === 'string') {
      layers.push(createLayer('USE', pathOrFn, maybeFn));
    } else {
      layers.push(createLayer('USE', '*', pathOrFn));
    }
    return app;
  };

  ['get','post','put','delete','patch','all'].forEach(verb => {
    app[verb] = (path, handler) => {
      layers.push(createLayer(verb.toUpperCase(), path, handler));
      return app;
    };
  });

  app.listen = (port, cb) => {
    const server = http.createServer(async (req, res) => {
      try {
        enhanceRequest(req, url);
        enhanceResponse(res);

        let idx = 0;
        const next = async (err) => {
          if (err) return handleError(err, req, res);
          const layer = layers[idx++];
          if (!layer) {
            if (!res.writableEnded) {
              res.statusCode = 404;
              res.end('Not Found');
            }
            return;
          }
          if (layer.method !== 'USE' && layer.method !== 'ALL' && layer.method !== req.method) {
            return next();
          }
          const match = layer.regex.exec(req.path);
          if (!match) return next();

          layer.keys.forEach((key, i) => {
            req.params[key] = decodeURIComponent(match[i+1]);
          });

          try {
            const rv = layer.handler.length >= 3
              ? layer.handler(req, res, next)
              : layer.handler(req, res);
            if (rv && typeof rv.then === 'function') await rv;
            if (!res.writableEnded && layer.handler.length < 3) {
              return next();
            }
          } catch (err) {
            return handleError(err, req, res);
          }
        };

        await next();
      } catch (err) {
        handleError(err, req, res);
      }
    });

    server.listen(port, cb);
    return server;
  };

  return app;
}

export default breeze;
