import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { 
  Sparkles, 
  TrendingUp, 
  Home, 
  Users, 
  Wrench, 
  DollarSign,
  BarChart3,
  Lightbulb,
  Send,
  Loader2,
  Lock,
  RefreshCw,
  BrainCircuit,
  Building2,
  Target,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

const AIInsights = () => {
  const { api, currentOrg } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [planAllowsAI, setPlanAllowsAI] = useState(false);
  const [stats, setStats] = useState(null);
  const [insight, setInsight] = useState(null);
  const [insightType, setInsightType] = useState('general');
  const [customQuestion, setCustomQuestion] = useState('');

  const insightCategories = [
    { id: 'general', label: 'Executive Summary', icon: Sparkles, description: 'Overall portfolio health' },
    { id: 'occupancy', label: 'Occupancy Analysis', icon: Home, description: 'Vacancy trends & strategies' },
    { id: 'maintenance', label: 'Maintenance Insights', icon: Wrench, description: 'Proactive maintenance tips' },
    { id: 'revenue', label: 'Revenue Analysis', icon: DollarSign, description: 'Collection optimization' },
    { id: 'forecast', label: '3-Month Forecast', icon: TrendingUp, description: 'Future predictions' }
  ];

  useEffect(() => {
    if (currentOrg) {
      fetchInitialData();
    }
  }, [currentOrg]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [planRes, statsRes] = await Promise.all([
        api.get('/billing/subscription-status'),
        api.get('/ai/quick-stats')
      ]);
      
      const plan = planRes.data?.plan || 'free';
      setPlanAllowsAI(plan === 'pro');
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async (type) => {
    if (!planAllowsAI) {
      toast.error('AI Insights require Pro plan');
      return;
    }

    setGenerating(true);
    setInsightType(type);
    
    try {
      const res = await api.post('/ai/insights', {
        insight_type: type,
        question: type === 'custom' ? customQuestion : null
      });
      setInsight(res.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate insight');
    } finally {
      setGenerating(false);
    }
  };

  const askCustomQuestion = async () => {
    if (!customQuestion.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setGenerating(true);
    setInsightType('custom');
    
    try {
      const res = await api.post('/ai/insights', {
        insight_type: 'custom',
        question: customQuestion
      });
      setInsight(res.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to get answer');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6" data-testid="ai-insights-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
              <BrainCircuit className="w-8 h-8 text-primary" />
              AI-Powered Insights
            </h1>
            <p className="text-muted-foreground mt-1">
              Get intelligent analysis and recommendations for your portfolio
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by GPT-4
          </Badge>
        </div>

        {/* Plan Notice */}
        {!planAllowsAI && (
          <Card className="border-amber-500/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Lock className="w-8 h-8 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  AI Insights require Pro plan
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Upgrade to unlock AI-powered analysis, forecasting, and recommendations.
                </p>
              </div>
              <Button variant="outline" className="ml-auto" onClick={() => window.location.href = '/billing'}>
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Properties</p>
                    <p className="text-3xl font-bold">{stats.properties}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm">Occupancy</p>
                    <p className="text-3xl font-bold">{stats.occupancy_rate}%</p>
                  </div>
                  <Home className="w-8 h-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Monthly Revenue</p>
                    <p className="text-2xl font-bold">${(stats.monthly_revenue || 0).toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            <Card className={`bg-gradient-to-br ${stats.open_maintenance > 5 ? 'from-red-500 to-red-600' : 'from-amber-500 to-amber-600'} text-white`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${stats.open_maintenance > 5 ? 'text-red-100' : 'text-amber-100'} text-sm`}>Open Maintenance</p>
                    <p className="text-3xl font-bold">{stats.open_maintenance}</p>
                  </div>
                  <Wrench className={`w-8 h-8 ${stats.open_maintenance > 5 ? 'text-red-200' : 'text-amber-200'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Insight Categories */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Generate Insights
            </CardTitle>
            <CardDescription>Select a category to get AI-powered analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-3">
              {insightCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => generateInsight(cat.id)}
                  disabled={generating || !planAllowsAI}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 ${
                    insightType === cat.id && insight ? 'border-primary bg-primary/5' : 'border-border'
                  } ${!planAllowsAI ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  data-testid={`insight-btn-${cat.id}`}
                >
                  <cat.icon className="w-6 h-6 text-primary mb-2" />
                  <p className="font-medium text-sm">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ask Custom Question */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Ask AI Anything
            </CardTitle>
            <CardDescription>Get answers to specific questions about your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="e.g., Which property has the most maintenance issues? How can I reduce vacancy rates?"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                disabled={!planAllowsAI}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && askCustomQuestion()}
              />
              <Button 
                onClick={askCustomQuestion}
                disabled={generating || !planAllowsAI || !customQuestion.trim()}
              >
                {generating && insightType === 'custom' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Response */}
        {generating && (
          <Card className="border-primary/50">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <BrainCircuit className="w-12 h-12 text-primary" />
                  <div className="absolute -top-1 -right-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium">Analyzing your portfolio data...</p>
                  <p className="text-sm text-muted-foreground">This may take a few seconds</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {insight && !generating && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Analysis: {insightCategories.find(c => c.id === insightType)?.label || 'Custom Question'}
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateInsight(insightType)}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {insight.insight}
                </div>
              </div>
              
              {insight.metrics && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">Data analyzed:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{insight.metrics.total_properties} Properties</Badge>
                    <Badge variant="secondary">{insight.metrics.total_units} Units</Badge>
                    <Badge variant="secondary">{insight.metrics.active_tenants} Tenants</Badge>
                    <Badge variant="secondary">{insight.metrics.occupancy_rate}% Occupancy</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Demo Insights for Free/Standard users */}
        {!planAllowsAI && (
          <Card className="bg-muted/30 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-5 h-5" />
                Sample AI Insights (Preview)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <div className="p-4 bg-background/50 rounded-lg">
                  <p className="font-medium mb-2">Executive Summary</p>
                  <p className="text-sm">Your portfolio shows strong fundamentals with 92% occupancy. Key opportunities include addressing the 3 pending maintenance requests before they escalate, and implementing a rent increase strategy for units below market rate...</p>
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="text-sm">Upgrade to Pro to unlock full AI-powered insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AIInsights;
