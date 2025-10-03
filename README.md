# Breeze.js - Criando nosso próprio **Express** ☕

O Breeze.js é um projeto autoral desenvolvido em Node.js, com o objetivo de demonstrar como a tecnologia pode ser versátil, poderosa e acessível para criar bibliotecas e frameworks web.

A proposta é simples e ousada: mostrar, na prática, que compreender os fundamentos da plataforma permite construir ferramentas que vão além do “uso pronto” de frameworks — revelando como funcionam suas engrenagens internas e possibilitando autonomia no desenvolvimento.

<img width="250" height="250" alt="Breeze js" src="https://github.com/user-attachments/assets/b9090c15-16c3-4b93-9e49-2afa87eea534" />

## ✨ Por que o **Breeze.js** é relevante?

Ao longo do projeto, implementei recursos essenciais que frameworks como Express oferecem, mas a partir do zero. Isso me permitiu reforçar conceitos fundamentais como:

Criação e encadeamento de middlewares (app.use)

Definição de rotas com métodos HTTP (GET, POST, PUT, DELETE, PATCH, ALL)

Suporte a parâmetros dinâmicos (ex: /users/:id)

Parsing de JSON e urlencoded no corpo da requisição

Manipulação clara de req.query, req.params e req.path

Respostas aprimoradas com res.status, res.set, res.send e res.json

Orquestração leve e extensível de toda a aplicação via app.listen

Essas funcionalidades não apenas recriam a experiência do Express, mas revelam a engenharia por trás de sua simplicidade.

## 🧩 Estrutura e Engenharia

No Breeze.js, o destaque está na implementação de peças fundamentais:

Path-to-Regex: conversão de rotas em expressões regulares, para capturar parâmetros e validar URLs.

Body Parser: transformação de payloads da requisição (JSON e x-www-form-urlencoded) em objetos prontos para uso.

Enhance Request & Response: extensão das APIs nativas do Node.js para oferecer métodos modernos e amigáveis.

Camada de Layers: abstração de rotas e middlewares, controlando fluxo, erros e matching de paths.

Tratamento de Erros: respostas seguras e claras, tanto em ambientes de produção quanto de desenvolvimento.

Tudo isso orquestrado em um único núcleo (app.js), criando um framework funcional, modular e escalável.


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
import loadenv from "../utils/loadenv.js"

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
### bônus

Vamos criar também o loadenv para nossa aplicação carregar as variáveis ambientes

```javascript

import fs from "fs";
import path from "path";
/**
 * 
 * 
 * @returns {Promise<void>}
 */

async function loadenv() {

    const filePath = path.resolve(process.cwd(), ".env")

    const file = await fs.readFileSync(filePath, "utf-8");

    const formatFile = file.split("\n").map(line => {  
        line = line.replace("=", " ");  
        
        const [key, ...item] = line.split(" ");  
      
        return {
          key,
          item: item.join(" ")
        };
      });

    formatFile.map( object => {
        process.env[object.key] = object.item;
    });

    // console.log(process.env.GEMINI_API_KEY);

}

( async () => {

    // caso queira ver o resultado
    // await loadenv();

})();


export default loadenv;


```

## 🎯 O que esse projeto revela sobre meu perfil

Domínio de fundamentos: compreendo como funcionam servidores HTTP, roteamento e middlewares em baixo nível.

Capacidade de abstração: sei transformar conceitos complexos em APIs intuitivas e práticas.

Versatilidade: posso atuar tanto com frameworks prontos quanto criar soluções customizadas.

Mentalidade de construtor: não apenas uso ferramentas, mas tenho a capacidade de criá-las quando necessário.

Compromisso com clareza e escalabilidade: busco soluções que facilitem a vida de outros desenvolvedores.


## Conclusão
O Breeze.js não é apenas um mini-framework: ele é um exercício de engenharia de software que demonstra minha autonomia técnica, visão arquitetural e habilidade de transformar complexidade em simplicidade.

Se você é recrutador, esse projeto mostra que posso agregar valor ao seu time indo além do óbvio.
Se você é desenvolvedor, fica o convite para explorar o repositório, contribuir e aprender como frameworks como o Express realmente funcionam por baixo dos panos.

