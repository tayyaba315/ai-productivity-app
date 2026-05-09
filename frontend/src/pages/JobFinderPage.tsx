import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, DollarSign, Briefcase, Bookmark, Send, Trash2, Filter } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { apiUrl } from '../lib/api';

interface Job {
  id: number | string;
  job_id?: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  url?: string;
  saved: boolean;
}

export default function JobFinderPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (locationFilter !== 'all') params.set('location', locationFilter);
        if (jobTypeFilter !== 'all') params.set('type', jobTypeFilter);

        const res = await fetch(apiUrl(`/jobs?${params.toString()}`));
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Failed to fetch jobs');
        setJobs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void loadJobs();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, locationFilter, jobTypeFilter]);

  const toggleSave = (jobId: number | string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, saved: !job.saved } : job
    ));
  };

  const deleteJob = (jobId: number | string) => {
    setJobs(jobs.filter(job => job.id !== jobId));
  };

  const filteredJobs = useMemo(() => jobs, [jobs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Job Finder</h1>
        <p className="text-lg text-white/90">Discover opportunities tailored to your skills and schedule</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-card backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for jobs or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-background border-border text-foreground rounded-xl"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters:</span>
          </div>
          
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-48 rounded-xl bg-background border-border text-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="San Francisco">San Francisco</SelectItem>
              <SelectItem value="New York">New York</SelectItem>
              <SelectItem value="Austin">Austin</SelectItem>
              <SelectItem value="Boston">Boston</SelectItem>
            </SelectContent>
          </Select>

          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger className="w-48 rounded-xl bg-background border-border text-foreground">
              <Briefcase className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Job Listings */}
      {loading && <p className="text-muted-foreground">Loading jobs...</p>}
      {error && <p className="text-destructive">{error}</p>}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-card backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all border border-border group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                <p className="text-lg text-muted-foreground mb-3">{job.company}</p>
                
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span className="px-2 py-1 bg-primary/20 text-primary/80 rounded-lg">{job.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold text-primary/80">{job.salary}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-4">{job.description}</p>

            <div className="flex gap-3">
              <button
                onClick={() => toggleSave(job.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  job.saved
                    ? 'bg-secondary-warn/20 text-secondary-warn border border-secondary-warn/30'
                    : 'bg-background text-muted-foreground border border-border hover:bg-card'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${job.saved ? 'fill-current' : ''}`} />
                <span className="text-sm">{job.saved ? 'Saved' : 'Save'}</span>
              </button>
              
              <button
                onClick={() => {
                  if (job.url) window.open(job.url, '_blank', 'noopener,noreferrer');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                <Send className="w-4 h-4" />
                <span className="text-sm">Apply</span>
              </button>
              
              <button
                onClick={() => deleteJob(job.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="bg-card backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-border">
          <Briefcase className="w-16 h-16 text-border mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">No jobs found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
