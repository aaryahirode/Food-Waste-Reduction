import express from "express"
import ngrok from "ngrok"
import pg from "pg"
import multer from "multer"

const app = express()
const port = 3000;

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