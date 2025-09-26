'use client';

import React from 'react';
import { Header } from '@/components/navigation/Header';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Calendar,
  Plus,
  Eye,
  Edit,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <p className="text-gray-600">Please log in to access your dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isCandidate = user.role === 'candidate';

  // Mock data for demonstration
  const candidateStats = {
    applications: 12,
    interviews: 3,
    profileViews: 45,
    profileCompleteness: 85
  };

  const recruiterStats = {
    activeJobs: 8,
    applications: 156,
    interviews: 23,
    hires: 5
  };

  const recentActivity = [
    {
      id: 1,
      type: isCandidate ? 'application' : 'application_received',
      title: isCandidate ? 'Applied to Senior Developer at TechCorp' : 'New application for Senior Developer',
      time: '2 hours ago',
      status: 'pending'
    },
    {
      id: 2,
      type: 'interview',
      title: isCandidate ? 'Interview scheduled with StartupXYZ' : 'Interview scheduled for Frontend Role',
      time: '1 day ago',
      status: 'scheduled'
    },
    {
      id: 3,
      type: isCandidate ? 'profile_view' : 'hire',
      title: isCandidate ? 'Profile viewed by 3 companies' : 'Successfully hired Marketing Manager',
      time: '3 days ago',
      status: 'completed'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'scheduled': return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-gray-600">
            {isCandidate 
              ? "Here's your job search progress and recent activity"
              : "Here's an overview of your recruitment activities"
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isCandidate ? (
            <>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Applications</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{candidateStats.applications}</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last week
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{candidateStats.interviews}</div>
                  <p className="text-xs text-muted-foreground">
                    1 scheduled this week
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{candidateStats.profileViews}</div>
                  <p className="text-xs text-muted-foreground">
                    +12 from last week
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profile Score</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{candidateStats.profileCompleteness}%</div>
                  <Progress value={candidateStats.profileCompleteness} className="mt-2" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recruiterStats.activeJobs}</div>
                  <p className="text-xs text-muted-foreground">
                    2 posted this week
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Applications</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recruiterStats.applications}</div>
                  <p className="text-xs text-muted-foreground">
                    +24 from last week
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recruiterStats.interviews}</div>
                  <p className="text-xs text-muted-foreground">
                    8 scheduled this week
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hires</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recruiterStats.hires}</div>
                  <p className="text-xs text-muted-foreground">
                    2 this month
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest {isCandidate ? 'applications and updates' : 'recruitment activities'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="mt-0.5">
                        {getStatusIcon(activity.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.time}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isCandidate ? (
                  <>
                    <Button className="w-full justify-start" asChild>
                      <Link href="/jobs">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Browse Jobs
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/profile">
                        <Edit className="mr-2 h-4 w-4" />
                        Update Profile
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Star className="mr-2 h-4 w-4" />
                      View Saved Jobs
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Post New Job
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      View Applications
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Analytics
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Profile Completion for Candidates */}
            {isCandidate && candidateStats.profileCompleteness < 100 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-sm">Complete Your Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress value={candidateStats.profileCompleteness} />
                    <div className="text-sm text-gray-600">
                      {candidateStats.profileCompleteness}% complete
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/profile">
                        Add Missing Info
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}