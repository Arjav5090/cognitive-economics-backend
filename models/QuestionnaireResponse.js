
const mongoose = require('mongoose');

const questionnaireResponseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  location: { type: String, required: true },
  age: { type: Number, required: true },
  education: { type: String, required: true },
  workStatus: { type: String, required: true },
  interestInCognitiveEconomics: { type: String, required: true },
  selectedChapters: { type: [String], required: true },
  selectedBooks: { type: [String], required: true },
  participationPreferences: { type: [String], required: true },
  proposal: {
    title: { type: String },
    summary: { type: String },
    documentation: { type: String } // Store file path or link
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuestionnaireResponse', questionnaireResponseSchema);
