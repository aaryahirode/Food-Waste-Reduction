import express from "express";
import ngrok from "ngrok";
import pg from "pg";
import multer from "multer";

import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.set('view engine', 'ejs0101[');
app.set('views', path.join(__dirname, 'views'));

const port = 3000;
const pool = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "fooddonationtest",
    password: "Venom1719",
    port: 5432,
});
const storage = multer.memoryStorage();
const upload = multer({ storage });


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

// Signup route
app.get("/signup",(req,res)=>{
    res.render("signup.ejs") 
})
app.post("/signup", async (req, res) => {
  let name = req.body.name;
  let email = req.body.email;
  let role = req.body.role;
  let password = req.body.password;
  const client = await pool.connect();
  try {
    let isRegistered = await client.query("SELECT email FROM user_info WHERE email=$1", [email]);
    if (isRegistered.rows.length == 0) {
      await client.query("INSERT INTO user_info (name,email,role,password) VALUES ($1, $2, $3, $4)", [name, email, role, password]);
      res.render("login.ejs",{
        
      });
    } else {
      res.render("login.ejs", {
        warned: "Account already exists. Please login.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong.");
  } finally {
    client.release(); // Release the connection back to the pool
  }
});

// Login route
app.get("/login",(req,res)=>{
    res.render("login.ejs")
})
app.post("/login", async (req, res) => {
  var email= req.body.email;
  var password = req.body.password;
  const client = await pool.connect();
  try {
    let result = await client.query("SELECT * FROM user_info WHERE email=$1", [email]);
    if (result.rows.length === 0) {
      res.render("login.ejs", { warned: "Email or password is incorrect." });
      return;
    }
    const user = result.rows[0];
    let isMatch = false;
    if (password == user.password) {
      isMatch = true;
    }
    if (isMatch) {
        if(user.role==="donor"){
            res.render("donor.ejs",{
                email:email
            });
        }else{
          res.render("recipient.ejs", {
            email:email
        });
        }
    } else {
      res.render("login.ejs", { warned: "Email or password is incorrect." });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Something went wrong! Please try again later.");
  } finally {
    client.release();
  }
});

//Donor route
app.get("/donor",(req,res)=>{
    res.render("donor.ejs");
  })
  app.get("/donor-recentdonations",(req,res)=>{
    res.render("donor-recentdonations.ejs");
  })
  app.get("/donorform",(req,res)=>{
    res.render("donorform.ejs");
  })
  app.post('/donate', upload.single('foodImage'), async (req, res) => {
    const foodName = req.body.foodName;
    const foodType = req.body.foodType;
    const category = req.body.category;
    const quantity = req.body.quantity;
    const expiryDate = req.body.expiryDate;
    const phone = req.body.phone;
    const email = req.body.email;
    const location = req.body.location;
    const city = req.body.city;
    const pincode = req.body.pincode;
    const description = req.body.foodDescription;
  
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Image is required' });
    }
    try {
        const imageBuffer = req.file.buffer; // Convert image to binary
        const result = await pool.query(
            'INSERT INTO donation_info (food_image, food_name, food_type, category, quantity, expiry_date, contact_number, email, donor_location, city, pincode, status, food_description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
            [imageBuffer, foodName, foodType, category, quantity, expiryDate, phone, email, location, city, pincode, "Pending", description]
        );
        // res.json({ success: true, message: 'Donation added successfully', donationId: result.rows[0].id });
        res.render("donor.ejs");
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error saving donation' });
    }
  });

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