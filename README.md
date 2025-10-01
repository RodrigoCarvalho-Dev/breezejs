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

Depois vamos para o body-parser.js que vai fazer a transformação dos dados

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