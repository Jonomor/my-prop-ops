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
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/blog/posts/${slug}`);
      setPost(res.data);
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
        <div className="flex items-center gap-3 mb-6">
          <Badge variant="secondary">{post.category}</Badge>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(post.published_at)}
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {post.read_time} min read
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{post.title}</h1>
        
        {/* Excerpt */}
        <p className="text-xl text-muted-foreground mb-8">{post.excerpt}</p>

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
          className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
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
