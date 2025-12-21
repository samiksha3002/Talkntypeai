import React, { useState } from 'react';
import { Upload, User, Phone, Mail, MapPin, ArrowRight, Loader2, CheckCircle, AlertCircle, Award, Globe, ShieldCheck } from 'lucide-react';
import cardSample from '/src/assets/business card sample.jpg';
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
  const [status, setStatus] = useState('idle');
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

      if (file) {
        const imageFormData = new FormData();
        imageFormData.append('image', file);
        const safeName = formData.name.replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `${safeName}_${Date.now()}`;
        imageFormData.append('name', fileName);
        
        const imgBbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: imageFormData,
        });

        const imgBbData = await imgBbResponse.json();
        if (!imgBbData.success) throw new Error('Image upload failed.');
        logoUrl = imgBbData.data.url;
      }

      const web3Data = {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `New Business Card Request: ${formData.name}`,
        from_name: "Digital Card App",
        ...formData,
        logo_url: logoUrl,
        message: `New request details:\nName: ${formData.name}\nContact: ${formData.contact}\nEmail: ${formData.email}\nAddress: ${formData.address}\nLogo Link: ${logoUrl}`
      };

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(web3Data),
      });

      const result = await response.json();
      if (result.success) {
        setStatus('success');
        setFormData({ name: '', contact: '', email: '', address: '' });
        setFile(null);
      } else {
        throw new Error(result.message || "Submission failed.");
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 pt-10 px-4 md:px-8 font-sans antialiased text-slate-900">
      
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                Digital <span className="text-orange-600">Business Card</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl">
                Elevate your professional legal practice with a high-impact digital identity.
            </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          
          {/* LEFT SIDE: Preview (Top) & Content (Bottom) */}
          <div className="bg-slate-900 text-white flex flex-col">
            
            {/* Swapped: Image now at the TOP */}
            <div className="p-8 lg:p-12 bg-gradient-to-br from-slate-800 to-slate-900 relative flex items-center justify-center min-h-[350px]">
                {/* Decorative Elements */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fb923c 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
                
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-amber-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative border border-white/10 shadow-2xl rounded-xl overflow-hidden transform -rotate-2 hover:rotate-0 transition-all duration-500 max-w-md">
                       <img 
  src={cardSample} 
  alt="Sample Business Card" 
  className="w-full h-auto object-cover"
/>
                    </div>
                </div>
                <div className="absolute bottom-4 right-8 text-orange-400/50 font-mono text-xs uppercase tracking-widest">Premium Template v2.0</div>
            </div>

            {/* Swapped: Content now at the BOTTOM */}
            <div className="p-8 lg:p-12 flex-1 border-t border-white/5">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="bg-orange-500/10 p-2 rounded-lg">
                        <Award className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-white">Professional Branding</h4>
                        <p className="text-slate-400 text-sm">Custom designed for advocates and legal consultants.</p>
                    </div>
                </div>
                
                <div className="flex items-start gap-4">
                    <div className="bg-orange-500/10 p-2 rounded-lg">
                        <Globe className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-white">Instant Accessibility</h4>
                        <p className="text-slate-400 text-sm">One-tap contact saving and location sharing for clients.</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="bg-orange-500/10 p-2 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-white">Verified Identity</h4>
                        <p className="text-slate-400 text-sm">Securely hosted professional profile with integrated logo.</p>
                    </div>
                </div>
              </div>

              <div className="mt-10 p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-slate-300 italic text-sm leading-relaxed">
                    "In the digital age, your first impression often happens before you even meet the client. Make it count."
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Form */}
          <div className="p-8 lg:p-12">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800">Card Registration</h3>
                <p className="text-slate-500">Provide your official details for the card generation.</p>
            </div>
            
            {status === 'success' ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-10 text-center animate-in zoom-in duration-300">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-6">
                  <CheckCircle className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-900">Submission Successful</h3>
                <p className="mt-3 text-emerald-700">
                  Your request has been queued. Our design team will process your digital card within 24 hours.
                </p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  Submit New Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input 
                                required
                                type="text" 
                                name="name" 
                                value={formData.name}
                                placeholder="Adv. Rajesh Kumar"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Contact Number</label>
                        <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input 
                                required
                                type="tel" 
                                name="contact" 
                                value={formData.contact}
                                placeholder="+91 98765 43210"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Email ID */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Official Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        <input 
                            required
                            type="email" 
                            name="email" 
                            value={formData.email}
                            placeholder="advocate@example.com"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Office Address</label>
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        <textarea 
                            required
                            name="address" 
                            rows="3"
                            value={formData.address}
                            placeholder="Chamber No. 101, High Court Complex..."
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all resize-none"
                            onChange={handleChange}
                        ></textarea>
                    </div>
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Branding (Logo or Professional Photo)</label>
                  <div className={`group border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${file ? 'border-orange-500 bg-orange-50/50' : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'}`}>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                    {file ? (
                      <div className="flex flex-col items-center animate-in zoom-in duration-200">
                        <div className="bg-orange-500 p-3 rounded-full mb-3 shadow-lg">
                            <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-bold text-slate-800 truncate max-w-[250px]">{file.name}</span>
                        <button className="text-xs text-orange-600 font-bold mt-2 underline">Change File</button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-slate-100 p-4 rounded-full mb-4 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                            <Upload className="h-8 w-8 text-slate-400 group-hover:text-orange-600" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Click to upload assets</span>
                        <span className="text-xs text-slate-400 mt-1 uppercase tracking-tighter font-semibold">PNG, JPG up to 5MB</span>
                      </>
                    )}
                  </div>
                </div>

                {status === 'error' && (
                  <div className="flex items-center gap-3 text-red-700 text-sm bg-red-50 p-4 rounded-xl border border-red-100">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={status === 'loading'}
                  className={`w-full font-bold py-4 rounded-xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                    status === 'loading' 
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" /> Finalizing Request...
                    </>
                  ) : (
                    <>
                      Submit Application <ArrowRight className="h-6 w-6" />
                    </>
                  )}
                </button>

              </form>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center">
            <p className="text-slate-400 text-sm italic">© 2024 Digital Card App for Legal Professionals. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default BusinessCardRequest;