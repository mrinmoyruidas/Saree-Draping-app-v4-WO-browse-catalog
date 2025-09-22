import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Download,
  Share2,
  Trash2,
  Camera,
  Star,
  Calendar,
  Grid3X3,
  List,
  Filter,
  Search,
  X
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Favorites = () => {
  const navigate = useNavigate();
  
  // State management
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'pose'

  // Sample favorites data (in a real app, this would come from backend)
  const sampleFavorites = [
    {
      id: '1',
      result_image_base64: '',
      pose_style: 'front',
      blouse_style: 'traditional',
      saree_details: {
        has_body: true,
        has_pallu: true,
        has_border: true,
        saree_item_id: null
      },
      timestamp: new Date('2025-01-10T10:00:00Z'),
      is_favorite: true,
      user_id: 'demo_user'
    },
    {
      id: '2',
      result_image_base64: '',
      pose_style: 'side',
      blouse_style: 'modern',
      saree_details: {
        has_body: true,
        has_pallu: false,
        has_border: true,
        saree_item_id: '1'
      },
      timestamp: new Date('2025-01-09T15:30:00Z'),
      is_favorite: true,
      user_id: 'demo_user'
    },
    {
      id: '3',
      result_image_base64: '',
      pose_style: 'back',
      blouse_style: 'sleeveless',
      saree_details: {
        has_body: true,
        has_pallu: true,
        has_border: false,
        saree_item_id: null
      },
      timestamp: new Date('2025-01-08T12:45:00Z'),
      is_favorite: true,
      user_id: 'demo_user'
    }
  ];

  // Fetch user favorites
  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/favorites/demo_user`);
      if (response.data && response.data.length > 0) {
        setFavorites(response.data);
        setFilteredFavorites(response.data);
      } else {
        // Use sample data if no data from backend
        setFavorites(sampleFavorites);
        setFilteredFavorites(sampleFavorites);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      // Fallback to sample data
      setFavorites(sampleFavorites);
      setFilteredFavorites(sampleFavorites);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Filter and sort favorites
  useEffect(() => {
    let filtered = favorites;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(fav =>
        fav.pose_style.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fav.blouse_style.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'pose':
          return a.pose_style.localeCompare(b.pose_style);
        default:
          return 0;
      }
    });

    setFilteredFavorites(filtered);
  }, [favorites, searchQuery, sortBy]);

  // Remove from favorites
  const removeFromFavorites = async (favoriteId) => {
    try {
      await axios.delete(`${API}/favorites/${favoriteId}`);
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      setSelectedItems(prev => prev.filter(id => id !== favoriteId));
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      alert('Failed to remove from favorites');
    }
  };

  // Download image
  const downloadImage = (favorite) => {
    const link = document.createElement('a');
    const imageData = favorite.result_image_base64 
      ? `data:image/png;base64,${favorite.result_image_base64}`
      : getPlaceholderImage(favorite.pose_style);
    
    link.href = imageData;
    link.download = `saree-tryon-${favorite.pose_style}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk actions
  const removeSelectedItems = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      await Promise.all(
        selectedItems.map(id => axios.delete(`${API}/favorites/${id}`))
      );
      setFavorites(prev => prev.filter(fav => !selectedItems.includes(fav.id)));
      setSelectedItems([]);
    } catch (error) {
      console.error('Failed to remove selected items:', error);
      alert('Failed to remove selected items');
    }
  };

  const downloadSelectedItems = () => {
    selectedItems.forEach(id => {
      const favorite = favorites.find(fav => fav.id === id);
      if (favorite) {
        downloadImage(favorite);
      }
    });
  };

  // Toggle item selection
  const toggleItemSelection = (id) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Select all/none
  const toggleSelectAll = () => {
    setSelectedItems(
      selectedItems.length === filteredFavorites.length
        ? []
        : filteredFavorites.map(fav => fav.id)
    );
  };

  // Get placeholder image based on pose
  const getPlaceholderImage = (pose) => {
    const poseMap = {
      front: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      side: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      back: 'https://images.unsplash.com/photo-1583391733956-3c840c6e2b97?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    };
    return poseMap[pose] || poseMap.front;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                <Heart className="w-6 h-6 text-yellow-400" />
                <span className="text-xl font-bold text-white">My Favorites</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Bulk actions */}
              {selectedItems.length > 0 && (
                <div className="flex items-center space-x-2 bg-purple-600/20 rounded-lg px-4 py-2">
                  <span className="text-sm text-white">{selectedItems.length} selected</span>
                  <button
                    onClick={downloadSelectedItems}
                    className="btn-secondary p-2"
                    title="Download selected"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={removeSelectedItems}
                    className="btn-secondary p-2 text-red-400 hover:text-red-300"
                    title="Remove selected"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

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
                New Try-On
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-10"
              />
            </div>

            {/* Sort */}
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="pose">Group by Pose</option>
              </select>

              {/* Select all toggle */}
              {filteredFavorites.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="btn-secondary whitespace-nowrap"
                >
                  {selectedItems.length === filteredFavorites.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-white/80">
            {filteredFavorites.length} favorite{filteredFavorites.length !== 1 ? 's' : ''}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="loading-spinner-large mx-auto mb-4" />
            <p className="text-white/80">Loading your favorites...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredFavorites.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? 'No favorites found' : 'No favorites yet'}
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start creating virtual try-ons and save your favorites!'
              }
            </p>
            <button
              onClick={() => navigate('/tryon')}
              className="btn-primary"
            >
              <Camera className="w-4 h-4 mr-2" />
              Create Your First Try-On
            </button>
          </div>
        )}

        {/* Favorites grid/list */}
        {!loading && filteredFavorites.length > 0 && (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-6'
          }>
            {filteredFavorites.map((favorite, index) => (
              <motion.div
                key={favorite.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`card relative ${viewMode === 'list' ? 'flex space-x-6' : ''} ${
                  selectedItems.includes(favorite.id) ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                {/* Selection checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(favorite.id)}
                    onChange={() => toggleItemSelection(favorite.id)}
                    className="w-5 h-5 rounded border-2 border-white/20 bg-black/20 text-yellow-400 focus:ring-yellow-400"
                  />
                </div>

                {/* Image */}
                <div className={`${viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'aspect-[3/4]'} relative mb-4 rounded-lg overflow-hidden`}>
                  <img
                    src={favorite.result_image_base64 
                      ? `data:image/png;base64,${favorite.result_image_base64}`
                      : getPlaceholderImage(favorite.pose_style)
                    }
                    alt={`${favorite.pose_style} pose virtual try-on`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      onClick={() => downloadImage(favorite)}
                      className="btn-secondary p-2"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'My Virtual Saree Try-On',
                            text: `Check out this ${favorite.pose_style} view saree try-on!`
                          });
                        } else {
                          alert('Sharing feature coming soon!');
                        }
                      }}
                      className="btn-secondary p-2"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromFavorites(favorite.id)}
                      className="btn-secondary p-2 text-red-400 hover:text-red-300"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs bg-purple-600/30 text-purple-200 px-2 py-1 rounded-full capitalize">
                        {favorite.pose_style} View
                      </span>
                      <span className="text-xs bg-white/10 text-white px-2 py-1 rounded-full capitalize">
                        {favorite.blouse_style} Blouse
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(favorite.timestamp)}</span>
                    </div>
                  </div>

                  {/* Saree details */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-300">
                      Components: {[
                        favorite.saree_details.has_body && 'Body',
                        favorite.saree_details.has_pallu && 'Pallu',
                        favorite.saree_details.has_border && 'Border'
                      ].filter(Boolean).join(', ') || 'Catalog Item'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadImage(favorite)}
                      className="btn-secondary flex-1 py-2 text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => removeFromFavorites(favorite.id)}
                      className="btn-secondary p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
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

export default Favorites;