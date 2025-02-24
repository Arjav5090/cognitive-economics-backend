const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const formRoutes = require('./routes/formRoutes');
const path = require('path');
const cron = require('node-cron');

const QuestionnaireResponse = require('./models/QuestionnaireResponse');
dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: 'https://andrewcaplin.com',
    credentials: true
  }));
  
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});

// Routes
app.use('/api/forms', formRoutes);

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');

// Schedule DB and file cleanup every Sunday at midnight
cron.schedule('0 0 * * 0', async () => {
    try {
        // Delete all questionnaire responses from the database
        const result = await QuestionnaireResponse.deleteMany({});
        console.log(`🗑️ Cleanup: Deleted ${result.deletedCount} responses from the database.`);

        // Delete all files inside the uploads folder
        fs.readdir(uploadDir, (err, files) => {
            if (err) {
                console.error("❌ Error reading uploads folder:", err);
                return;
            }

            files.forEach(file => {
                fs.unlink(path.join(uploadDir, file), err => {
                    if (err) {
                        console.error(`❌ Error deleting file ${file}:`, err);
                    } else {
                        console.log(`🗑️ Deleted file: ${file}`);
                    }
                });
            });
        });

    } catch (error) {
        console.error("❌ Error during cleanup:", error);
    }
}, {
    scheduled: true,
    timezone: "America/New_York" // Adjust as needed
});

console.log("📅 Weekly DB & File cleanup scheduled: Every Sunday at midnight.");

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

// Start the server
module.exports = app;