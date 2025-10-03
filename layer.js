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
