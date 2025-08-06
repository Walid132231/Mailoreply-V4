import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Users, 
  Target, 
  Heart,
  Globe,
  Zap,
  Shield,
  Award,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  const teamMembers = [
    {
      name: 'Alex Thompson',
      role: 'CEO & Founder',
      bio: 'Former tech lead at Google with 10+ years in AI and machine learning.',
      avatar: 'AT'
    },
    {
      name: 'Sarah Chen',
      role: 'CTO',
      bio: 'AI researcher with expertise in natural language processing and email automation.',
      avatar: 'SC'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Head of Product',
      bio: 'Product strategist focused on user experience and productivity tools.',
      avatar: 'MR'
    },
    {
      name: 'Emily Johnson',
      role: 'Head of Marketing',
      bio: 'Growth expert passionate about helping professionals communicate better.',
      avatar: 'EJ'
    }
  ];

  const milestones = [
    {
      year: '2023',
      title: 'Company Founded',
      description: 'Started with a vision to revolutionize email communication'
    },
    {
      year: '2024',
      title: 'Product Launch',
      description: 'Launched MailoReply AI with basic email generation features'
    },
    {
      year: '2024',
      title: '10K+ Users',
      description: 'Reached 10,000+ satisfied users across 50+ countries'
    },
    {
      year: '2024',
      title: 'Enterprise Launch',
      description: 'Introduced enterprise features and team collaboration tools'
    }
  ];

  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'We believe everyone deserves to communicate clearly and effectively, regardless of their writing skills.'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your data is yours. We use end-to-end encryption and never store your email content.'
    },
    {
      icon: Heart,
      title: 'User-Centric',
      description: 'Every feature we build is designed with our users\' productivity and success in mind.'
    },
    {
      icon: Globe,
      title: 'Globally Accessible',
      description: 'Supporting 20+ languages to help professionals communicate worldwide.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="bg-blue-100 text-blue-800 mb-4">
            About MailoReply AI
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Empowering Professional Communication with AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're on a mission to help millions of professionals write better emails, 
            save time, and communicate more effectively using the power of artificial intelligence.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                MailoReply AI was born from a simple observation: professionals spend too much time 
                crafting emails and often struggle to convey the right tone and message.
              </p>
              <p>
                Our founders, having experienced this challenge firsthand in their corporate careers, 
                saw an opportunity to leverage AI to make email communication more efficient and effective.
              </p>
              <p>
                Today, we're proud to serve thousands of users worldwide, from individual professionals 
                to large enterprises, helping them save hours each day while improving their communication quality.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
                <p className="text-sm text-gray-600">Active Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
                <p className="text-sm text-gray-600">Countries</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">1M+</div>
                <p className="text-sm text-gray-600">Emails Generated</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">20+</div>
                <p className="text-sm text-gray-600">Languages</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600">
              Key milestones in our mission to transform email communication
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative flex items-start space-x-6">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline">{milestone.year}</Badge>
                      <h3 className="text-lg font-semibold text-gray-900">{milestone.title}</h3>
                    </div>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">
              The passionate people behind MailoReply AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-lg">{member.avatar}</span>
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription>{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="pt-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Email Communication?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of professionals who've already upgraded their workflow with AI.
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/signup">
                  Get Started Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600" asChild>
                <Link to="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
