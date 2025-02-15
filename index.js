import express from "express"
import ngrok from "ngrok"
import pg from "pg"

const app = express()
const port = 3000;
const pool = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "fooddonationtest",
    password: "Venom1719",
    port: 5432,
  });

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);
    try {
      const url = await ngrok.connect(port);
      console.log(`Ngrok public URL: ${url}`);
    } catch (err) {
      console.error("Error starting ngrok:", err);
    }
});

//Homepage
app.get("/",(req,res)=>{
    res.render("homepage.ejs") 
})

//Contact Us
app.get("/contact",(req,res)=>{
    res.render("contact.ejs");
})
app.post("/contactus",async(req,res)=>{
    const name = req.body.name;
    const email = req.body.email;
    const message = req.body.message;
    const client = await pool.connect();
    try {
      await client.query("INSERT INTO contact_us_queries (name,email_id,message) VALUES ($1, $2, $3)", [name,email,message]);
    } catch (error) {
      console.error(error);
      res.status(500).send("Something went wrong.");
    } finally {
      client.release();
      res.render("contact.ejs",{
        submitted : "True",
      })
    }
  })