import breeze from "../app.js";


const app = breeze();

app.post("/", async ( req, res ) => {

    // carrege as váriaveis ambientes antes

    const { response } = await req.getBody();

    // gemini key 
    const API_KEY = String("AIzaSyBJ5KPMSJicP3ZkRGDLL5xXMC713MptVdk"); // coloque sua chave da api gemini

    const response_api_gemini = await fetch(String("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"), { // coloque sua url da api

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