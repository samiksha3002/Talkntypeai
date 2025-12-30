import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, ArrowLeft, Monitor, Smartphone, Zap, Shield, 
  Server, Layout, MessageSquare, MapPin, Award, 
  Share2, Camera, Upload, CheckCircle 
} from 'lucide-react';

const WebsiteShowcase = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState(null);

  const [formData, setFormData] = useState({
    domainName: '',
    firmName: '',
    tagline: '',
    logoFile: null, // Compulsory field
    practiceAreas: '',
    achievements: '',
    address: '',
    contactNumber: '',
    email: '',
    googleMapsUrl: '',
    linkedIn: '',
    twitter: '',
    languagePreference: 'English Only',
    hasProfilePhoto: 'No',
    preferredHosting: 'Vercel',
  });

  const features = [
    { icon: <Smartphone size={20} />, text: "Mobile Responsive" },
    { icon: <MessageSquare size={20} />, text: "Built-in AI Chat" },
    { icon: <Server size={20} />, text: "Fast Hosting" },
    { icon: <Shield size={20} />, text: "SSL Secured" }
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logoFile: file });
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    // Step 1 validation for compulsory logo
    if (step === 1 && !formData.logoFile) {
      alert("Please upload your firm's logo to proceed. It is compulsory.");
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-24">
      {/* --- HEADER --- */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium">
          <ArrowLeft size={20} /> Back to TNT
        </button>
        <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1 rounded font-bold text-xs">TNT</span>
            <div className="text-xl font-bold text-slate-800 tracking-tight">Web Presence</div>
        </div>
        <button onClick={() => document.getElementById('website-form').scrollIntoView({ behavior: 'smooth' })} className="hidden md:block bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all">
          Start Project
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="max-w-6xl mx-auto pt-16 px-6 text-center">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
          Your Professional Digital Chamber <br />
          <span className="text-indigo-600">Built by Talk N Type</span>
        </h1>
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {features.map((f, i) => (
            <div key={i} className="bg-white px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-indigo-600">{f.icon}</span>
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- PROJECT INTAKE FORM --- */}
      <section id="website-form" className="max-w-4xl mx-auto px-6 scroll-mt-24">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-indigo-600 p-8 text-white">
                <h2 className="text-2xl font-bold mb-2">Build My Website</h2>
                <p className="text-indigo-100 opacity-80">Provide details to launch your professional legal website.</p>
            </div>

            <div className="p-8">
                {/* Step Indicators */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
                    ))}
                </div>

                {/* STEP 1: IDENTITY & LOGO */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Globe className="text-indigo-600"/> Step 1: Identity & Logo</h3>
                        <div className="space-y-4">
                            {/* Compulsory Logo Upload */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-600">Firm Logo (Compulsory)</label>
                                <div 
                                  onClick={() => fileInputRef.current.click()}
                                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${formData.logoFile ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'}`}
                                >
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />
                                    {logoPreview ? (
                                      <div className="flex flex-col items-center">
                                        <img src={logoPreview} alt="Preview" className="h-16 w-16 object-contain mb-2" />
                                        <span className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle size={14}/> Logo Selected</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center text-slate-400">
                                        <Upload size={24} className="mb-2" />
                                        <p className="text-xs font-medium">Click to upload Logo (Compulsory)</p>
                                      </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Firm/Chamber Name</label>
                                <input name="firmName" onChange={handleInputChange} value={formData.firmName} type="text" placeholder="e.g. Verma & Associates" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Tagline/Slogan</label>
                                <input name="tagline" onChange={handleInputChange} value={formData.tagline} type="text" placeholder="e.g. Justice for All" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Preferred Domain</label>
                                <input name="domainName" onChange={handleInputChange} value={formData.domainName} type="text" placeholder="e.g. www.advverma.in" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: PRACTICE & AWARDS */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Award className="text-indigo-600"/> Step 2: Practice & Achievements</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Practice Areas</label>
                                <textarea name="practiceAreas" onChange={handleInputChange} value={formData.practiceAreas} rows="3" placeholder="Criminal, Civil, Corporate..." className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500 resize-none"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Achievements / Bar Memberships</label>
                                <textarea name="achievements" onChange={handleInputChange} value={formData.achievements} rows="3" placeholder="Supreme Court Bar Association, Best Advocate Award 2023..." className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500 resize-none"></textarea>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: CONTACT & MAPS */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><MapPin className="text-indigo-600"/> Step 3: Location & Contact</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">Phone Number</label>
                                    <input name="contactNumber" onChange={handleInputChange} value={formData.contactNumber} type="tel" placeholder="+91..." className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">Email ID</label>
                                    <input name="email" onChange={handleInputChange} value={formData.email} type="email" placeholder="advocate@email.com" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Chamber Address</label>
                                <textarea name="address" onChange={handleInputChange} value={formData.address} rows="2" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500 resize-none"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Google Maps Link</label>
                                <input name="googleMapsUrl" onChange={handleInputChange} value={formData.googleMapsUrl} type="url" placeholder="Paste link here" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4: SOCIAL & PREFERENCES */}
                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Share2 className="text-indigo-600"/> Step 4: Social & Preferences</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">LinkedIn Profile</label>
                                    <input name="linkedIn" onChange={handleInputChange} value={formData.linkedIn} type="text" placeholder="linkedin.com/in/..." className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">Languages</label>
                                    <select name="languagePreference" onChange={handleInputChange} value={formData.languagePreference} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500">
                                        <option>English Only</option>
                                        <option>English + Hindi</option>
                                        <option>English + Marathi</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1 flex items-center gap-2"><Camera size={14}/> Do you have a Professional Photo?</label>
                                <select name="hasProfilePhoto" onChange={handleInputChange} value={formData.hasProfilePhoto} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500">
                                    <option value="No">No, I need help</option>
                                    <option value="Yes">Yes, I have it</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 5: INFRASTRUCTURE */}
                {step === 5 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Server className="text-indigo-600"/> Step 5: Finalize Infrastructure</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Hosting Platform</label>
                                <select name="preferredHosting" onChange={handleInputChange} value={formData.preferredHosting} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500">
                                    <option value="Vercel">Vercel (Fastest)</option>
                                    <option value="Render">Render (Full Stack)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-10 flex justify-between">
                    {step > 1 && (
                        <button onClick={() => setStep(step - 1)} className="px-6 py-2 font-bold text-slate-500 hover:text-indigo-600 transition-colors">Back</button>
                    )}
                    <button 
                        onClick={step < 5 ? handleNext : () => alert("Form Submitted Successfully!")} 
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 ml-auto shadow-lg active:scale-95 transition"
                    >
                        {step === 5 ? "Submit Project Request" : "Next Step"}
                    </button>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default WebsiteShowcase;