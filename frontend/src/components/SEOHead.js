import { useEffect } from 'react';

export const SEOHead = ({ 
  title, 
  description, 
  canonical,
  ogImage = 'https://planettransfers.online/og-image.jpg',
  ogType = 'website',
  schema = null
}) => {
  const fullTitle = title && title.includes('Planet Transfers') ? title : `${title} | Planet Transfers`;
  const baseUrl = 'https://planettransfers.online';
  const canonicalUrl = canonical ? `${baseUrl}${canonical}` : baseUrl;

  useEffect(() => {
    // Set document title
    document.title = fullTitle;
    
    // Update or create meta tags
    const updateMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content || '');
    };
    
    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);
    
    // Primary Meta Tags
    updateMeta('description', description);
    
    // Open Graph
    updateMeta('og:type', ogType, true);
    updateMeta('og:url', canonicalUrl, true);
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', ogImage, true);
    updateMeta('og:site_name', 'Planet Transfers', true);
    
    // Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:url', canonicalUrl);
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);
    
    // Schema.org Structured Data
    if (schema) {
      let schemaScript = document.querySelector('script[data-schema="seo"]');
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.setAttribute('type', 'application/ld+json');
        schemaScript.setAttribute('data-schema', 'seo');
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    }
  }, [fullTitle, description, canonicalUrl, ogImage, ogType, schema]);

  return null;
};

export default SEOHead;
