
import React, { useState, useCallback, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import GeneratedImageDisplay from './components/GeneratedImageDisplay';
import ApiKeyInput from './components/ApiKeyInput'; // New component for API key input
import Spinner from './components/Spinner';
import { generateImageWithPromptFromImage, fileToBase64, initializeUserProvidedClient, isClientInitialized } from './services/GeminiService';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeySet, setIsKeySet] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isKeyValidating, setIsKeyValidating] = useState<boolean>(false);

  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if client was somehow initialized previously (e.g. hot reload with key already set)
    // This is more of a dev-time convenience, in prod it'll always start false.
    if (isClientInitialized()) {
      setIsKeySet(true);
    }
  }, []);

  const handleApiKeySubmit = async (submittedKey: string) => {
    if (!submittedKey.trim()) {
      setApiKeyError("API Key cannot be empty.");
      setIsKeySet(false);
      return;
    }
    setIsKeyValidating(true);
    setApiKeyError(null);
    try {
      await initializeUserProvidedClient(submittedKey);
      setApiKey(submittedKey); // Store for potential re-init, though service holds the client
      setIsKeySet(true);
      setError(null); // Clear previous app errors if any
    } catch (err) {
      console.error("API Key Initialization failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setApiKeyError(`Invalid API Key or setup failed: ${errorMessage}. Please check your key and try again.`);
      setIsKeySet(false);
    } finally {
      setIsKeyValidating(false);
    }
  };

  const handleImageUpload = useCallback((file: File) => {
    setUploadedImageFile(file);
    setError(null);
    setGeneratedImageUrl(null);
    setGeneratedPrompt(null);
    const objectUrl = URL.createObjectURL(file);
    setUploadedImagePreview(objectUrl);
  }, []);

  useEffect(() => {
    return () => {
      if (uploadedImagePreview && uploadedImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedImagePreview);
      }
    };
  }, [uploadedImagePreview]);

  const handleGenerate = async () => {
    if (!uploadedImageFile) {
      setError("Please upload an image first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    setGeneratedPrompt(null);

    try {
      const base64Image = await fileToBase64(uploadedImageFile);
      const result = await generateImageWithPromptFromImage(base64Image, uploadedImageFile.type);
      setGeneratedImageUrl(result.imageUrl);
      setGeneratedPrompt(result.finalPrompt);
    } catch (err) {
      console.error("Generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during image generation.";
      if (errorMessage.includes("API Key") || errorMessage.includes("client is not initialized")) {
         setError(`Generation Failed: API Key issue. ${errorMessage}. Please try setting your API key again.`);
         setIsKeySet(false); // Force re-entry of API key
      } else {
        setError(`Generation Failed: ${errorMessage}.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReselectImage = () => {
    setUploadedImageFile(null);
    setUploadedImagePreview(null);
    setGeneratedImageUrl(null);
    setGeneratedPrompt(null);
    setError(null);
    setIsLoading(false);
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const handleChangeApiKey = () => {
    setIsKeySet(false);
    setApiKey('');
    setApiKeyError(null);
    // Optionally, you might want to clear other app state here as well
    setUploadedImageFile(null);
    setUploadedImagePreview(null);
    setGeneratedImageUrl(null);
    setGeneratedPrompt(null);
    setError(null);
  };

  if (!isKeySet) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 flex flex-col items-center justify-center selection:bg-purple-500 selection:text-white">
        <header className="mb-8 md:mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
            Echogram
          </h1>
           <p className="text-gray-400 mt-2 text-base sm:text-lg">Transform your images with a touch of AI magic</p>
        </header>
        <ApiKeyInput 
          onSetApiKey={handleApiKeySubmit} 
          error={apiKeyError} 
          isLoading={isKeyValidating} 
        />
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by Google Gemini AI</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 flex flex-col items-center selection:bg-purple-500 selection:text-white">
      <header className="mb-8 md:mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
          Echogram
        </h1>
        <p className="text-gray-400 mt-2 text-base sm:text-lg">Transform your images with a touch of AI magic</p>
      </header>

      <main className="w-full max-w-5xl space-y-8">
         <div className="text-right mb-4">
            <button 
              onClick={handleChangeApiKey} 
              className="text-sm text-purple-400 hover:text-purple-300 underline"
              aria-label="Change API Key"
            >
              Change API Key
            </button>
          </div>

        <section className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl transition-all duration-300 hover:shadow-purple-500/30">
          {!uploadedImagePreview && <ImageUpload onImageUpload={handleImageUpload} />}
          
          {uploadedImagePreview && (
            <div className="mt-6 text-center">
              <h3 className="text-xl font-semibold mb-4 text-gray-200">Your Image:</h3>
              <div className="flex justify-center mb-6">
                <img 
                  src={uploadedImagePreview} 
                  alt="Uploaded preview" 
                  className="max-w-xs mx-auto rounded-lg shadow-lg max-h-72 object-contain border-2 border-gray-700"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                  onClick={handleGenerate} 
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-75 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto"
                  aria-label="Generate echo image"
                >
                  {isLoading && !generatedImageUrl ? (
                    <>
                      <Spinner />
                      <span className="ml-2">Generating...</span>
                    </>
                  ) : (
                    "Generate Echo Image"
                  )}
                </button>
                <button 
                  onClick={handleReselectImage} 
                  disabled={isLoading}
                  className="px-8 py-3 border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white font-medium rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  aria-label="Reselect image"
                >
                  Reselect Image
                </button>
              </div>
            </div>
          )}
        </section>

        {isLoading && !generatedImageUrl && (
          <div className="flex justify-center py-8">
            <div className="text-center">
              <Spinner />
              <p className="mt-2 text-gray-400">AI is thinking... this might take a moment.</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-800 border border-red-700 text-red-100 px-4 py-3 rounded-lg relative shadow-lg" role="alert">
            <strong className="font-bold">Oops! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {generatedImageUrl && generatedPrompt && !isLoading && (
          <section className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl transition-all duration-300 hover:shadow-pink-500/30 mt-8">
            <GeneratedImageDisplay imageUrl={generatedImageUrl} prompt={generatedPrompt} />
          </section>
        )}
      </main>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Powered by Google Gemini AI</p>
        <p>Created by penguin</p>
        <p>&copy; {new Date().getFullYear()} Echogram. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
