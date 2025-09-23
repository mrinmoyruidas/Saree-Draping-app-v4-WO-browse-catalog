import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Filter,
  Grid3X3,
  List,
  Heart,
  ShoppingBag,
  Star,
  ChevronDown,
  X,
  Palette,
  Sparkles,
  Camera
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SareeCatalog = () => {
  const navigate = useNavigate();
  
  // State management
  const [sarees, setSarees] = useState([]);
  const [filteredSarees, setFilteredSarees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSaree, setSelectedSaree] = useState(null);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'traditional', label: 'Traditional' },
    { value: 'modern', label: 'Modern' },
    { value: 'festive', label: 'Festive' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'casual', label: 'Casual' },
    { value: 'party', label: 'Party' }
  ];

  const colors = [
    { value: 'all', label: 'All Colors' },
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'pink', label: 'Pink' },
    { value: 'purple', label: 'Purple' },
    { value: 'orange', label: 'Orange' },
    { value: 'black', label: 'Black' },
    { value: 'white', label: 'White' },
    { value: 'gold', label: 'Gold' }
  ];

  // Sample catalog data (in a real app, this would come from backend)
  const sampleSarees = [
    {
      id: '1',
      name: 'Traditional Silk Saree',
      description: 'Beautiful traditional silk saree with golden border and intricate patterns',
      image_base64: '',
      category: 'traditional',
      color: 'red',
      pattern: 'floral',
      price: 2500,
      rating: 4.8,
      reviews: 124
    },
    {
      id: '2',
      name: 'Modern Georgette Saree',
      description: 'Elegant modern georgette saree perfect for office and parties',
      image_base64: '',
      category: 'modern',
      color: 'blue',
      pattern: 'geometric',
      price: 1800,
      rating: 4.6,
      reviews: 89
    },
    {
      id: '3',
      name: 'Festive Banarasi Saree',
      description: 'Royal Banarasi saree with rich gold work for special occasions',
      image_base64: '',
      category: 'festive',
      color: 'purple',
      pattern: 'brocade',
      price: 4500,
      rating: 4.9,
      reviews: 203
    },
    {
      id: '4',
      name: 'Wedding Lehenga Saree',
      description: 'Stunning wedding lehenga saree with heavy embroidery',
      image_base64: '',
      category: 'wedding',
      color: 'pink',
      pattern: 'embroidered',
      price: 8500,
      rating: 5.0,
      reviews: 67
    },
    {
      id: '5',
      name: 'Casual Cotton Saree',
      description: 'Comfortable cotton saree for daily wear',
      image_base64: '',
      category: 'casual',
      color: 'green',
      pattern: 'printed',
      price: 800,
      rating: 4.4,
      reviews: 156
    },
    {
      id: '6',
      name: 'Party Sequin Saree',
      description: 'Glamorous sequin saree perfect for parties and celebrations',
      image_base64: '',
      category: 'party',
      color: 'black',
      pattern: 'sequin',
      price: 3200,
      rating: 4.7,
      reviews: 91
    }
  ];

  // Fetch sarees from backend
  const fetchSarees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/saree-catalog`);
      if (response.data && response.data.length > 0) {
        setSarees(response.data);
        setFilteredSarees(response.data);
      } else {
        // Use sample data if no data from backend
        setSarees(sampleSarees);
        setFilteredSarees(sampleSarees);
      }
    } catch (error) {
      console.error('Failed to fetch sarees:', error);
      // Fallback to sample data
      setSarees(sampleSarees);
      setFilteredSarees(sampleSarees);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSarees();
  }, []);

  // Filter sarees based on search and filters
  useEffect(() => {
    let filtered = sarees;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(saree =>
        saree.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        saree.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        saree.pattern.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(saree => saree.category === selectedCategory);
    }

    // Color filter
    if (selectedColor !== 'all') {
      filtered = filtered.filter(saree => saree.color === selectedColor);
    }

    setFilteredSarees(filtered);
  }, [sarees, searchQuery, selectedCategory, selectedColor]);

  // Try on with selected saree
  const tryOnSaree = (saree) => {
    // Navigate to try-on page with pre-selected saree
    navigate('/tryon', { state: { selectedSaree: saree } });
  };

  // Add to favorites
  const addToFavorites = async (saree) => {
    try {
      // In a real app, this would add the saree to user's favorite sarees
      console.log('Adding to favorites:', saree);
      alert('Added to favorites!');
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      alert('Failed to add to favorites');
    }
  };

  // Get placeholder image based on color
  const getPlaceholderImage = (color, category) => {
    const colorMap = {
      red: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      blue: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      green: 'https://images.unsplash.com/photo-1583391733956-3c840c6e2b97?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      purple: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      pink: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      black: 'https://images.unsplash.com/photo-1583391733956-3c840c6e2b97?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    };
    return colorMap[color] || colorMap.red;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="btn-secondary p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-6 h-6 text-yellow-400" />
                <span className="text-xl font-bold text-white">Saree Catalog</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* View mode toggle */}
              <div className="hidden md:flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-white/60'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-white/60'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => navigate('/tryon')}
                className="btn-primary"
              >
                <Camera className="w-4 h-4 mr-2" />
                Virtual Try-On
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-responsive py-6 md:py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                placeholder="Search sarees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-10"
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Category filter */}
                  <div>
                    <label className="form-label">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="form-select"
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Color filter */}
                  <div>
                    <label className="form-label">Color</label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="form-select"
                    >
                      {colors.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-white/80">
            Showing {filteredSarees.length} saree{filteredSarees.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="loading-spinner-large mx-auto mb-4" />
            <p className="text-white/80">Loading sarees...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredSarees.length === 0 && (
          <div className="text-center py-12">
            <Palette className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No sarees found</h3>
            <p className="text-white/60 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedColor('all');
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Saree grid/list */}
        {!loading && filteredSarees.length > 0 && (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-6'
          }>
            {filteredSarees.map((saree, index) => (
              <motion.div
                key={saree.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`card ${viewMode === 'list' ? 'flex space-x-6' : ''}`}
              >
                {/* Image */}
                <div className={`${viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'aspect-[3/4]'} relative mb-4 rounded-lg overflow-hidden`}>
                  <img
                    src={saree.image_base64 ? `data:image/jpeg;base64,${saree.image_base64}` : getPlaceholderImage(saree.color, saree.category)}
                    alt={saree.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      onClick={() => tryOnSaree(saree)}
                      className="btn-primary py-2 px-4 text-sm"
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Try On
                    </button>
                    <button
                      onClick={() => addToFavorites(saree)}
                      className="btn-secondary p-2"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="mb-2">
                    <h3 className="font-semibold text-white mb-1">{saree.name}</h3>
                    <p className="text-sm text-gray-300 line-clamp-2">{saree.description}</p>
                  </div>

                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs bg-purple-600/30 text-purple-200 px-2 py-1 rounded-full">
                      {saree.category}
                    </span>
                    <span className="text-xs bg-white/10 text-white px-2 py-1 rounded-full">
                      {saree.color}
                    </span>
                  </div>

                  {/* Rating and price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-white">
                        {saree.rating} ({saree.reviews})
                      </span>
                    </div>
                    <span className="font-semibold text-yellow-400">
                      ₹{saree.price?.toLocaleString() || 'Price on request'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => tryOnSaree(saree)}
                      className="btn-primary flex-1 py-2 text-sm"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Virtual Try-On
                    </button>
                    <button
                      onClick={() => addToFavorites(saree)}
                      className="btn-secondary p-2"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SareeCatalog;