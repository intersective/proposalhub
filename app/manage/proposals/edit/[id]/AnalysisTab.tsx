'use client';

import { useState, useEffect } from 'react';
import { BarChart2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TodoItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  tab: string;
}

interface Metrics {
  totalViews: number;
  uniqueViewers: number;
  averageViewDuration: number;
  viewsBySection: Record<string, number>;
  firstViewedAt: number | null;
  lastViewedAt: number | null;
}

interface AnalysisTabProps {
  proposalId: string;
}

export default function AnalysisTab({ proposalId }: AnalysisTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{ type: 'todo', items: TodoItem[] } | { type: 'metrics', data: Metrics } | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/proposals/${proposalId}/analysis`);
        if (response.ok) {
          const data = await response.json();
          setData(data);
        }
      } catch (error) {
        console.error('Error fetching analysis:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [proposalId]);

  const handleTodoClick = (tab: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.push(url.toString());
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No analysis data available</p>
      </div>
    );
  }

  if (data.type === 'todo') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Proposal Checklist</h2>
        <div className="space-y-6">
          {data.items.map((item) => (
            <button 
              key={item.id}
              onClick={() => handleTodoClick(item.tab)}
              className="block w-full text-left"
            >
              <div className={`p-6 rounded-lg border ${item.completed ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'} hover:shadow-md transition-shadow duration-200`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                    </div>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">{item.description}</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Metrics view
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Proposal Analytics</h2>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Views</h3>
            <BarChart2 className="w-5 h-5 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{data.data.totalViews}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">From {data.data.uniqueViewers} unique viewers</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Average View Time</h3>
            <FileText className="w-5 h-5 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {Math.round(data.data.averageViewDuration / 60)} min
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Per viewer session</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Last Viewed</h3>
            <FileText className="w-5 h-5 text-purple-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {data.data.lastViewedAt ? new Date(data.data.lastViewedAt).toLocaleDateString() : 'Never'}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            First viewed: {data.data.firstViewedAt ? new Date(data.data.firstViewedAt).toLocaleDateString() : 'Never'}
          </p>
        </div>
      </div>

      {/* Section Views */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Views by Section</h3>
        <div className="space-y-4">
          {Object.entries(data.data.viewsBySection).map(([sectionId, views]) => (
            <div key={sectionId} className="flex items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sectionId}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{views} views</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(views / data.data.totalViews) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 