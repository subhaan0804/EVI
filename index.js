const userRegistration = require("./mongoDB");
const express = require("express");
const ejs = require("ejs");
const multer = require('multer');
const pdf = require('pdf-parse');
const tesseract = require('tesseract.js');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const session = require("express-session");

// Function to convert PDF to text
async function convertPdfToText(filePath) {
  try {
    const dataBuffer = await fs.promises.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error converting PDF to text:', error);
    throw new Error('Failed to convert PDF to text');
  }
}

// Function to convert image to text using tesseract.js
async function convertImageToText(filePath) {
  try {
    const { data: { text } } = await tesseract.recognize(filePath, 'eng');
    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
}



// Add this new function for name verification
async function verifyNameInText(name, text) {
  if (!name || !text) return false;
  
  // Convert both name and text to lowercase for case-insensitive matching
  const lowercaseName = name.toLowerCase();
  const lowercaseText = text.toLowerCase();
  
  // Split the name into parts (first name, last name, etc.)
  const nameParts = lowercaseName.split(' ');
  
  // Check if any part of the name is in the text
  return nameParts.some(part => lowercaseText.includes(part));
}



// Function to verify text content 
function verifyTextContent(text) {
  return true; // Placeholder implementation
}

const app = express();
const port = 3000;

// Set up session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using https
}));

// getting data from html file
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.use(express.static("public"));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));


// Serve html2pdf.js from node_modules
app.use('/js', express.static(path.join(__dirname, 'node_modules', 'html2pdf.js', 'dist')));

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};


  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(__dirname, 'uploads');
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {

  // Access user data from session
  const user = req.session.user;
    
  // Safely access username and dob
  const username = user && user.name ? user.name : 'unknown';
  let dob = 'nodob';
  
  if (user && user.dob) {
    // Ensure dob is a string before using replace
    dob = String(user.dob).replace(/-/g, '');
  }
  
  const docname = file.fieldname;
  const ext = path.extname(file.originalname);
  
  const fileName = `${username}_${docname}_${dob}${ext}`;
  cb(null, fileName);
}
});
  
  const upload = multer({ storage: storage });

app.get("/register", (req, res) => {
    res.render('register')
})

// post method for registration form
app.post('/register', async (req, res) => {
    // Extract data from the form
    const { name, dob, roll10, passYear10, email, phoneno, password, confirmPassword,aadhar, address } = req.body;

    // You can perform validation here (optional)
    console.log(`${password}`);
    console.log(`${confirmPassword}`);
    if (password !== confirmPassword) {
        console.log("Passwords do not match");
        return res.status(400).send('Passwords do not match');
    }

    try {

        // Check if email already exists in the DB
        const existingUser = await userRegistration.findOne({ email });
        if (existingUser) {
            console.log("User already exists in DB");
            return res.send("User already exists in DB");
        }
        // Insert the user data into the MongoDB database
        console.log('Form Data:', {
            name,
            dob,
            roll10,
            passYear10,
            email,
            phoneno,
            password,
            aadhar,
            address
        });

        const newUser = new userRegistration({
            name,
            dob,
            roll10,
            passYear10,
            email,
            phoneno,
            password,
            aadhar,
            address
        });

        // Save the new user to the database
        await newUser.save();

        // After saving, send a success response
        // return res.send('Registration successful!');
        console.log("'Registration successful!'")
        res.redirect('/');
        // Optionally, you can redirect to a different page:
        // res.redirect('/success');
    } catch (error) {
        console.error("Error saving user to MongoDB:", error);
        return res.status(500).send('Error registering user');
    }


});

