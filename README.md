# Breeze.js - Vamos criar nosso próprio **Express** ☕

o intuito dessa aplicação é mostrar como o **Node.js** consegue ser uma tecnologia versátil e que criar libs e frameworks pode ser "de certa forma" até simples

**Funcionalidades** que o framework vai ter
- app.use(middleware)
- app.METHOD(path, handler) para GET, POST, PUT, DELETE, PATCH, ALL
- suporte a parâmetros de rota (ex: /users/:id)
- parsing simples de JSON e urlencoded no body
- req.query, req.params, req.path
- res.status, res.set, res.send, res.json
- app.listen(port, cb)


### Path para Regex

Vamos começar pelo mais difícil o path-to-regex.js

```javascript

/**
 * 
 * @param {string} path 
 * @returns {Object}
 * 
 */

function pathToRegex(path) {
  const keys = [];
  const regexStr = path
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, (_, key) => { keys.push(key); return '([^\\/]+)'; })
    .replace(/\*/g, '.*');
  return { regex: new RegExp('^' + regexStr + '$'), keys };
}

console.log(pathToRegex("/users/:id"));
// resposta : { regex: /^\/users\/([\/+])$/, keys: [ 'id' ] }

export default pathToRegex;
```

basicamente vamos usar regex (Expressão regular) para definir padrões de textos, e com ela vamos validar nossos paths de nossa aplicação Breeze.js 😋

### Body parser

Depois vamos para o body-parser-req.js que vai fazer a transformação dos dados

```javascript

import querystring from 'querystring';

/**
 * 
 * @param {Object} req 
 * @returns {Promise<Object>}
 * 
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

```

Nele vamos conseguir validar 

### Requisições da nosso aplicação

no arquivo request-app.js vamos colocar esse código

```javascript

import parseBody from "./body-parser-req";

function enhanceRequest(req, url) { // aqui vamos passar
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

export default enhanceRequest;

```

### Respostas para nossa aplicação

```javascript



// código feito com funções anônimas;

// fica muito prático e fácil de entender;

// vou explicar o código de forma bem detalhada;

/**
 * @typedef {import("http").ServerResponse} ServerResponse // vamos importar o ServerResponse do http;
 * @typedef {ServerResponse & { 
*   status: (code: number) => ServerResponse,
*   set: (field: string, value: string) => ServerResponse,
*   send: (payload?: any) => void,
*   json: (obj: object) => ServerResponse
* }} EnhancedResponse // vamos criar um tipo de resposta que vai ser o EnhancedResponse;
*/

/**
* @param {ServerResponse} res
* @returns {EnhancedResponse}
*/

function enhanceResponse(res) {
    res.status = (code) => { res.statusCode = code; return res; }; // status da requisição

    res.set = (field, value) => { res.setHeader(field, value); return res; }; // modificar e colocar o header da requisição

    res.send = (payload) => {
      if (payload === undefined) return res.end();
      if (typeof payload === 'object' && !Buffer.isBuffer(payload)) {
        if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(JSON.stringify(payload));
      }
      return res.end(String(payload));
    }; //  enviar a resposta para o cliente 

    res.json = (obj) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(obj));
      return res;
    }; // enviar a resposta para o cliente em formato JSON
 
}

  
export default enhanceResponse;

```

Isso cuidará das respostas de nossa aplicação


### Criando um Layer

```javascript

import pathToRegex from "./utils/path-to-regex.js";


/**
 * 
 * @param {*} method 
 * @param {*} path 
 * @param {*} handler 
 * @returns 
 */

function createLayer(method, path, handler) {
  if (typeof path === 'function') {
    handler = path;
    path = '*';
  }
  const { regex, keys } = path === '*'
    ? { regex: /^.*$/, keys: [] }
    : pathToRegex(path);
  return { method, path, handler, regex, keys };
}

export default createLayer;


```

ele vai nós dizer se quais foram os parâmetros que a rota utilizou

### Vermos os erros da aplicação

```javascript

function handleError(err, req, res) {
    if (res.writableEnded) return;
    res.statusCode = err.statusCode || 500;
    const msg = process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : (err.message || String(err));
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(msg);
  }
  
  export default handleError;
  

```

### App

Fazermos toda a orquestração da aplicação em uma única função para exportação

```javascript

import * as http from "http"
import * as url from "url"
import createLayer from "./layer.js";
import enhanceResponse from "./response-app.js";
import enhanceRequest from "./request-app.js"
import handleError from "./utils/error.js";

// o app.js vai orquestrar tudo 

/**
 * @typedef {Object} RequestWithExtras
 * @property {string} path
 * @property {import("querystring").ParsedUrlQuery} query
 * @property {Record<string, string>} params
 * @property {() => Promise<any>} getBody
 */

/**
 * @typedef {Object} ResponseWithExtras
 * @property {(obj: any) => void} json
 * @property {(text: string) => void} send
 */

/**
 * @typedef {(req: import("http").IncomingMessage & RequestWithExtras, res: import("http").ServerResponse & ResponseWithExtras, next?: Function) => any|Promise<any>} Handler
 */

/**
 * @typedef {Object} BreezeApp
 * @property {(pathOrFn: string|Handler, maybeFn?: Handler) => BreezeApp} use
 * @property {(path: string, handler: Handler) => BreezeApp} get
 * @property {(path: string, handler: Handler) => BreezeApp} post
 * @property {(path: string, handler: Handler) => BreezeApp} put
 * @property {(path: string, handler: Handler) => BreezeApp} delete
 * @property {(path: string, handler: Handler) => BreezeApp} patch
 * @property {(path: string, handler: Handler) => BreezeApp} all
 * @property {(port: number, cb?: () => void) => http.Server} listen

/**
 * 
 * @returns {BreezeApp}
 * 
 */

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

```

```javascript

// no arquivo index.js

import breeze from "./app";
export default breeze;

```

---

## Finalmente vamos testar nossa aplicação

Aqui estarei fazendo uma chamada http para a api do gemini

```javascript

import breeze from "../app.js";


const app = breeze();

app.post("/", async ( req, res ) => {

    // carrege as váriaveis ambientes antes

    const { response } = await req.getBody();

    // gemini key 
    const API_KEY = String(process.env.GEMINI_API_KEY); // coloque sua chave da api gemini

    const response_api_gemini = await fetch(String(process.env.GEMINI_AI_URL), { // coloque sua url da api

        method : "POST",
        headers : {
            "Content-Type": "application/json",
            "x-goog-api-key": `${API_KEY}`
        },

        body: JSON.stringify({
            contents: [
                { parts: [{ text: response }] }
            ]
        })
    });


    const data = await response_api_gemini.json();

    console.log(data.candidates[0].content.parts[0].text);


    const reply = data.candidates[0].content.parts[0].text;

    if ( !reply ) {
        console.error("the reply is undefied")
    }

    console.log(reply);

    res.json({
        message : reply
    });

});

app.listen( 3000, () => {

    console.log("rodando na porta http://localhost:3000");

});

```

então me retornará

```json

// Requisição que nós estamos fazendo

{
	"response" : "olá"
}

// Resposta da api

{
	"message": "Olá! Como posso ajudar?"
}

```

## Conclusão

Então, afim de resolver o problema de criar um mini framework como o express, agora temos o breeze.js, o seu próprio framework para fins próprios

