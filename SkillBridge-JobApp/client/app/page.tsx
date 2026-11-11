'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Briefcase, TrendingUp, Zap, ArrowRight, CheckCircle, Star, Target } from 'lucide-react';
import { DeconstructedCard } from '@/components/Card';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!loading && user) {
      // Redirect authenticated users to their dashboard
      if (user.role === 'candidate') {
        router.push('/candidate/dashboard');
      } else if (user.role === 'employer') {
        router.push('/employer/dashboard');
      }
    }
  }, [user, loading, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-black flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black">SKILLBRIDGE</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-mono font-semibold hover:text-red-600 transition-colors">
                SIGN IN
              </Link>
              <Link href="/register" className="btn-accent">
                GET STARTED
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto animate-fadeIn">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="meta-line"></div>
              <span className="meta-text">AI-POWERED JOB MATCHING</span>
              <div className="meta-line"></div>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-6 leading-tight" style={{ letterSpacing: '-0.02em' }}>
              CONNECT TALENT<br />WITH OPPORTUNITY
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-inter">
              SkillBridge uses advanced AI to match talented professionals with their dream jobs.
              Find the perfect fit with our intelligent matching algorithm.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/register" className="btn-accent text-lg px-10 py-4">
                GET STARTED FREE
              </Link>
              <Link href="/login" className="btn-secondary text-lg px-10 py-4">
                SIGN IN
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-600">NO CREDIT CARD</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-600">FREE FOREVER</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-black mb-2">10K+</div>
              <div className="text-sm font-mono text-gray-600">ACTIVE JOBS</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black mb-2">50K+</div>
              <div className="text-sm font-mono text-gray-600">CANDIDATES</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black mb-2">5K+</div>
              <div className="text-sm font-mono text-gray-600">COMPANIES</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black mb-2">95%</div>
              <div className="text-sm font-mono text-gray-600">MATCH SUCCESS</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Deconstructed Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">WHY SKILLBRIDGE?</h2>
            <div className="flex items-center justify-center gap-3">
              <div className="meta-line"></div>
              <span className="meta-text">POWERED BY AI</span>
              <div className="meta-line"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <DeconstructedCard gradient="red" className="h-96 w-full">
              <div className="card-layer card-content relative z-20 p-8 flex flex-col justify-between h-full text-white">
                <div className="content-fragment fragment-meta">
                  <div className="meta-line bg-white"></div>
                  <span className="meta-text text-white/80">FEATURE</span>
                </div>

                <div className="content-fragment fragment-heading">
                  <Zap className="w-12 h-12 mb-4 text-white/80" />
                  <h2 className="content-text text-white text-3xl">AI-POWERED</h2>
                  <h3 className="content-subtext text-white/70">MATCHING</h3>
                </div>

                <div className="content-fragment fragment-body">
                  <p className="text-sm text-white/80">
                    Advanced AI analyzes your skills and experience to find jobs that truly fit you.
                  </p>
                </div>
              </div>
            </DeconstructedCard>

            {/* Feature 2 */}
            <DeconstructedCard gradient="cyan" className="h-96 w-full">
              <div className="card-layer card-content relative z-20 p-8 flex flex-col justify-between h-full text-white">
                <div className="content-fragment fragment-meta">
                  <div className="meta-line bg-white"></div>
                  <span className="meta-text text-white/80">FEATURE</span>
                </div>

                <div className="content-fragment fragment-heading">
                  <Target className="w-12 h-12 mb-4 text-white/80" />
                  <h2 className="content-text text-white text-3xl">SMART</h2>
                  <h3 className="content-subtext text-white/70">RECOMMENDATIONS</h3>
                </div>

                <div className="content-fragment fragment-body">
                  <p className="text-sm text-white/80">
                    Get personalized job recommendations with detailed match percentages.
                  </p>
                </div>
              </div>
            </DeconstructedCard>

            {/* Feature 3 */}
            <DeconstructedCard gradient="blue" className="h-96 w-full">
              <div className="card-layer card-content relative z-20 p-8 flex flex-col justify-between h-full text-white">
                <div className="content-fragment fragment-meta">
                  <div className="meta-line bg-white"></div>
                  <span className="meta-text text-white/80">FEATURE</span>
                </div>

                <div className="content-fragment fragment-heading">
                  <TrendingUp className="w-12 h-12 mb-4 text-white/80" />
                  <h2 className="content-text text-white text-3xl">TRACK</h2>
                  <h3 className="content-subtext text-white/70">PROGRESS</h3>
                </div>

                <div className="content-fragment fragment-body">
                  <p className="text-sm text-white/80">
                    Monitor applications, interviews, and offers in one beautiful dashboard.
                  </p>
                </div>
              </div>
            </DeconstructedCard>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">HOW IT WORKS</h2>
            <div className="flex items-center justify-center gap-3">
              <div className="meta-line"></div>
              <span className="meta-text">3 SIMPLE STEPS</span>
              <div className="meta-line"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "CREATE PROFILE", desc: "Sign up and upload your resume. Our AI analyzes your skills." },
              { num: "02", title: "GET MATCHED", desc: "Receive personalized job recommendations with match scores." },
              { num: "03", title: "APPLY & LAND", desc: "Apply with one click and track until you land your dream job." }
            ].map((step, index) => (
              <div key={index} className="card hover">
                <div className="text-6xl font-black text-red-600 mb-4">{step.num}</div>
                <h3 className="text-2xl font-black mb-3">{step.title}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="meta-line"></div>
                  <span className="meta-text">STEP {step.num}</span>
                </div>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card p-12">
            <h2 className="text-5xl font-black mb-4">READY TO START?</h2>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="meta-line"></div>
              <span className="meta-text">JOIN THOUSANDS</span>
              <div className="meta-line"></div>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of professionals who found their perfect match on SkillBridge
            </p>
            <Link href="/register" className="btn-accent text-lg px-10 py-4 inline-block">
              GET STARTED NOW
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-black flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black">SKILLBRIDGE</span>
              </div>
              <p className="text-sm text-gray-600 font-mono">
                AI-POWERED JOB MATCHING PLATFORM
              </p>
            </div>

            <div>
              <h4 className="font-black mb-4">FOR CANDIDATES</h4>
              <ul className="space-y-2 text-sm font-mono text-gray-600">
                <li><Link href="/register" className="hover:text-black transition-colors">FIND JOBS</Link></li>
                <li><Link href="/register" className="hover:text-black transition-colors">UPLOAD RESUME</Link></li>
                <li><Link href="/register" className="hover:text-black transition-colors">TRACK APPLICATIONS</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-4">FOR EMPLOYERS</h4>
              <ul className="space-y-2 text-sm font-mono text-gray-600">
                <li><Link href="/register" className="hover:text-black transition-colors">POST JOBS</Link></li>
                <li><Link href="/register" className="hover:text-black transition-colors">FIND CANDIDATES</Link></li>
                <li><Link href="/register" className="hover:text-black transition-colors">MANAGE APPLICATIONS</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-4">COMPANY</h4>
              <ul className="space-y-2 text-sm font-mono text-gray-600">
                <li><a href="#" className="hover:text-black transition-colors">ABOUT US</a></li>
                <li><a href="#" className="hover:text-black transition-colors">CONTACT</a></li>
                <li><a href="#" className="hover:text-black transition-colors">PRIVACY</a></li>
                <li><a href="#" className="hover:text-black transition-colors">TERMS</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-xs font-mono text-gray-500">&copy; 2025 SKILLBRIDGE. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
