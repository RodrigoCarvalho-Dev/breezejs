

/**
 * 
 * @param {string} path 
 * @returns {Object}
 * 
 */

function pathToRegex(path) {

    const keys = [];

    const regexStr = String(path)
        .replace(/\//g, '\\/')
        .replace(/:(\w+)/g, (_ , key) => { keys.push(key); return "([\\/+])"}) 
        .replace(/\*/g, '.*');

    return { regex : new RegExp("^" + regexStr + "$"), keys};

}

console.log(pathToRegex("/users/:id"));
// resposta : { regex: /^\/users\/([\/+])$/, keys: [ 'id' ] }

export default pathToRegex;

