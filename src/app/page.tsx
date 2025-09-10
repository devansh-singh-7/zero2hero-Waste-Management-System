// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin, ChevronRight, Target, Globe, Award, Shield, Zap, Heart, Camera, Truck, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Poppins } from 'next/font/google'
import Link from 'next/link'

const poppins = Poppins({ 
  weight: ['300', '400', '600'],
  subsets: ['latin'],
  display: 'swap',
})

function AnimatedGlobe() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-8">
      <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-pulse"></div>
      <div className="absolute inset-2 rounded-full bg-green-400 opacity-40 animate-ping"></div>
      <div className="absolute inset-4 rounded-full bg-green-300 opacity-60 animate-spin"></div>
      <div className="absolute inset-6 rounded-full bg-green-200 opacity-80 animate-bounce"></div>
      <Leaf className="absolute inset-0 m-auto h-16 w-16 text-green-600 animate-pulse" />
    </div>
  )
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [impactData, setImpactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0
  });

  // Check authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache', // Ensure fresh data
          }
        });
        if (response.ok) {
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setLoggedIn(false);
      }
    }
    checkAuth();

    // Listen for storage events to refresh when login happens
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userEmail') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    async function fetchImpactData() {
      try {
        console.log('Fetching platform-wide impact data...');
        
        // Fetch aggregate stats from all users
        const statsResponse = await fetch('/api/admin/stats', {
          headers: {
            'Cache-Control': 'no-cache', // Ensure fresh data
          }
        });

        console.log('Platform stats response status:', statsResponse.status);

        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          console.log('Received platform stats:', stats);
          
          setImpactData({
            wasteCollected: stats.totalWasteCollected || 0,
            reportsSubmitted: stats.totalReports || 0,
            tokensEarned: stats.totalTasks || 0, // Using total tasks completed
            co2Offset: stats.totalCO2Saved || 0
          });

          console.log('Updated platform impact data:', {
            wasteCollected: stats.totalWasteCollected || 0,
            reportsSubmitted: stats.totalReports || 0,
            tasksCompleted: stats.totalTasks || 0,
            co2Offset: stats.totalCO2Saved || 0
          });
        } else {
          const errorText = await statsResponse.text();
          console.error('Failed to fetch platform stats:', errorText);
          throw new Error('Failed to fetch platform stats');
        }
      } catch (error) {
        console.error("Error fetching platform impact data:", error);
        // Set default values in case of error
        setImpactData({
          wasteCollected: 0,
          reportsSubmitted: 0,
          tokensEarned: 0,
          co2Offset: 0
        });
      }
    }

    fetchImpactData();
  }, []); // Remove dependency on loggedIn since we want to show data regardless

  const login = () => {
    // Redirect to signin page
    window.location.href = '/auth/signin';
  };

  return (
    <div className={`container mx-auto px-4 py-16 ${poppins.className}`}>
      <section className="text-center mb-20">
        <AnimatedGlobe />
        <h1 className="text-6xl font-bold mb-6 text-gray-800 tracking-tight">
          Zero-to-Hero <span className="text-green-600">Waste Management</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
          Join our community in making waste management more efficient and rewarding!
        </p>
        {!loggedIn ? (
          <Button onClick={login} className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Link href="/rewards/report">
            <Button className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
              Report Waste
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        )}
      </section>
      
      <section className="bg-white p-10 rounded-3xl shadow-lg mb-20">
        <h2 className="text-4xl font-bold mb-12 text-center text-gray-800">Our Impact</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <ImpactCard title="Waste Collected" value={`${impactData.wasteCollected} kg`} icon={Recycle} />
          <ImpactCard title="Reports Submitted" value={impactData.reportsSubmitted.toString()} icon={MapPin} />
          <ImpactCard title="Tasks Completed" value={impactData.tokensEarned.toString()} icon={Users} />
          <ImpactCard title="CO2 Offset" value={`${impactData.co2Offset} kg`} icon={Leaf} />
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-10 mb-20">
        <FeatureCard
          icon={Leaf}
          title="Eco-Friendly"
          description="Contribute to a cleaner environment by reporting and collecting waste."
        />
        <FeatureCard
          icon={Award}
          title="Earn Recognition"
          description="Gain badges and achievements for your environmental contributions."
        />
        <FeatureCard
          icon={Users}
          title="Community-Driven"
          description="Be part of a growing community committed to sustainable practices."
        />
      </section>

      {/* Mission & Vision Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 p-12 rounded-3xl mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Mission & Vision</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transforming waste management through community action and technology innovation
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div className="text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              To create a sustainable future by empowering communities to actively participate in waste management, 
              making environmental protection accessible, rewarding, and impactful for everyone.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Vision</h3>
            <p className="text-gray-600 leading-relaxed">
              A world where waste becomes a resource, communities are empowered environmental stewards, 
              and technology bridges the gap between individual action and global impact.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Simple steps to make a meaningful environmental impact
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          <ProcessStep
            step="1"
            icon={Camera}
            title="Report Waste"
            description="Spot waste in your community and report it through our platform with location and photos."
          />
          <ProcessStep
            step="2"
            icon={Users}
            title="Community Response"
            description="Local volunteers and waste collectors receive notifications about reported waste locations."
          />
          <ProcessStep
            step="3"
            icon={Truck}
            title="Collection Action"
            description="Waste gets collected by community members or professional services, making real impact."
          />
          <ProcessStep
            step="4"
            icon={Award}
            title="Earn Recognition"
            description="Contributors earn badges, achievements, and recognition for their environmental efforts."
          />
        </div>
      </section>

      {/* Goals & Impact Section */}
      <section className="bg-gray-900 text-white p-12 rounded-3xl mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Our Environmental Goals</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Ambitious targets to create measurable environmental change through collective action
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <GoalCard
            icon={Recycle}
            title="1 Million KG"
            subtitle="Waste Collected"
            description="Our goal to collect and properly manage 1 million kilograms of waste through community action."
            progress={Math.min((impactData.wasteCollected / 1000000) * 100, 100)}
          />
          <GoalCard
            icon={Leaf}
            title="500 Tons CO2"
            subtitle="Carbon Offset"
            description="Targeting 500 tons of CO2 equivalent offset through proper waste management practices."
            progress={Math.min((impactData.co2Offset / 500000) * 100, 100)}
          />
          <GoalCard
            icon={Users}
            title="100,000 Users"
            subtitle="Community Members"
            description="Building a community of 100,000 active environmental stewards worldwide."
            progress={15} // Placeholder progress
          />
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Zero-to-Hero?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unique features that make environmental action accessible and rewarding
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BenefitCard
            icon={Zap}
            title="Instant Impact"
            description="See immediate results from your environmental actions with real-time tracking and feedback."
          />
          <BenefitCard
            icon={Shield}
            title="Verified Actions"
            description="AI-powered verification ensures all reported waste and collection activities are authentic."
          />
          <BenefitCard
            icon={Heart}
            title="Community First"
            description="Built by the community, for the community - every feature designed with user feedback."
          />
          <BenefitCard
            icon={Globe}
            title="Global Reach"
            description="Connect with environmental champions worldwide and share impact across borders."
          />
          <BenefitCard
            icon={Award}
            title="Recognition System"
            description="Comprehensive badges and achievements to celebrate your environmental contributions."
          />
          <BenefitCard
            icon={Recycle}
            title="Circular Economy"
            description="Supporting the transition to a circular economy where waste becomes a valuable resource."
          />
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-12 rounded-3xl text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
          Join thousands of environmental heroes who are already making their communities cleaner and greener. 
          Every action counts, every report matters, and every contribution creates lasting change.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!loggedIn ? (
            <>
              <Button 
                onClick={login} 
                className="bg-white text-green-600 hover:bg-gray-100 text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                Join the Movement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-green-600 text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out"
              >
                Learn More
              </Button>
            </>
          ) : (
            <>
              <Link href="/rewards/report">
                <Button className="bg-white text-green-600 hover:bg-gray-100 text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
                  Start Reporting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>
      
    </div>
  )
}

function ImpactCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value;
  
  return (
    <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 transition-all duration-300 ease-in-out hover:shadow-md">
      <Icon className="h-10 w-10 text-green-500 mb-4" />
      <p className="text-3xl font-bold mb-2 text-gray-800">{formattedValue}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex flex-col items-center text-center">
      <div className="bg-green-100 p-4 rounded-full mb-6">
        <Icon className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function ProcessStep({ step, icon: Icon, title, description }: { step: string; icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="text-center relative">
      <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
        {step}
      </div>
      <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function GoalCard({ icon: Icon, title, subtitle, description, progress }: { 
  icon: React.ElementType; 
  title: string; 
  subtitle: string; 
  description: string; 
  progress: number 
}) {
  return (
    <div className="text-center">
      <div className="bg-white bg-opacity-10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="h-10 w-10 text-white" />
      </div>
      <h3 className="text-3xl font-bold mb-2">{title}</h3>
      <p className="text-xl text-gray-300 mb-4">{subtitle}</p>
      <p className="text-gray-400 mb-6 leading-relaxed">{description}</p>
      <div className="bg-gray-800 rounded-full h-2 mb-2">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-400">{Math.round(progress)}% Complete</p>
    </div>
  )
}

function BenefitCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out">
      <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}
