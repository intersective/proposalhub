'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/app/components/navigation';
import { SolutionRecord } from '@/app/types/solution';
import { Plus, Search } from 'lucide-react';

export default function SolutionsPageClient() {
  const router = useRouter();
  const [solutions, setSolutions] = useState<SolutionRecord[]>([]);
  const [filteredSolutions, setFilteredSolutions] = useState<SolutionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const response = await fetch('/api/solutions');
        if (response.ok) {
          const data = await response.json();
          setSolutions(data);
          setFilteredSolutions(data);
        }
      } catch (error) {
        console.error('Error fetching solutions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolutions();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSolutions(solutions);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSolutions(
        solutions.filter(
          solution =>
            solution.title.toLowerCase().includes(query) ||
            solution.sections.description.content.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, solutions]);

  const handleNewSolution = async () => {
    try {
      const response = await fetch('/api/solutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Untitled Solution',
          status: 'draft',
          sections: {
            description: {
              id: 'description',
              title: 'Description',
              content: '',
            },
            benefits: {
              id: 'benefits',
              title: 'Benefits',
              content: '',
            },
            painPoints: {
              id: 'painPoints',
              title: 'Pain Points Addressed',
              content: '',
            },
            timeline: {
              id: 'timeline',
              title: 'Implementation Timeline',
              content: '',
            },
            competitivePosition: {
              id: 'competitivePosition',
              title: 'Competitive Positioning',
              content: '',
            },
            pricing: {
              id: 'pricing',
              title: 'Pricing',
              content: '',
            }
          },
          mediaAssets: []
        })
      });

      if (response.ok) {
        const { id } = await response.json();
        router.push(`/manage/solutions/edit/${id}`);
      }
    } catch (error) {
      console.error('Error creating new solution:', error);
    }
  };

  const handleDelete = async (solutionId: string) => {
    if (!confirm('Are you sure you want to delete this solution?')) return;
    
    try {
      const response = await fetch(`/api/solutions/${solutionId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setSolutions(solutions.filter(p => p.id !== solutionId));
      }
    } catch (error) {
      console.error('Error deleting solution:', error);
    }
  };

  const getStatusColor = (status: SolutionRecord['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200';
      case 'archived':
        return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Solutions</h1>
            <button
              onClick={handleNewSolution}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Solution
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search solutions..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : filteredSolutions.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSolutions.map((solution) => (
                  <li key={solution.id}>
                    <div className="block hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-medium text-blue-600 dark:text-blue-400 truncate">
                              {solution.title}
                            </p>
                            <div className="mt-1">
                              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {solution.sections.description.content}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(solution.status)}`}>
                              {solution.status}
                            </span>
                            <button
                              onClick={() => router.push(`/manage/solutions/edit/${solution.id}`)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(solution.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            Last updated {new Date(solution.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No solutions</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating a new solution.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleNewSolution}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Solution
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 