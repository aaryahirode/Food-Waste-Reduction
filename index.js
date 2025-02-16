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

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const port = 3000;
const pool = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "food donation test",
    password: "PostgreSQL",
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
      res.render("login.ejs");
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
    let idResult = await client.query("SELECT id FROM user_info WHERE email=$1", [email]);
    let id = idResult.rows[0].id;
    if (isMatch) {
        if(user.role==="Donor"){
            res.render("donor.ejs",{
                id:id
            });
        }else{
          res.render("recipient.ejs", {
            id:id
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
    const id = req.query.id;
    res.render("donor.ejs",{
        id:id
    });
  })
  app.get("/donor-donations",async(req,res)=>{
    const id = req.query.id;
    const client = await pool.connect();
    const userResult = await client.query("SELECT * FROM user_info WHERE id=$1", [id]);
    const email = userResult.rows[0].email;
    console.log(email);
    const name = userResult.rows[0].name;
    console.log(name)
    const donationResult = await client.query("SELECT * FROM donation_info WHERE email=$1",[email]);
    client.release();
    res.render("donor-donations.ejs",{
        id:id,
        datas:donationResult.rows,
        name:name
    });
  })
  app.get("/donor-form",(req,res)=>{
    const id = req.query.id;
    res.render("donor-form.ejs",{
        id:id
    });
  })
app.get("/donor-profile",async(req,res)=>{
    const id = req.query.id;
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM user_info WHERE id=$1", [id]);
    client.release();
    const donorData = result.rows[0];
    res.render("donor-profile",{
        id:id,
        data:donorData
    });
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
    const id = req.query.id;
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
        res.render("donor.ejs",{
            id:id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error saving donation' });
    }
  });

//About Us
app.get("/about",(req,res)=>{
    res.render("about-us.ejs") 
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


  // Recipient
app.get("/recipient",(req,res)=>{
    res.render("recipient.ejs");
})
app.get("/recipient-request",(req,res)=>{
    res.render("recipient-request.ejs");
})
app.get("/recipient-form", async (req, res) => {
  try {
      const result = await pool.query("SELECT * FROM donation_info");
      res.render("recipient-form.ejs", {donations: result.rows});
  } catch (error) {
      console.error("Error fetching donations:", error);
      res.status(500).send("Internal Server Error");
  }
});