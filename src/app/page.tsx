'use client'

import Link from 'next/link'
import { useTranslation } from '@/i18n'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Hotel,
  BedDouble,
  Calendar,
  BarChart3,
  Shield,
  FileText,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  Building2,
  CreditCard,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react'

export default function HomePage() {
  const { t } = useTranslation()

  const features = [
    {
      icon: BedDouble,
      title: t('landing.features.roomManagement.title'),
      description: t('landing.features.roomManagement.description'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Calendar,
      title: t('landing.features.reservations.title'),
      description: t('landing.features.reservations.description'),
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: BarChart3,
      title: t('landing.features.dashboard.title'),
      description: t('landing.features.dashboard.description'),
      color: 'from-orange-500 to-amber-500',
    },
    {
      icon: Shield,
      title: t('landing.features.accessControl.title'),
      description: t('landing.features.accessControl.description'),
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: FileText,
      title: t('landing.features.reports.title'),
      description: t('landing.features.reports.description'),
      color: 'from-indigo-500 to-violet-500',
    },
    {
      icon: DollarSign,
      title: t('landing.features.financial.title'),
      description: t('landing.features.financial.description'),
      color: 'from-rose-500 to-red-500',
    },
  ]

  const workflow = [
    {
      step: '01',
      title: t('landing.workflow.step1.title'),
      description: t('landing.workflow.step1.description'),
      icon: Building2,
    },
    {
      step: '02',
      title: t('landing.workflow.step2.title'),
      description: t('landing.workflow.step2.description'),
      icon: Calendar,
    },
    {
      step: '03',
      title: t('landing.workflow.step3.title'),
      description: t('landing.workflow.step3.description'),
      icon: BarChart3,
    },
  ]

  const stats = [
    { value: '500+', label: t('landing.stats.hotels'), icon: Hotel },
    { value: '1M+', label: t('landing.stats.reservations'), icon: Calendar },
    { value: '2M+', label: t('landing.stats.guests'), icon: Users },
    { value: '$50M+', label: t('landing.stats.revenue'), icon: CreditCard },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2070&q=80)'
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-indigo-900/90 to-purple-900/95" />

        {/* Animated elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-float" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8">
            <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
            {t('common.tagline')}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            {t('landing.hero.title')}
          </h1>

          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-10">
            {t('landing.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90">
                {t('landing.hero.cta')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                {t('landing.hero.learnMore')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('landing.stats.title')}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-4 text-primary" />
                <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=2070&q=80)'
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                <CardContent className="p-8">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-6`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=2070&q=80)'
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('landing.workflow.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.workflow.subtitle')}
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />

            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
              {workflow.map((item, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center">
                    {/* Step number */}
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/30">
                        <item.icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-4 border-primary flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground max-w-sm">
                      {item.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  {index < workflow.length - 1 && (
                    <div className="hidden lg:flex absolute top-12 -right-6 text-primary">
                      <ChevronRight className="h-8 w-8" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why Choose <span className="gradient-text">Staywise?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Our platform is designed by hospitality experts to meet the unique needs of hotel chains.
              </p>

              <div className="space-y-6">
                {[
                  'Multi-property management from a single dashboard',
                  'Real-time synchronization across all hotels',
                  'Customizable access levels for your team',
                  'Comprehensive reporting and analytics',
                  'Seamless integration with existing systems',
                  '24/7 dedicated support',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl blur-3xl" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80"
                  alt="Hotel Management"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2070&q=80)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 to-purple-900/95" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What Our Clients Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Staywise transformed our operations. We reduced check-in time by 60% and increased guest satisfaction significantly.",
                author: "Maria Santos",
                role: "General Manager, Grand Hotel SP",
                rating: 5,
              },
              {
                quote: "The multi-hotel dashboard gives us complete visibility across all properties. It's exactly what we needed to scale our business.",
                author: "Carlos Oliveira",
                role: "CEO, Oliveira Hotels",
                rating: 5,
              },
              {
                quote: "The financial reports and analytics have been game-changers for our revenue management strategy. Highly recommended!",
                author: "Ana Costa",
                role: "Revenue Manager, Costa Resorts",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-0 text-white">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-lg text-white/90 mb-6 italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div>
                    <p className="font-bold">{testimonial.author}</p>
                    <p className="text-white/70 text-sm">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-indigo-700" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-10 py-6 bg-white text-primary hover:bg-white/90">
              {t('landing.cta.button')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <Hotel className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-white">Staywise</span>
              </div>
              <p className="text-sm leading-relaxed">
                The modern solution for hotel chain management. Streamline operations, delight guests, and grow your business.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Staywise. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Clock className="h-4 w-4" />
              <span className="text-sm">24/7 Support Available</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
