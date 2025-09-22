import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Palette, 
  Camera, 
  Heart, 
  Star,
  ChevronRight,
  Play,
  Users,
  Award,
  ShoppingBag
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Sample carousel images (we'll use vision expert agent to get these)
  const carouselImages = [
    {
      url: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      title: "Traditional Elegance",
      description: "Experience the beauty of traditional sarees"
    },
    {
      url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      title: "Modern Sophistication",
      description: "Discover contemporary saree styles"
    },
    {
      url: "https://images.unsplash.com/photo-1583391733956-3c840c6e2b97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      title: "Festive Collection",
      description: "Perfect for special occasions"
    }
  ];

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const features = [
    {
      icon: <Camera className="w-8 h-8" />,
      title: "AI-Powered Try-On",
      description: "Upload your photo and see how any saree looks on you instantly"
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Multiple Poses",
      description: "View yourself in front, side, and back poses for complete preview"
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: "Extensive Catalog",
      description: "Browse thousands of sarees from traditional to modern styles"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Save Favorites",
      description: "Keep track of your favorite looks and share with friends"
    }
  ];

  const stats = [
    { number: "10K+", label: "Happy Users" },
    { number: "50K+", label: "Try-Ons Created" },
    { number: "500+", label: "Saree Designs" },
    { number: "99%", label: "Satisfaction Rate" }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      location: "Mumbai",
      text: "This app is amazing! I could see exactly how the saree would look before buying. Saved me so much time and money!",
      rating: 5
    },
    {
      name: "Anita Reddy",
      location: "Bangalore",
      text: "The AI is so accurate. I love how I can try different poses and see the complete look. Highly recommended!",
      rating: 5
    },
    {
      name: "Meera Patel",
      location: "Delhi",
      text: "Perfect for someone like me who shops online. Now I can confidently buy sarees knowing how they'll look on me.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <Sparkles className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold text-white">SareeAI</span>
            </motion.div>
            
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors">How It Works</a>
              <a href="#testimonials" className="text-white/80 hover:text-white transition-colors">Reviews</a>
            </div>
            
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate('/tryon')}
              className="btn-primary"
            >
              Try Now
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.h1 
                  className="heading-large"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Virtual Saree Try-On
                </motion.h1>
                <motion.p 
                  className="text-body text-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Experience the future of saree shopping with AI-powered virtual try-on. 
                  See how any saree looks on you in multiple poses before you buy!
                </motion.p>
              </div>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <button
                  onClick={() => navigate('/tryon')}
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <span>Start Virtual Try-On</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => navigate('/catalog')}
                  className="btn-secondary flex items-center justify-center space-x-2"
                >
                  <span>Browse Catalog</span>
                  <ShoppingBag className="w-5 h-5" />
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{stat.number}</div>
                    <div className="text-sm text-gray-300">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Content - Carousel */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                {carouselImages.map((image, index) => (
                  <motion.div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                      <div className="absolute bottom-8 left-8 text-white">
                        <h3 className="text-xl font-semibold mb-2">{image.title}</h3>
                        <p className="text-white/80">{image.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Carousel indicators */}
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-yellow-400' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="heading-medium">Powerful Features</h2>
            <p className="text-body max-w-2xl mx-auto">
              Our AI-powered platform offers everything you need for the perfect saree shopping experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="card text-center"
              >
                <div className="mb-4 text-yellow-400 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="heading-small text-lg">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="heading-medium">How It Works</h2>
            <p className="text-body max-w-2xl mx-auto">
              Get your perfect saree look in just three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Your Photo",
                description: "Take or upload a clear photo of yourself in front, side, or back pose"
              },
              {
                step: "02",
                title: "Choose Your Saree",
                description: "Select from our catalog or upload your own saree design components"
              },
              {
                step: "03",
                title: "See the Magic",
                description: "Our AI instantly shows you how the saree looks on you in multiple poses"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="card text-center relative"
              >
                <div className="text-6xl font-bold text-yellow-400/20 mb-4">{step.step}</div>
                <h3 className="heading-small text-lg mb-4">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
                
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="w-8 h-8 text-yellow-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="heading-medium">What Our Users Say</h2>
            <p className="text-body max-w-2xl mx-auto">
              Join thousands of satisfied customers who love our virtual try-on experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="card"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.location}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-800 to-indigo-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="heading-medium mb-6">Ready to Transform Your Saree Shopping?</h2>
            <p className="text-body mb-8 text-xl">
              Join thousands who are already experiencing the future of fashion with AI-powered virtual try-on
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/tryon')}
                className="btn-primary text-lg px-8 py-4"
              >
                Start Virtual Try-On Now
              </button>
              <button
                onClick={() => navigate('/catalog')}
                className="btn-outline text-lg px-8 py-4"
              >
                Browse Saree Collection
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-black/40 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <span className="text-xl font-bold text-white">SareeAI</span>
            </div>
            
            <div className="flex space-x-8">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; 2025 SareeAI. All rights reserved. Experience the future of fashion.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;