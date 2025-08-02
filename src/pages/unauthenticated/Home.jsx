import React, { useState, useEffect } from "react";

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);



  return (
<div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 min-h-screen text-white overflow-hidden w-full m-0 p-0">
      {/* Hero Section */}
      <header className="relative py-16 md:py-24 px-4 md:px-6 text-center overflow-hidden">
        <div className={`relative z-10 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Pocket</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-400">
              Health Solutions
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto mb-12 leading-relaxed">
            Advanced healthcare technology at your fingertips. Empowering medical professionals 
            with intelligent solutions for better patient outcomes and streamlined workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white px-10 py-4 rounded-full font-semibold text-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center border border-blue-400/30">
              Login
            </button>
            <button className="border-2 border-blue-400/50 text-blue-200 px-10 py-4 rounded-full font-semibold text-lg hover:bg-blue-500/10 transition-all duration-300 backdrop-blur-sm">
                Register
            </button>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="inline-block bg-gradient-to-r from-red-500/20 to-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-red-400/30">
                About Pocket Health
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                <span className="text-white">Revolutionizing</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-400">
                  Healthcare Technology
                </span>
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed mb-10">
                We are dedicated to transforming healthcare through innovative technology solutions. 
                Our platform combines artificial intelligence, advanced analytics, and user-centric design 
                to deliver exceptional healthcare experiences for both providers and patients.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "AI-Powered Diagnostics",
                  "Real-time Analytics", 
                  "HIPAA Compliant",
                  "Cloud-Based Security"
                ].map((feature, index) => (
                  <div key={index} className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl px-4 py-3 text-blue-200 font-medium">
                    ✓ {feature}
                  </div>
                ))}
              </div>
            </div>
            <div className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <div className="relative">
                <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/60 backdrop-blur-sm rounded-3xl p-8 border border-blue-500/20 shadow-2xl">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-slate-700/50 rounded-2xl border border-blue-400/20">
                      <div className="flex items-center mb-4">
                        <div>
                          <h3 className="font-bold text-white">Smart Health Monitoring</h3>
                          <p className="text-blue-300 text-sm">Real-time patient tracking</p>
                        </div>
                      </div>
                      <div className="bg-blue-500/20 rounded-lg p-3">
                        <div className="flex justify-between text-sm text-blue-200 mb-2">
                          <span>Patient Vitals</span>
                          <span>98% Normal</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-400 to-green-400 h-2 rounded-full" style={{width: '98%'}}></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-2xl border border-red-400/20">
                      <h3 className="font-bold text-white mb-3">Emergency Response</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Response Time</span>
                        <span className="text-red-400 font-bold">&lt; 2 min</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-red-500/20 to-blue-500/20 rounded-3xl blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-r from-blue-900/80 to-slate-900/80 relative overflow-hidden border-y border-blue-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-red-500/5"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-block bg-blue-500/20 backdrop-blur-sm text-blue-200 px-6 py-3 rounded-full text-sm font-semibold mb-8 border border-blue-400/30">
              Our Mission
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-10 leading-tight">
              <span className="text-white">Empowering Healthcare Through</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-red-400 to-blue-400">
                Innovation & Intelligence
              </span>
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed mb-12 max-w-4xl mx-auto">
              Our mission is to bridge the gap between advanced technology and compassionate healthcare. 
              We're committed to developing solutions that enhance medical decision-making, improve patient 
              outcomes, and create more efficient healthcare systems worldwide.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Innovation", desc: "Cutting-edge AI and machine learning solutions", icon: "🧠" },
                { title: "Accessibility", desc: "Making quality healthcare available to everyone", icon: "🌍" },
                { title: "Excellence", desc: "Maintaining the highest standards in medical technology", icon: "⭐" }
              ].map((item, index) => (
                <div key={index} className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 hover:border-blue-400/40 transition-all duration-300">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    
    </div>
  );
};

export default Home;