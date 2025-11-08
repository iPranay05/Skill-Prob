'use client';

import { useState } from 'react';

interface ReferralLinkSharingProps {
  referralCode: string;
}

export default function ReferralLinkSharing({ referralCode }: ReferralLinkSharingProps) {
  const [copied, setCopied] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'short' | 'full'>('short');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://skillprobe.com';

  const referralLinks = {
    short: `${baseUrl}/r/${referralCode}`,
    full: `${baseUrl}/auth/register?ref=${referralCode}`
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers or when clipboard API is not available
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        // Use the legacy method as fallback
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error('Copy command failed');
        }
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        // Show user a message to copy manually
        alert(`Please copy this manually: ${text}`);
      }
    }
  };

  const shareOnSocial = (platform: string) => {
    const link = referralLinks.short;
    const message = `Join me on Skill Probe and start your learning journey! Use my referral link to get started: ${link}`;

    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Join me on Skill Probe!')}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`
    };

    if (urls[platform as keyof typeof urls]) {
      window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Share Your Referral Link</h3>

      {/* Link Format Toggle */}
      <div className="mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedFormat('short')}
            className={`px-3 py-1 text-sm rounded ${selectedFormat === 'short'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Short Link
          </button>
          <button
            onClick={() => setSelectedFormat('full')}
            className={`px-3 py-1 text-sm rounded ${selectedFormat === 'full'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Full Link
          </button>
        </div>
      </div>

      {/* Referral Code Display */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Referral Code</label>
        <div className="flex items-center space-x-2">
          <code className="bg-gray-100 px-3 py-2 rounded text-lg font-mono flex-1">
            {referralCode}
          </code>
          <button
            onClick={() => copyToClipboard(referralCode)}
            className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700"
          >
            Copy Code
          </button>
        </div>
      </div>

      {/* Referral Link Display */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Referral Link</label>
        <div className="flex items-center space-x-2">
          <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono flex-1 truncate">
            {referralLinks[selectedFormat]}
          </code>
          <button
            onClick={() => copyToClipboard(referralLinks[selectedFormat])}
            className={`px-3 py-2 rounded transition-colors ${copied
              ? 'bg-secondary text-white'
              : 'bg-info text-white hover:bg-blue-700'
              }`}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Social Sharing */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Share on Social Media</label>
        <div className="flex space-x-3">
          <button
            onClick={() => shareOnSocial('whatsapp')}
            className="flex items-center space-x-2 bg-secondary-light text-white px-3 py-2 rounded hover:bg-secondary"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 5.703" />
            </svg>
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => shareOnSocial('telegram')}
            className="flex items-center space-x-2 bg-info text-white px-3 py-2 rounded hover:bg-info"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            <span>Telegram</span>
          </button>

          <button
            onClick={() => shareOnSocial('twitter')}
            className="flex items-center space-x-2 bg-sky-500 text-white px-3 py-2 rounded hover:bg-sky-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
            <span>Twitter</span>
          </button>

          <button
            onClick={() => shareOnSocial('linkedin')}
            className="flex items-center space-x-2 bg-blue-700 text-white px-3 py-2 rounded hover:bg-blue-800"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <span>LinkedIn</span>
          </button>
        </div>
      </div>

      {/* Quick Share Templates */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Share Messages</h4>
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-700 mb-2">
              "              &quot;🚀 Join me on Skill Probe and unlock your potential! Use my referral link to get started: {referralLinks.short}&quot;"
            </p>
            <button
              onClick={() => copyToClipboard(`🚀 Join me on Skill Probe and unlock your potential! Use my referral link to get started: ${referralLinks.short}`)}
              className="text-xs text-info hover:text-blue-800"
            >
              Copy Message
            </button>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-700 mb-2">
              "              &quot;📚 Discover amazing courses on Skill Probe! Join using my link and start learning today: {referralLinks.short}&quot;
            </p>
            <button
              onClick={() => copyToClipboard(`📚 Discover amazing courses on Skill Probe! Join using my link and start learning today: ${referralLinks.short}`)}
              className="text-xs text-info hover:text-blue-800"
            >
              Copy Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}