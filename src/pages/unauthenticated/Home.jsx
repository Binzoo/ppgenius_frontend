import React from "react";
const Home = () => {
  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      {/* Hero / Header Section */}
      <header className="bg-blue-100 py-12 px-6 text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-2">Welcome to Our Site</h1>
        <p className="text-lg text-gray-700 max-w-xl mx-auto">
          Empowering communities through innovation, inclusion, and integrity.
        </p>
      </header>

      {/* About Us Section */}
      <section className="bg-white py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-red-500 mb-4">About Us</h2>
          <p className="text-gray-700 leading-relaxed">
            We are a dedicated team focused on delivering high-quality, user-centric solutions that make
            a real difference. With a passion for progress and a heart for people, our mission is to bridge
            gaps, build connections, and push the boundaries of what's possible.
          </p>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="bg-blue-50 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-blue-700 mb-4">Our Mission</h2>
          <p className="text-gray-700 leading-relaxed">
            Our mission is to cultivate innovation, foster inclusivity, and champion positive change.
            Through collaboration, creativity, and commitment, we aim to create a meaningful impact
            in every community we serve.
          </p>
        </div>
      </section>

      {/* Footer */}
    
    </div>
  );
};

export default Home;