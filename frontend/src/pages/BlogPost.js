import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import axios from 'axios';
import { 
  Building2, 
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://backend-production-0325.up.railway.app';

// Helper to update document head for SEO
const updateMetaTags = (post) => {
  if (!post) return;
  
  // Update title
  document.title = `${post.title} | MyPropOps Blog`;
  
  // Update or create meta description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    document.head.appendChild(metaDescription);
  }
  metaDescription.content = post.meta_description || post.excerpt || '';
  
  // Update or create meta keywords
  if (post.keywords && post.keywords.length > 0) {
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = post.keywords.join(', ');
  }
  
  // Update Open Graph tags
  const ogTags = {
    'og:title': post.title,
    'og:description': post.meta_description || post.excerpt || '',
    'og:type': 'article',
    'og:url': window.location.href,
    'article:published_time': post.published_at,
    'article:section': post.category
  };
  
  Object.entries(ogTags).forEach(([property, content]) => {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.content = content;
  });
  
  // Update Twitter tags
  const twitterTags = {
    'twitter:title': post.title,
    'twitter:description': post.meta_description || post.excerpt || ''
  };
  
  Object.entries(twitterTags).forEach(([name, content]) => {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = name;
      document.head.appendChild(tag);
    }
    tag.content = content;
  });
  
  // Add JSON-LD structured data for article
  let structuredData = document.querySelector('script[type="application/ld+json"][data-blog="true"]');
  if (!structuredData) {
    structuredData = document.createElement('script');
    structuredData.type = 'application/ld+json';
    structuredData.setAttribute('data-blog', 'true');
    document.head.appendChild(structuredData);
  }
  
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.meta_description || post.excerpt,
    "datePublished": post.published_at,
    "dateModified": post.updated_at || post.published_at,
    "author": {
      "@type": "Organization",
      "name": "MyPropOps"
    },
    "publisher": {
      "@type": "Organization",
      "name": "MyPropOps",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mypropops.com/logo512.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    },
    "articleSection": post.category,
    "wordCount": post.word_count || 1000,
    "keywords": post.keywords?.join(', ') || post.category
  };
  
  structuredData.textContent = JSON.stringify(articleSchema);
};

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
    
    // Cleanup function to restore default meta tags
    return () => {
      document.title = 'MyPropOps | Property Management Software';
    };
  }, [slug]);

  const fetchPost = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/blog/posts/${slug}`);
      setPost(res.data);
      updateMetaTags(res.data);
    } catch (error) {
      console.error('Failed to fetch blog post:', error);
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Skeleton className="h-10 w-32" />
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MyPropOps</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button>Start Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Back to blog */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-8">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Badge variant="secondary">{post.category}</Badge>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(post.published_at)}
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {post.read_time} min read
          </span>
          {post.word_count && (
            <span className="text-sm text-muted-foreground">
              {post.word_count.toLocaleString()} words
            </span>
          )}
        </div>

        {/* Title - H1 for SEO */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{post.title}</h1>
        
        {/* Excerpt */}
        <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
        
        {/* Keywords Tags */}
        {post.keywords && post.keywords.length > 0 && (
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {post.keywords.slice(0, 5).map((keyword, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        )}

        {/* Featured Image */}
        {post.image_url && (
          <img 
            src={post.image_url}
            alt={post.title}
            className="w-full h-auto rounded-xl mb-8"
          />
        )}

        {/* Content */}
        <div 
          className="blog-content prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-h1:text-3xl prose-h1:mt-10 prose-h1:mb-6 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4 prose-p:leading-relaxed prose-ul:my-4 prose-ul:pl-6 prose-ol:my-4 prose-ol:pl-6 prose-li:my-2 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-hr:my-8 prose-hr:border-border prose-img:rounded-lg prose-img:shadow-md prose-img:my-6 prose-strong:font-semibold prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        <style>{`
          .blog-content p {
            margin-bottom: 1rem;
            line-height: 1.75;
          }
          .blog-content h1, .blog-content h2, .blog-content h3 {
            margin-top: 2rem;
            margin-bottom: 1rem;
          }
          .blog-content ul, .blog-content ol {
            margin: 1rem 0;
            padding-left: 1.5rem;
          }
          .blog-content li {
            margin: 0.5rem 0;
          }
          .blog-content blockquote {
            margin: 1.5rem 0;
            padding: 1rem;
            background: hsl(var(--muted) / 0.3);
            border-radius: 0.5rem;
          }
          .blog-content hr {
            margin: 2rem 0;
          }
          .blog-content img {
            max-width: 100%;
            height: auto;
            margin: 1.5rem auto;
            display: block;
          }
          .blog-content mark {
            background-color: #fef08a;
            padding: 0.1em 0.2em;
            border-radius: 0.2em;
          }
        `}</style>

        {/* Share */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between flex-wrap gap-4">
          <p className="text-muted-foreground">Found this helpful? Share it!</p>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </article>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to simplify property management?</h2>
          <p className="text-muted-foreground mb-6">
            Join 500+ property managers who use MyPropOps to manage their properties.
          </p>
          <Link to="/register">
            <Button size="lg">Start Free Today</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-semibold">MyPropOps</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/blog" className="hover:text-foreground">Blog</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;
