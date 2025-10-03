import breeze from "../app.js";
import loadenv from "../utils/loadenv.js";

loadenv();

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