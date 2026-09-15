import mongoose from 'mongoose';

const DraftTemplateSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  slug: { 
    type: String 
  },
  category: { 
    type: String, 
    required: true 
  },
  // DB me 'templateBody' hai, isliye isko add karna zaroori hai
  templateBody: { 
    type: String 
  },
  // 'content' ko optional rakh diya hai taaki purana code crash na ho
  content: { 
    type: String 
  },
  description: { 
    type: String 
  },
  language: { 
    type: String, 
    default: "English" 
  },
  status: { 
    type: String, 
    default: "published" 
  },
  placeholders: { 
    type: [String], 
    default: [] 
  }
}, { 
  timestamps: true, 
  strict: false // Ye false karne se agar DB me extra fields hongi to Mongoose error nahi dega
});

export default mongoose.models.DraftTemplate || mongoose.model('DraftTemplate', DraftTemplateSchema);