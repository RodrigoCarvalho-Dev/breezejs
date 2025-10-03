

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
  