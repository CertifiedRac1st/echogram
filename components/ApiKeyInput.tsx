
import React, { useState } from 'react';
import Spinner from './Spinner';

interface ApiKeyInputProps {
  onSetApiKey: (apiKey: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSetApiKey, error, isLoading }) => {
  const [localApiKey, setLocalApiKey] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLoading) {
      onSetApiKey(localApiKey);
    }
  };

  return (
    <section className="w-full max-w-md bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1">
            Enter Your Gemini API Key
          </label>
          <input
            type="password"
            id="apiKey"
            name="apiKey"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500"
            placeholder="Enter your API Key"
            required
            aria-describedby="apiKey-description"
            disabled={isLoading}
          />
        </div>

        <p id="apiKey-description" className="text-xs text-gray-400 mt-2">
          Your API key is used directly by your browser to communicate with the Gemini API and is not stored by this application. It will be forgotten when you close this tab or refresh the page.
        </p>

        {error && (
          <div className="bg-red-700/50 border border-red-600 text-red-200 px-3 py-2.5 rounded-md text-sm" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !localApiKey.trim()}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-75 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Set API Key and Continue"
        >
          {isLoading ? (
            <>
              <Spinner />
              <span className="ml-2">Validating...</span>
            </>
          ) : (
            "Set API Key & Continue"
          )}
        </button>
      </form>
    </section>
  );
};

export default ApiKeyInput;
