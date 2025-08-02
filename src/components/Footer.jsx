import React from "react";

// Logo component
const Logo = ({ className = "w-12 h-12" }) => (
  <div className={`${className} relative`}>
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Brain outline */}
      <path
        d="M20 35 C15 25, 35 15, 50 20 C65 15, 85 25, 80 35 C85 45, 85 55, 80 65 C75 75, 65 80, 50 75 C35 80, 25 75, 20 65 C15 55, 15 45, 20 35 Z"
        fill="none"
        stroke="#4FC3F7"
        strokeWidth="4"
        className="brain-outline"
      />
      {/* Brain details */}
      <path
        d="M30 40 C35 35, 45 40, 50 35 C55 40, 65 35, 70 40"
        fill="none"
        stroke="#4FC3F7"
        strokeWidth="2"
      />
      <path
        d="M25 50 C30 45, 40 50, 50 45 C60 50, 70 45, 75 50"
        fill="none"
        stroke="#4FC3F7"
        strokeWidth="2"
      />
      {/* Medical cross */}
      <rect x="42" y="35" width="16" height="6" fill="#FF5252" rx="1" />
      <rect x="47" y="30" width="6" height="16" fill="#FF5252" rx="1" />
      {/* Brain stem */}
      <rect x="47" y="70" width="6" height="15" fill="#4FC3F7" rx="3" />
    </svg>
  </div>
);

export default function Footer() {
  const Mail = () => <span className="text-lg">✉️</span>;
  const Phone = () => <span className="text-lg">📞</span>;
  const MapPin = () => <span className="text-lg">📍</span>;

  return (
    <footer className="bg-slate-900/90 backdrop-blur-sm border-t border-blue-500/20 text-white">
      {/* Main Footer Content */}
        

      {/* Bottom Bar */}
      <div className="border-t border-slate-700 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-slate-400 text-sm">
                &copy; {new Date().getFullYear()} Pocket Health Solutions. All
                rights reserved.
              </p>
              <p className="text-slate-500 text-xs mt-1">
                HIPAA Compliant & Secure | SOC 2 Type II Certified
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {[
                "Privacy Policy",
                "Terms of Service",
                "HIPAA Notice",
                "Cookie Policy",
                "Security",
              ].map((link, index) => (
                <a
                  key={index}
                  href="#"
                  className="text-slate-400 hover:text-blue-300 transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
