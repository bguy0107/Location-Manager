'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Users, MapPin, UserCheck, TrendingUp, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardStats, Role } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { Spinner } from '@/components/ui/Spinner';

function useStats() {
  return useQuery<{ data: DashboardStats }>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats');
      return data;
    },
    staleTime: 30 * 1000,
  });
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  href?: string;
  color: string;
  iconBg: string;
}

function StatCard({ title, value, icon: Icon, description, href, color, iconBg }: StatCardProps) {
  const content = (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div className={`${iconBg} p-3 rounded-xl`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
      {href && (
        <div className="mt-4 flex items-center text-sm font-medium text-primary-600">
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: statsData, isLoading } = useStats();

  const stats = statsData?.data;
  const canSeeUserStats =
    user?.role === Role.ADMIN || user?.role === Role.MANAGER;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your Location Manager
        </p>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Locations */}
          <StatCard
            title="Total Locations"
            value={stats?.locations.total ?? 0}
            icon={MapPin}
            description="Active store locations"
            href="/locations"
            color="text-primary-600"
            iconBg="bg-primary-50"
          />

          {/* Users — only show to admins/managers */}
          {canSeeUserStats && (
            <>
              <StatCard
                title="Total Users"
                value={stats?.users.total ?? 0}
                icon={Users}
                description="Registered team members"
                href="/users"
                color="text-violet-600"
                iconBg="bg-violet-50"
              />
              <StatCard
                title="Active Users"
                value={stats?.users.active ?? 0}
                icon={UserCheck}
                description={`${stats ? Math.round((stats.users.active / Math.max(stats.users.total, 1)) * 100) : 0}% of total users`}
                color="text-emerald-600"
                iconBg="bg-emerald-50"
              />
            </>
          )}

          {/* Regular users just see their assigned locations */}
          {user?.role === Role.USER && (
            <StatCard
              title="My Locations"
              value={user?.locations?.length ?? 0}
              icon={TrendingUp}
              description="Locations assigned to you"
              color="text-amber-600"
              iconBg="bg-amber-50"
            />
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/locations"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Browse Locations
          </Link>
          {canSeeUserStats && (
            <Link
              href="/users"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-50 text-violet-700 text-sm font-medium hover:bg-violet-100 transition-colors"
            >
              <Users className="h-4 w-4" />
              Manage Users
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