app.get('/login', async (req, res) => {
    res.render('login');
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(email);
    console.log(password);
    if (!email || !password) {
      return res.status(400).send({ error: 'Email and password are required' });
    }
  
    try {
      const user = await userRegistration.findOne({ email });
  
      if (!user || user.password !== password) {
        return res.status(401).send({ error: 'Invalid email or password' });
      }
      
      // Set user session
      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        dob: user.dob // Include the date of birth
      };

  
      // return res.send({ message: 'Login successful' });
      console.log('Login successful');
      // res.render('home');
      res.redirect('/');
    } catch (error) {
      console.error(error);
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  });


  app.get('/home', isAuthenticated, (req, res) => {
    res.render('home', { user: req.session.user });
  });



// app.get('/home', isAuthenticated, (req, res) => {
//   res.render('home', { user: req.session.user });
// });

// app.get('/application', (req, res) => {
//   res.render('application');
// });

app.get('/', (req, res) => {
  const user = req.session.user;
  
  if (user) {
    // User is logged in, render the logged-in home page with user info
    res.render('home', { user: user });
  } else {
    // User is not logged in, render the home page without user info (guest mode)
    res.render('home', { user: null });
  }
});

app.get('/application', isAuthenticated, (req, res) => {
  res.render('application', { user: req.session.user });
});

app.post('/upload', isAuthenticated, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'ews', maxCount: 1 },
  { name: 'caste', maxCount: 1 },
  { name: 'gate', maxCount: 1 }
]), async (req, res) => {
  const files = req.files;
  const verificationResults = {};
  const userName = req.session.user.name;

  for (const [fieldName, fileArray] of Object.entries(files)) {
    for (const file of fileArray) {
      try {
        let textContent = null;

        if (file.mimetype === 'application/pdf') {
          textContent = await convertPdfToText(file.path);
          // console.log(textContent);
        } else if (file.mimetype.startsWith('image/')) {
          textContent = await convertImageToText(file.path);
        } else {
          verificationResults[fieldName] = { verified: false, message: 'Unsupported file format' };
          continue;
        }

        const contentVerification = verifyTextContent(textContent);
        const nameVerification = await verifyNameInText(userName, textContent);

        if (contentVerification && nameVerification) {
          verificationResults[fieldName] = { verified: true, message: 'File verified successfully' };
          // Move the file to a permanent location
          const finalPath = path.join(__dirname, 'uploads', file.filename);
          fs.renameSync(file.path, finalPath);
        } else {
          verificationResults[fieldName] = { verified: false, message: 'File failed verification' };
          // Optionally, delete the temporary file
          fs.unlinkSync(file.path);
        } 
      } catch (error) {
        console.error(`Error processing ${file.fieldname}:`, error);
        verificationResults[fieldName] = { verified: false, message: 'Error processing file' };
      }
    }
  }

  const allVerified = Object.values(verificationResults).every(result => result.verified);

  res.json({
    message: allVerified ? 'Files uploaded and verified successfully' : 'Some files failed verification',
    verificationResults: verificationResults
  });
});


app.get('/result', isAuthenticated, async (req, res) => {
  try {
      const user = await userRegistration.findById(req.session.user.id);
      
      const uploadPath = path.join(__dirname, 'uploads');
      const userFilePrefix = `${user.name}_`;
      
      let uploadedFiles = {
          resume: null,
          ews: null,
          caste: null,
          gate: null
      };
      
      if (fs.existsSync(uploadPath)) {
          const files = fs.readdirSync(uploadPath);
          files.forEach(filename => {
              if (filename.startsWith(userFilePrefix)) {
                  const parts = filename.split('_');
                  if (parts.length >= 2) {
                      const docType = parts[1].toLowerCase();
                      if (uploadedFiles.hasOwnProperty(docType)) {
                          uploadedFiles[docType] = {
                              filename: filename,
                              verified: true 
                          };
                      }
                  }
              }
          });
      }

      res.render('result', { 
          user: user,
          uploadedFiles: uploadedFiles
      });
  } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).send('Error fetching user data');
  }
});


  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/');
    });
  });


app.listen(port, () => {
    console.log(`Server running at port: ${port}`);
});
