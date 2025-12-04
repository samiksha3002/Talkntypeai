import React, { useState } from 'react';
import { Upload, User, Phone, Mail, MapPin, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// ==========================================
// ⬇️ PASTE YOUR API KEYS HERE ⬇️
// ==========================================
const WEB3FORMS_ACCESS_KEY = "09589415-fa02-432a-a753-2fb71ffa1f23"; 
const IMGBB_API_KEY = "8ba1a728a0ae395f64607f932b17b354";
// ==========================================

const BusinessCardRequest = () => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
  });
  
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      let logoUrl = "No logo uploaded";

      // 1. Upload Image to ImgBB (if a file is selected)
      if (file) {
        const imageFormData = new FormData();
        imageFormData.append('image', file);
        
        // UNIQUE IDENTIFIER LOGIC:
        // Yahan hum file ka naam set kar rahe hain taaki ImgBB dashboard me 
        // "Rajesh_Kumar_123456" jaisa naam dikhe.
        const safeName = formData.name.replace(/[^a-zA-Z0-9]/g, "_"); // Remove spaces/special chars
        const fileName = `${safeName}_${Date.now()}`; // Add timestamp for uniqueness
        imageFormData.append('name', fileName);
        
        // ImgBB Upload Request
        const imgBbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: imageFormData,
        });

        const imgBbData = await imgBbResponse.json();

        if (!imgBbData.success) {
          throw new Error('Failed to upload image to ImgBB. Please check your API Key.');
        }

        logoUrl = imgBbData.data.url; // Get the public URL
      }

      // 2. Send Data to Web3Forms
      const web3Data = {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `New Business Card Request: ${formData.name}`,
        from_name: "Digital Card App",
        ...formData,
        logo_url: logoUrl, // Sending the link we got from ImgBB
        message: `
          New request details:
          Name: ${formData.name}
          Contact: ${formData.contact}
          Email: ${formData.email}
          Address: ${formData.address}
          
          Logo Link: ${logoUrl}
          (This logo is saved in ImgBB with name: ${formData.name})
        `
      };

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(web3Data),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setFormData({ name: '', contact: '', email: '', address: '' });
        setFile(null);
      } else {
        throw new Error(result.message || "Failed to submit form.");
      }

    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-10 px-4 md:px-8 font-sans">
      
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Digital Business Card</h1>
        <p className="text-gray-500 mb-8">Get your professional digital identity for your legal practice.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* LEFT SIDE: Info & Preview */}
          <div className="p-8 bg-orange-50 flex flex-col justify-center relative overflow-hidden">
            {/* Decorative background circle */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-orange-100 opacity-50 blur-3xl"></div>
            
            <div className="mb-8 relative z-10">
              <h2 className="text-2xl font-bold text-orange-900 mb-4">Why do you need this?</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                As an advocate, your network is your net worth. A digital business card allows clients to save your contact details instantly, access your office location, and share your profile with others easily.
                <br /><br />
                <strong className="text-orange-700">Fill the form to generate your professional card instantly.</strong>
              </p>
            </div>

            {/* Sample Card Preview */}
            <div className="relative z-10 mt-4 border-4 border-white shadow-xl rounded-xl overflow-hidden rotate-1 hover:rotate-0 transition-transform duration-300">
               {/* NOTE: Relative paths like "/../business card.jpg" will NOT work in React unless configured.
                  
                  TO USE YOUR LOCAL IMAGE:
                  1. Import it at the top: import cardSample from './path/to/image.jpg';
                  2. Use it here: src={cardSample}
                  
                  FOR NOW: I am using a placeholder URL so you can see the preview.
               */}
               <img 
                 src="assets/business card sample.jpg" 
                 alt="Sample Business Card" 
                 className="w-full h-auto object-cover"
               />
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">*Sample Preview</p>
          </div>

          {/* RIGHT SIDE: Form */}
          <div className="p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Enter Your Details</h3>
            
            {status === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-fade-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-medium text-green-900">Request Sent!</h3>
                <p className="mt-2 text-green-700">
                  We have received your details and logo. Your digital card will be ready shortly.
                </p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input 
                      required
                      type="text" 
                      name="name" 
                      value={formData.name}
                      placeholder="Adv. Rajesh Kumar"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input 
                      required
                      type="tel" 
                      name="contact" 
                      value={formData.contact}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Email ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input 
                      required
                      type="email" 
                      name="email" 
                      value={formData.email}
                      placeholder="advocate@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea 
                      required
                      name="address" 
                      rows="3"
                      value={formData.address}
                      placeholder="Chamber No. 101, High Court Complex..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Logo / Photo</label>
                  <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition cursor-pointer relative ${file ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                    {file ? (
                      <>
                        <CheckCircle className="h-8 w-8 text-orange-600 mb-2" />
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-green-600 mt-1">Ready to upload</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Click to upload or drag & drop</span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG (Max 5MB)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {status === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    {errorMessage}
                  </div>
                )}

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={status === 'loading'}
                  className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                    status === 'loading' 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-orange-600 hover:bg-orange-700 hover:shadow-xl active:scale-95 text-white'
                  }`}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Uploading & Sending...
                    </>
                  ) : (
                    <>
                      Submit Details <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCardRequest;