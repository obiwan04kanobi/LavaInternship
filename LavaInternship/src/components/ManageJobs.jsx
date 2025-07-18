import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './Navbar';

// Live API Endpoints
const GET_JOBS_API = 'https://4vj8gtysxi.execute-api.ap-south-1.amazonaws.com/JobListings';
const GET_RESUMES_API = 'https://k2kqvumlg6.execute-api.ap-south-1.amazonaws.com/getResume';
const UPDATE_JOB_STATUS_API = 'https://jd8992ps66.execute-api.ap-south-1.amazonaws.com/updatejobstatus';

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingJobId, setUpdatingJobId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // This function fetches the initial data when the component mounts.
  const fetchJobsAndSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsResponse, resumesResponse] = await Promise.all([
        axios.get(GET_JOBS_API),
        axios.get(GET_RESUMES_API)
      ]);

      const resumes = resumesResponse.data;
      const submissionCounts = resumes.reduce((acc, resume) => {
        if (resume.jobId) {
          acc[resume.jobId] = (acc[resume.jobId] || 0) + 1;
        }
        return acc;
      }, {});

      const rawJobData = jobsResponse.data.data;
      const flattenedJobs = Object.values(rawJobData).flat();

      const jobsWithCounts = flattenedJobs.map(job => ({
        ...job,
        submissionCount: submissionCounts[job.job_id] || 0,
      }));

      // --- SORTING LOGIC ADDED HERE ---
      // Sort jobs by 'postedDate' in descending order (newest first)
      const sortedJobs = jobsWithCounts.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));

      setJobs(sortedJobs);
      setFilteredJobs(sortedJobs);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch job data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsAndSubmissions();
  }, []);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = jobs.filter(job =>
      (job.jobTitle && job.jobTitle.toLowerCase().includes(lowercasedSearchTerm)) ||
      (job.department && job.department.toLowerCase().includes(lowercasedSearchTerm)) ||
      (job.job_id && job.job_id.toLowerCase().includes(lowercasedSearchTerm))
    );
    setFilteredJobs(filtered);
  }, [searchTerm, jobs]);

  // This function handles the logic for toggling a job's status.
  const toggleJobStatus = async (jobId, currentStatus) => {
    if (updatingJobId) return;

    setUpdatingJobId(jobId);
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const originalJobs = [...jobs];

    const updatedJobs = jobs.map(job =>
      job.job_id === jobId ? { ...job, status: newStatus } : job
    );
    setJobs(updatedJobs);

    try {
      await axios.post(UPDATE_JOB_STATUS_API, {
        job_id: jobId,
        status: newStatus,
      });
    } catch (err)  {    console.error("Failed to update job status:", err);
      alert("Failed to update job status. Reverting change.");
      setJobs(originalJobs);}
     finally {
      setUpdatingJobId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#dda5a5] flex flex-col font-['Segoe_UI']">
      <Navbar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white p-6 sm:p-8 border-2 border-[#264143] rounded-2xl shadow-lg">
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-[#264143]">Manage Job Listings</h2>
            </header>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by Job ID, Title, or Department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>

            {loading && <p className="text-center text-lg text-gray-600 py-8">Loading job data...</p>}
            {error && <p className="text-center text-lg text-red-500 py-8">{error}</p>}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Job ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Job Title</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Posted Date</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Submissions</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs.map((job) => (
                      <tr key={job.job_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">{job.job_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">{job.jobTitle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">{job.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">{new Date(job.postedDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800 font-semibold text-center">{job.submissionCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${job.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => toggleJobStatus(job.job_id, job.status)}
                            disabled={updatingJobId === job.job_id}
                            className={`px-4 py-2 rounded-lg text-white transition-colors w-32 text-center text-base font-semibold ${job.status === 'Active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} ${updatingJobId === job.job_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {updatingJobId === job.job_id ? 'Updating...' : (job.status === 'Active' ? 'Deactivate' : 'Reactivate')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredJobs.length === 0 && (
                  <p className="text-center text-lg text-gray-500 mt-8 py-4">No jobs found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageJobs;
