import { Link } from 'react-router';
import { Brain, Calendar, Mail, Briefcase, Sparkles, CheckCircle } from 'lucide-react';
import ImageWithFallback from '../components/figma/ImageWithFallback';

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: 'Smart Scheduling',
      description: 'AI-powered scheduling that adapts to your lifestyle and personal needs',
      gradient: 'from-primary to-primary/80'
    },
    {
      icon: Calendar,
      title: 'Task Management',
      description: 'Intelligent task planning and prioritization for maximum productivity',
      gradient: 'from-primary/80 to-primary'
    },
    {
      icon: Briefcase,
      title: 'Job Finder',
      description: 'Discover opportunities tailored to your skills and schedule',
      gradient: 'from-primary to-primary-hover'
    },
    {
      icon: Mail,
      title: 'Email Automation',
      description: 'Smart email management with AI-powered summaries and actions',
      gradient: 'from-primary to-primary/80'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl relative">
              <Brain className="w-6 h-6 text-white" />
              <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              AllignAI
            </h1>
          </div>
          <div className="flex gap-4">
            <Link
              to="/login"
              className="px-6 py-2 rounded-xl text-primary hover:bg-card transition-all"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary/80 text-sm border border-primary/30">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Personal Productivity</span>
            </div>
            
            <h1 className="text-6xl font-bold leading-tight text-foreground">
              Your Intelligent{' '}
              <span className="bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
                Personal AI
              </span>{' '}
              Assistant
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Streamline your life with AI-powered scheduling, smart task management, 
              intelligent email assistance, and personalized productivity insights. Get more done with less stress.
            </p>

            <div className="flex gap-4">
              <Link
                to="/signup"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white text-lg shadow-xl hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 rounded-xl bg-card text-primary text-lg shadow-lg hover:shadow-xl transition-all border border-border"
              >
                Login
              </Link>
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary/80" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary/80" />
                <span>Free forever</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative bg-card/50 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-border">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1524591282491-edb48a0fca8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rcyUyMHN0dWR5JTIwbGlicmFyeSUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NzIxOTAxODR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Books and Study Materials"
                className="w-full rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-background/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Powered by <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">AI Intelligence</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to stay organized and productive
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-6 rounded-2xl bg-card shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 border border-border"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary via-primary/90 to-primary rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/80/20 backdrop-blur-sm"></div>
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl font-bold text-white">
                Ready to Transform Your Productivity?
              </h2>
              <p className="text-xl text-white/90">
                Join thousands of users who are already using AllignAI
              </p>
              <Link
                to="/signup"
                className="inline-block px-10 py-4 rounded-xl bg-white text-primary text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-background/30">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl relative">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              AllignAI
            </h3>
          </div>
          <p className="text-muted-foreground">
            Your intelligent personal productivity assistant
          </p>
          <p className="text-sm text-muted-foreground">
            © 2026 AllignAI. Empowering productivity for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
}