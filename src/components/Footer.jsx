import React from 'react';

const Footer = () => {
  return (
    // --- CHANGE 1: Reduced vertical padding from py-12 to py-6 ---
    <footer className="bg-slate-900 text-slate-300 py-6 px-6 border-t border-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Section: Grid Layout */}
        {/* --- CHANGE 2: Reduced bottom margin from mb-12 to mb-8 --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Column 1: Brand Info */}
          <div className="col-span-1 md:col-span-1">
            {/* --- CHANGE 3: Reduced margin below logo from mb-4 to mb-2 --- */}
            <div className="flex items-center gap-2 mb-2">
              <img 
                src="/logo.png" 
                alt="Talk N Type Logo" 
                // Agar image file me khud extra space hai to 'object-contain' aur 'h-12' adjust karein
                className="w-40 h-auto object-contain -ml-2" 
              />
            </div>
            
            {/* --- CHANGE 4: Reduced margin below text from mb-6 to mb-4 --- */}
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Your personal virtual assistant for fast, accurate, and secure documentation.
            </p>
            
            {/* Social Icons */}
            <div className="flex space-x-4">
              <SocialIcon path="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              <SocialIcon path="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
              <SocialIcon path="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 2a2 2 0 11-1.998 2.002 2 2 0 011.998-2.002z" />
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-white font-bold mb-3">Product</h3> {/* Reduced mb */}
            <ul className="space-y-2 text-sm">
              <FooterLink text="Features" />
              <FooterLink text="Pricing" />
              <FooterLink text="Integrations" />
              <FooterLink text="FAQ" />
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="text-white font-bold mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <FooterLink text="About Us" />
              <FooterLink text="Careers" />
              <FooterLink text="Blog" />
              <FooterLink text="Contact" />
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="text-white font-bold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <FooterLink text="Privacy Policy" />
              <FooterLink text="Terms of Service" />
              <FooterLink text="Cookie Policy" />
            </ul>
          </div>

        </div>

        {/* Bottom Section: Copyright */}
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Talk N Type. All rights reserved.</p>
          <p className="mt-2 md:mt-0">
            Made with <span className="text-red-500">♥</span> in India
          </p>
        </div>

      </div>
    </footer>
  );
};

// Helper Components (Same as before)
const FooterLink = ({ text }) => (
  <li><a href="#" className="hover:text-blue-400 transition-colors duration-200">{text}</a></li>
);
const SocialIcon = ({ path }) => (
  <a href="#" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition duration-300 text-slate-400">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={path} /></svg>
  </a>
);

export default Footer;