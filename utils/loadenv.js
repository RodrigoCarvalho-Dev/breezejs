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
