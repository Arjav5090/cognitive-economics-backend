const nodemailer = require('nodemailer');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const QuestionnaireResponse = require('../models/QuestionnaireResponse');

dotenv.config();
const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail', // Change if using a different provider
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your app password
    },
    
  }
  
);

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// POST: Submit Questionnaire Response
router.post('/submit', upload.single('proposalFile'), async (req, res) => {
    try {
        const {
            name, email, location, age, education, workStatus,
            interestInCognitiveEconomics, selectedChapters, selectedBooks,
            participationPreferences, proposalTitle, proposalSummary
        } = req.body;

        if (!name || !email || !location || !age || !education || !workStatus || !interestInCognitiveEconomics) {
            return res.status(400).json({ error: "All required fields must be filled." });
        }

        // ✅ Check if values exist before parsing to prevent `undefined` errors
        const parsedSelectedChapters = selectedChapters ? JSON.parse(selectedChapters) : [];
        const parsedSelectedBooks = selectedBooks ? JSON.parse(selectedBooks) : [];
        const parsedParticipationPreferences = participationPreferences ? JSON.parse(participationPreferences) : [];

        const newResponse = new QuestionnaireResponse({
            name,
            email,
            location,
            age,
            education,
            workStatus,
            interestInCognitiveEconomics,
            selectedChapters: parsedSelectedChapters,
            selectedBooks: parsedSelectedBooks,
            participationPreferences: parsedParticipationPreferences,
            proposal: {
                title: proposalTitle || null,
                summary: proposalSummary || null,
                documentation: req.file ? req.file.path : null
            }
        });

        await newResponse.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'ac1@nyu.edu',
            subject: 'New Questionnaire Submission',
            html: `
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #333;">📩 New Questionnaire Submission</h2>
                    <hr>
        
                    <h3 style="color: #444;">🔹 Personal Information:</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Location:</strong> ${location}</p>
                    <p><strong>Age:</strong> ${age}</p>
                    <p><strong>Education:</strong> ${education}</p>
                    <p><strong>Work Status:</strong> ${workStatus}</p>
                    <p><strong>Interest in Cognitive Economics:</strong> ${interestInCognitiveEconomics || "Not specified"}</p>
                    
                    <h3 style="color: #444;">📚 Selected Chapters:</h3>
                    <ul>
                        ${parsedSelectedChapters.length > 0 ? parsedSelectedChapters.map(chapter => `<li>${chapter}</li>`).join("") : "<p>None</p>"}
                    </ul>
        
                    <h3 style="color: #444;">📖 Selected Books:</h3>
                    <ul>
                        ${parsedSelectedBooks.length > 0 ? parsedSelectedBooks.map(book => `<li>${book}</li>`).join("") : "<p>None</p>"}
                    </ul>
        
                    <h3 style="color: #444;">🎯 Participation Preferences:</h3>
                    <ul>
                        ${parsedParticipationPreferences.length > 0 ? parsedParticipationPreferences.map(pref => `<li>${pref}</li>`).join("") : "<p>None</p>"}
                    </ul>
        
                    <h3 style="color: #444;">📝 Proposal Details:</h3>
                    <p><strong>Title:</strong> ${proposalTitle || "No title provided"}</p>
                    <p><strong>Summary:</strong> ${proposalSummary || "No summary provided"}</p>
        
                    <h3 style="color: #444;">📎 Attachment:</h3>
                    <p>${req.file ? `<strong>Attached:</strong> ${req.file.originalname}` : "No attachment"}</p>
        
                    <hr>
                    <p style="font-size: 12px; color: #777;">This email was generated automatically.</p>
                </body>
                </html>
            `,
            attachments: req.file
              ? [{ filename: req.file.originalname, path: req.file.path }]
              : [],
        };
        
        
        
      
          // Send email
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('Error sending email:', error);
              return res.status(500).json({ error: 'Failed to send email' });
            }
            console.log('Email sent:', info.response);
            res.status(201).json({ message: "Questionnaire submitted successfully and email sent!" });
          });


    } catch (error) {
        console.error("Error saving form response:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// GET: Fetch all responses
router.get('/responses', async (req, res) => {
    try {
        const responses = await QuestionnaireResponse.find();
        res.json(responses);
    } catch (error) {
        console.error("Error fetching responses:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
