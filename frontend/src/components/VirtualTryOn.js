import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Camera,
  Sparkles,
  ArrowLeft,
  Download,
  Heart,
  Share2,
  RotateCw,
  User,
  Palette,
  Shirt,
  ChevronDown,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VirtualTryOn = () => {
  const navigate = useNavigate();
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  
  // Form data
  const [sareeBody, setSareeBody] = useState(null);
  const [sareePallu, setSareePallu] = useState(null);
  const [sareeBorder, setSareeBorder] = useState(null);
  const [blouseStyle, setBlouseStyle] = useState('traditional');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
  
  // Results - now storing both front and side view results
  const [tryOnResults, setTryOnResults] = useState({
    front: null,
    side: null
  });

  const poseOptions = [
    { value: 'front', label: 'Front View', description: 'Classic front-facing pose' },
    { value: 'side', label: 'Side View', description: 'Elegant side profile' }
  ];

  const blouseOptions = [
    { value: 'traditional', label: 'Traditional', description: 'Classic fitted blouse' },
    { value: 'modern', label: 'Modern', description: 'Contemporary cut' },
    { value: 'sleeveless', label: 'Sleeveless', description: 'Modern sleeveless design' },
    { value: 'full_sleeve', label: 'Full Sleeve', description: 'Elegant full sleeves' }
  ];

  // File upload handlers
  const onSareeBodyDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSareeBody({
          file,
          preview: reader.result,
          base64: reader.result.split(',')[1]
        });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const onSareePalluDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSareePallu({
          file,
          preview: reader.result,
          base64: reader.result.split(',')[1]
        });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const onSareeBorderDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSareeBorder({
          file,
          preview: reader.result,
          base64: reader.result.split(',')[1]
        });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const sareeBodyDropzone = useDropzone({
    onDrop: onSareeBodyDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1
  });

  const sareePalluDropzone = useDropzone({
    onDrop: onSareePalluDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1
  });

  const sareeBorderDropzone = useDropzone({
    onDrop: onSareeBorderDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1
  });

  // Navigation handlers
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validation
  const canProceedToStep2 = () => {
    return sareeBody !== null || selectedCatalogItem !== null;
  };

  const canGenerateResult = () => {
    return sareeBody !== null || selectedCatalogItem !== null;
  };

  // Generate virtual try-on for both front and side views
  const generateTryOn = async () => {
    if (!canGenerateResult()) {
      setError('Please upload saree images or select from catalog');
      return;
    }

    setIsLoading(true);
    setError('');
    setLoadingMessage('Preparing your saree design...');

    try {
      const poses = ['front', 'side'];
      const results = {};

      for (let i = 0; i < poses.length; i++) {
        const pose = poses[i];
        setLoadingMessage(`Generating ${pose} view... (${i + 1}/2)`);

        // Prepare request data
        const requestData = {
          saree_body_base64: sareeBody?.base64 || null,
          saree_pallu_base64: sareePallu?.base64 || null,
          saree_border_base64: sareeBorder?.base64 || null,
          saree_item_id: selectedCatalogItem?.id || null,
          pose_style: pose,
          blouse_style: blouseStyle
        };
        
        const response = await axios.post(`${API}/virtual-tryon`, requestData, {
          timeout: 120000 // 2 minutes timeout
        });

        if (response.data && response.data.result_image_base64) {
          results[pose] = {
            id: response.data.id,
            image: `data:image/png;base64,${response.data.result_image_base64}`,
            poseStyle: response.data.pose_style,
            blouseStyle: response.data.blouse_style
          };
        } else {
          throw new Error(`No result image received for ${pose} view`);
        }
      }

      setTryOnResults(results);
      setCurrentStep(3);
    } catch (error) {
      console.error('Try-on generation failed:', error);
      setError(
        error.response?.data?.detail || 
        error.message || 
        'Failed to generate try-on. Please try again.'
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Save to favorites
  const addToFavorites = async (pose) => {
    const result = tryOnResults[pose];
    if (!result) return;
    
    try {
      await axios.post(`${API}/favorites`, {
        tryon_id: result.id,
        user_id: 'demo_user' // In real app, this would be actual user ID
      });
      alert('Added to favorites!');
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      alert('Failed to add to favorites');
    }
  };

  // Download result
  const downloadResult = (pose) => {
    const result = tryOnResults[pose];
    if (!result) return;
    
    const link = document.createElement('a');
    link.href = result.image;
    link.download = `saree-tryon-${pose}-view-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset form
  const resetForm = () => {
    setCurrentStep(1);
    setSareeBody(null);
    setSareePallu(null);
    setSareeBorder(null);
    setSelectedCatalogItem(null);
    setTryOnResults({ front: null, side: null });
    setError('');
  };

  // Render upload zone
  const renderUploadZone = (dropzone, file, title, description) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`upload-zone ${dropzone.isDragActive ? 'dragover' : ''}`}
      {...dropzone.getRootProps()}
    >
      <input {...dropzone.getInputProps()} />
      
      {file ? (
        <div className="space-y-4">
          <div className="image-preview max-w-48 mx-auto">
            <img src={file.preview} alt="Preview" className="rounded-lg" />
            <div className="image-preview-overlay">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (title.includes('Body')) setSareeBody(null);
                  else if (title.includes('Pallu')) setSareePallu(null);
                  else if (title.includes('Border')) setSareeBorder(null);
                }}
                className="btn-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-center">
            <p className="text-green-400 flex items-center justify-center space-x-2">
              <Check className="w-4 h-4" />
              <span>{title} uploaded</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Upload className="w-12 h-12 text-white/60 mx-auto" />
          <div className="text-center">
            <p className="text-white font-medium">{title}</p>
            <p className="text-white/60 text-sm">{description}</p>
          </div>
          <p className="text-xs text-white/40 text-center">
            Click to browse or drag & drop
          </p>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="loading-overlay"
          >
            <div className="loading-content">
              <div className="loading-spinner-large" />
              <h3 className="text-xl font-semibold mb-2">Creating Your Virtual Try-On</h3>
              <p className="text-gray-300">{loadingMessage}</p>
              <div className="mt-4 text-sm text-gray-400">
                This may take up to 2 minutes...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <span className="text-xl font-bold text-white">Virtual Try-On</span>
              </div>
            </div>
            
            {/* Progress indicators */}
            <div className="hidden md:flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                    step === currentStep
                      ? 'bg-yellow-400 text-black'
                      : step < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {step < currentStep ? <Check className="w-4 h-4" /> : step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-300">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Upload Saree Components */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="heading-medium">Upload Your Saree</h2>
              <p className="text-body">
                Upload different parts of your saree to create the perfect virtual try-on
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {renderUploadZone(
                sareeBodyDropzone,
                sareeBody,
                'Saree Body',
                'Main saree fabric/pattern'
              )}
              
              {renderUploadZone(
                sareePalluDropzone,
                sareePallu,
                'Saree Pallu',
                'Decorative end piece (optional)'
              )}
              
              {renderUploadZone(
                sareeBorderDropzone,
                sareeBorder,
                'Saree Border',
                'Border design (optional)'
              )}
            </div>

            <div className="text-center">
              <button
                onClick={nextStep}
                disabled={!canProceedToStep2()}
                className={`btn-primary ${!canProceedToStep2() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Continue to Customization
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Customization Options */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="heading-medium">Customize Your Look</h2>
              <p className="text-body">
                Choose your preferred blouse style. We'll generate both front and side views for you!
              </p>
            </div>

            <div className="max-w-md mx-auto">
              {/* Blouse Style Selection */}
              <div className="card">
                <div className="flex items-center space-x-2 mb-4">
                  <Shirt className="w-5 h-5 text-yellow-400" />
                  <h3 className="heading-small text-lg">Blouse Style</h3>
                </div>
                
                <div className="space-y-3">
                  {blouseOptions.map((option) => (
                    <motion.label
                      key={option.value}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        blouseStyle === option.value
                          ? 'bg-purple-600/30 border-2 border-purple-400'
                          : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        type="radio"
                        name="blouse"
                        value={option.value}
                        checked={blouseStyle === option.value}
                        onChange={(e) => setBlouseStyle(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white">{option.label}</div>
                        <div className="text-sm text-gray-300">{option.description}</div>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center space-x-4">
              <button onClick={prevStep} className="btn-secondary">
                Back
              </button>
              <button
                onClick={generateTryOn}
                disabled={!canGenerateResult()}
                className={`btn-primary ${!canGenerateResult() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Virtual Try-On
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Results */}
        {currentStep === 3 && tryOnResult && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="heading-medium">Your Virtual Try-On Result</h2>
              <p className="text-body">
                Here's how the saree looks on you! Save, share, or try another combination.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="card">
                <div className="image-preview">
                  <img
                    src={tryOnResult.image}
                    alt="Virtual Try-On Result"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Pose:</span> {poseOptions.find(p => p.value === tryOnResult.poseStyle)?.label}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Blouse:</span> {blouseOptions.find(b => b.value === tryOnResult.blouseStyle)?.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={addToFavorites}
                className="btn-secondary flex items-center space-x-2"
              >
                <Heart className="w-4 h-4" />
                <span>Save to Favorites</span>
              </button>
              
              <button
                onClick={downloadResult}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              
              <button
                onClick={() => {
                  if (navigator.share && navigator.canShare) {
                    navigator.share({
                      title: 'My Virtual Saree Try-On',
                      text: 'Check out how this saree looks on me!',
                      files: [new File([tryOnResult.image], 'saree-tryon.png', { type: 'image/png' })]
                    });
                  } else {
                    // Fallback - copy image to clipboard or show share dialog
                    alert('Sharing feature coming soon!');
                  }
                }}
                className="btn-secondary flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              
              <button
                onClick={resetForm}
                className="btn-primary flex items-center space-x-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>Try Another</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VirtualTryOn;