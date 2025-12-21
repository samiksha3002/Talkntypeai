import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, CheckCircle, ArrowLeft, Monitor, Smartphone, 
  Zap, Shield, Server, Layout, MessageSquare 
} from 'lucide-react';

const WebsiteShowcase = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    domainName: '',
    firmName: '',
    practiceAreas: '',
    preferredHosting: 'Vercel',
    description: ''
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
        <button onClick={() => document.getElementById('website-form').scrollIntoView({ behavior: 'smooth' })} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all">
          Start Project
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="max-w-6xl mx-auto pt-16 px-6 text-center">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
          Your Professional Digital Chamber <br />
          <span className="text-indigo-600">Built by Talk N Type</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-12">
          Don't just have a website. Have a digital office. We integrate your <strong>TNT AI Tools</strong> directly into your own website for your clients.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {features.map((f, i) => (
            <div key={i} className="bg-white px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-indigo-600">{f.icon}</span>
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- LIVE SAMPLE PREVIEW --- */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="relative group">
            {/* Browser Frame */}
            <div className="bg-slate-900 rounded-t-2xl p-3 flex items-center justify-between border-b border-slate-700">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="bg-slate-800 px-6 py-1 rounded-full text-[10px] text-slate-400 font-mono flex items-center gap-2">
                    <Globe size={10} /> advocate.talkntype.com
                </div>
                <div className="flex gap-3 text-slate-500">
                    <Monitor size={14} />
                    <Smartphone size={14} />
                </div>
            </div>

            {/* Scrolling Website Image */}
            <div className="bg-white border-x border-b border-slate-200 rounded-b-2xl overflow-hidden shadow-2xl h-[550px] relative">
                <img 
                    src="assets/business card sample.jpg" 
                    alt="Advocate Website Sample"
                    className="w-full h-auto object-cover transform translate-y-0 group-hover:translate-y-[-10%] transition-transform duration-[4000ms] ease-in-out"
                />
                
                {/* Floating Info Card */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900 to-transparent p-10 flex items-end justify-between">
                    <div>
                        <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded mb-2 w-fit">PREMIUM TEMPLATE</div>
                        <h3 className="text-white text-2xl font-bold">The Legal Professional</h3>
                        <p className="text-slate-300">Clean, Fast, and Trustworthy Design.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- PROJECT INTAKE FORM --- */}
      <section id="website-form" className="max-w-4xl mx-auto px-6 scroll-mt-24">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-indigo-600 p-8 text-white">
                <h2 className="text-2xl font-bold mb-2">Build My Website</h2>
                <p className="text-indigo-100 opacity-80">Fill in the technical requirements for your chamber's website.</p>
            </div>

            <div className="p-8">
                {/* Step Indicators */}
                <div className="flex gap-4 mb-8">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
                    ))}
                </div>

                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Globe className="text-indigo-600"/> Step 1: Identity & Domain</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Firm/Chamber Name</label>
                                <input name="firmName" onChange={handleInputChange} value={formData.firmName} type="text" placeholder="e.g. Verma & Associates" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Preferred Domain Name</label>
                                <input name="domainName" onChange={handleInputChange} value={formData.domainName} type="text" placeholder="e.g. www.advverma.in" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500" />
                                <p className="text-[10px] text-slate-400 mt-1">*Domain subject to availability</p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Layout className="text-indigo-600"/> Step 2: Practice Areas</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Primary Practice Areas</label>
                                <textarea name="practiceAreas" onChange={handleInputChange} value={formData.practiceAreas} rows="4" placeholder="e.g. Criminal Defense, Civil Litigation, Family Law..." className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500 resize-none"></textarea>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Server className="text-indigo-600"/> Step 3: Infrastructure</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Hosting Platform Preference</label>
                                <select name="preferredHosting" onChange={handleInputChange} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500">
                                    <option value="Vercel">Vercel (Recommended for Speed)</option>
                                    <option value="Render">Render (Recommended for Full Stack)</option>
                                    <option value="GitHub Pages">GitHub Pages (Simple Static)</option>
                                </select>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl flex gap-3 items-start border border-indigo-100">
                                <Zap className="text-indigo-600 flex-shrink-0" size={20} />
                                <p className="text-xs text-indigo-800 leading-relaxed">
                                    Your website will be connected to your <strong>TNT Dashboard</strong>. This allows you to manage clients and inquiries directly from your TNT account.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-10 flex justify-between">
                    {step > 1 && (
                        <button onClick={() => setStep(step - 1)} className="px-6 py-2 font-bold text-slate-500 hover:text-indigo-600">Back</button>
                    )}
                    <button 
                        onClick={() => step < 3 ? setStep(step + 1) : alert("Form Submitted Successfully!")} 
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 ml-auto shadow-lg"
                    >
                        {step === 3 ? "Submit Project Request" : "Next Step"}
                    </button>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default WebsiteShowcase;