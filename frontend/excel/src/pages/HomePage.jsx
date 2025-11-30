import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import FileUploader from '../components/chart/FileUploader';
import ChartControls from '../components/chart/ChartControls';
import ChartCanvas from '../components/chart/ChartCanvas';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [chartOptions, setChartOptions] = useState({
    title: 'My Chart',
    xAxisLabel: 'X Axis',
    yAxisLabel: 'Y Axis',
    color: '#3b82f6',
    orientation: 'vertical'
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleDataLoaded = (data) => {
    setChartData(data);
  };

  const features = [
    {
      icon: "📊",
      title: "One-Click Charts",
      description: "Transform your Excel data into beautiful charts instantly with our advanced algorithms."
    },
    {
      icon: "🎨",
      title: "Custom Styling",
      description: "Personalize your charts with multiple themes, colors, and customization options."
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      description: "Your data is processed securely with enterprise-grade privacy protection."
    },
    {
      icon: "📱",
      title: "Multi-Platform",
      description: "Access your charts anywhere - desktop, tablet, or mobile devices."
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Generate professional charts in seconds, not minutes."
    },
    {
      icon: "📈",
      title: "Multiple Types",
      description: "Bar, line, pie, scatter, histogram, and many more chart types available."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-hero-pattern bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 hero-gradient"></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 text-6xl floating-element animate-delay-1000">📊</div>
        <div className="absolute top-40 right-20 text-4xl floating-element animate-delay-200">📈</div>
        <div className="absolute bottom-40 left-20 text-5xl floating-element animate-delay-500">🎯</div>
        <div className="absolute bottom-20 right-10 text-4xl floating-element animate-delay-700">✨</div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-4">
          <div className={`transition-all duration-1000 ${isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-7xl md:text-8xl font-bold mb-6">
              <span className="text-gradient">Chart</span>
              <span className="text-white">Maker</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your Excel data into stunning, professional charts with the power of AI.
              <span className="text-purple-400 font-semibold"> One click. Infinite possibilities.</span>
            </p>
          </div>

          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
            {isAuthenticated ? (
              <div className="space-y-6">
                <FileUploader onDataLoaded={handleDataLoaded} />
                <p className="text-gray-400 text-sm">Upload your Excel file and watch the magic happen ✨</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/login" className="btn-primary text-lg px-8 py-4">
                  Get Started Now
                </Link>
                <Link to="/register" className="btn-secondary text-lg px-8 py-4">
                  Create Free Account
                </Link>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 transition-all duration-1000 delay-700 ${isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
            <div className="card-glass p-6">
              <div className="text-3xl font-bold text-gradient">10K+</div>
              <div className="text-gray-300">Charts Created</div>
            </div>
            <div className="card-glass p-6">
              <div className="text-3xl font-bold text-gradient">50+</div>
              <div className="text-gray-300">Chart Types</div>
            </div>
            <div className="card-glass p-6">
              <div className="text-3xl font-bold text-gradient">99.9%</div>
              <div className="text-gray-300">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              <span className="text-gradient">Powerful Features</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to create stunning data visualizations with ease
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`feature-card group animate-delay-${(index + 1) * 100}`}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              <span className="text-gradient">How It Works</span>
            </h2>
            <p className="text-xl text-gray-300">
              Get started in just three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload", desc: "Simply drag & drop your Excel file or click to browse", icon: "📁" },
              { step: "02", title: "Choose", desc: "Select from 50+ chart types and customize your design", icon: "🎨" },
              { step: "03", title: "Export", desc: "Download your professional chart in multiple formats", icon: "💾" }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {item.step}
                  </div>
                  <div className="absolute -top-2 -right-2 text-3xl animate-bounce-gentle">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-purple-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chart Preview Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              <span className="text-gradient">Live Preview</span>
            </h2>
            <p className="text-xl text-gray-300">
              See your charts come to life in real-time
            </p>
          </div>

          <div className="card-glass p-8 max-w-5xl mx-auto">
            {chartData ? (
              <div className="space-y-6">
                <ChartControls options={chartOptions} onOptionsChange={setChartOptions} />
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <ChartCanvas data={chartData} chartType={chartType} options={chartOptions} />
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4 animate-pulse-slow">📊</div>
                <h3 className="text-2xl font-semibold mb-4 text-white">
                  Ready to Create Amazing Charts?
                </h3>
                <p className="text-gray-400 mb-6">
                  Upload your Excel file above and watch your data transform into beautiful visualizations
                </p>
                {isAuthenticated && (
                  <div className="animate-bounce-gentle">
                    <FileUploader onDataLoaded={handleDataLoaded} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            <span className="text-gradient">Ready to Get Started?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of users who are already creating amazing charts with ChartMaker
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-4">
                Start Free Trial
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-3xl font-bold mb-4">
            <span className="text-gradient">ChartMaker</span>
          </div>
          <p className="text-gray-400 mb-6">
            Transform your data into beautiful, professional charts with the power of AI
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <span>&copy; {new Date().getFullYear()} ChartMaker</span>
            <span>•</span>
            <span>All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
