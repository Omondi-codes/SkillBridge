'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Tag,
  Eye,
  Save,
  Send,
  Plus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryMin: string;
  salaryMax: string;
  deadline: string;
  requiredSkills: string[];
  preferredSkills: string[];
  benefits: string[];
  companyDescription: string;
}

export default function CreateJobPage() {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentPreferredSkill, setCurrentPreferredSkill] = useState('');
  const [currentBenefit, setCurrentBenefit] = useState('');

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    type: 'full-time',
    salaryMin: '',
    salaryMax: '',
    deadline: '',
    requiredSkills: [],
    preferredSkills: [],
    benefits: [],
    companyDescription: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addSkill = (type: 'required' | 'preferred') => {
    const skill = type === 'required' ? currentSkill : currentPreferredSkill;
    if (!skill.trim()) return;

    if (type === 'required') {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill.trim()],
      }));
      setCurrentSkill('');
    } else {
      setFormData((prev) => ({
        ...prev,
        preferredSkills: [...prev.preferredSkills, skill.trim()],
      }));
      setCurrentPreferredSkill('');
    }
  };

  const removeSkill = (type: 'required' | 'preferred', index: number) => {
    if (type === 'required') {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: prev.requiredSkills.filter((_, i) => i !== index),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        preferredSkills: prev.preferredSkills.filter((_, i) => i !== index),
      }));
    }
  };

  const addBenefit = () => {
    if (!currentBenefit.trim()) return;
    setFormData((prev) => ({
      ...prev,
      benefits: [...prev.benefits, currentBenefit.trim()],
    }));
    setCurrentBenefit('');
  };

  const removeBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (isDraft: boolean) => {
    // Validate required fields
    if (!isDraft) {
      if (
        !formData.title ||
        !formData.description ||
        !formData.location ||
        !formData.salaryMin ||
        !formData.salaryMax
      ) {
        alert('Please fill in all required fields');
        return;
      }
    }

    try {
      // Prepare job data for backend
      const jobData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements || null,
        responsibilities: formData.responsibilities || null,
        location: formData.location,
        employment_type: formData.type,
        salary_min: parseInt(formData.salaryMin) || null,
        salary_max: parseInt(formData.salaryMax) || null,
        salary_currency: 'KES', // Default currency
        required_skills: formData.requiredSkills,
        preferred_skills: formData.preferredSkills,
        application_deadline: formData.deadline || null,
        status: isDraft ? 'draft' : 'active',
      };

      // Submit to backend
      const response = await api.post('/jobs', jobData);

      if (response.data.success) {
        alert(isDraft ? 'Job saved as draft!' : 'Job posted successfully!');
        router.push('/employer/jobs');
      }
    } catch (error) {
      console.error('Error submitting job:', error);
      alert('Failed to submit job. Please try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/employer/jobs"
          className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-black mb-2">
            CREATE JOB POSTING
          </h1>
          <div className="flex items-center gap-3">
            <div className="meta-line"></div>
            <span className="meta-text">NEW OPPORTUNITY</span>
          </div>
        </div>
      </div>

      {!showPreview ? (
        <form className="space-y-6">
          {/* Basic Information */}
          <div className="card rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-black" />
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Job Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Senior Frontend Developer"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-zinc-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Job Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the role, what the candidate will be doing..."
                  rows={5}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-zinc-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Location <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                      size={20}
                    />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., San Francisco, CA or Remote"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-black placeholder-zinc-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Employment Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200"
                    required
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="card rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-black" />
              Compensation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Minimum Salary (KES) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="salaryMin"
                  value={formData.salaryMin}
                  onChange={handleInputChange}
                  placeholder="80000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-zinc-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Maximum Salary (KES) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="salaryMax"
                  value={formData.salaryMax}
                  onChange={handleInputChange}
                  placeholder="120000"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-zinc-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200"
                  required
                />
              </div>
            </div>
          </div>

          {/* Requirements & Responsibilities */}
          <div className="card rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <FileText size={20} className="text-black" />
              Requirements & Responsibilities
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Requirements
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  placeholder="List the required qualifications, education, experience..."
                  rows={5}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-zinc-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Responsibilities
                </label>
                <textarea
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleInputChange}
                  placeholder="Describe the key responsibilities and duties..."
                  rows={5}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-zinc-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="card rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <Tag size={20} className="text-black" />
              Skills
            </h2>
            <div className="space-y-6">
              {/* Required Skills */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Required Skills
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill('required');
                      }
                    }}
                    placeholder="e.g., React, TypeScript"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-zinc-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => addSkill('required')}
                    className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.requiredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill('required', index)}
                        className="hover:text-purple-300"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferred Skills */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Preferred Skills
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={currentPreferredSkill}
                    onChange={(e) => setCurrentPreferredSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill('preferred');
                      }
                    }}
                    placeholder="e.g., GraphQL, AWS"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-zinc-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => addSkill('preferred')}
                    className="px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.preferredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 bg-gray-100 border border-gray-200 text-gray-700 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill('preferred', index)}
                        className="hover:text-blue-300"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="card rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4">Benefits</h2>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Add Benefits
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentBenefit}
                  onChange={(e) => setCurrentBenefit(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addBenefit();
                    }
                  }}
                  placeholder="e.g., Health Insurance, Remote Work"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-zinc-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={addBenefit}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.benefits.map((benefit, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-200 text-green-800 rounded-full text-sm"
                  >
                    {benefit}
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="hover:text-green-300"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Application Deadline */}
          <div className="card rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-black" />
              Application Deadline
            </h2>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Deadline Date
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-black focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              <Eye size={20} />
              Preview
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              <Save size={20} />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-black uppercase"
            >
              <Send size={20} />
              Post Job
            </button>
          </div>
        </form>
      ) : (
        /* Preview */
        <div className="space-y-6">
          <div className="card rounded-lg p-8 border border-gray-200">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-black mb-2">
                {formData.title || 'Job Title'}
              </h2>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <span className="flex items-center gap-2">
                  <MapPin size={16} />
                  {formData.location || 'Location'}
                </span>
                <span className="flex items-center gap-2">
                  <Briefcase size={16} />
                  {formData.type}
                </span>
                <span className="flex items-center gap-2">
                  KES {formData.salaryMin ? parseInt(formData.salaryMin).toLocaleString() : '0'} - KES {formData.salaryMax ? parseInt(formData.salaryMax).toLocaleString() : '0'}
                </span>
              </div>
            </div>

            {formData.description && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-black mb-2">
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {formData.description}
                </p>
              </div>
            )}

            {formData.responsibilities && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-black mb-2">
                  Responsibilities
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {formData.responsibilities}
                </p>
              </div>
            )}

            {formData.requirements && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-black mb-2">
                  Requirements
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {formData.requirements}
                </p>
              </div>
            )}

            {formData.requiredSkills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-black mb-2">
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {formData.requiredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-black text-white rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {formData.preferredSkills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-black mb-2">
                  Preferred Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {formData.preferredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 border border-gray-200 text-gray-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {formData.benefits.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-black mb-2">Benefits</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 border border-green-200 text-green-800 rounded-full text-sm"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {formData.deadline && (
              <div>
                <h3 className="text-xl font-bold text-black mb-2">
                  Application Deadline
                </h3>
                <p className="text-gray-700">
                  {new Date(formData.deadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Preview Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowPreview(false)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              <ArrowLeft size={20} />
              Back to Edit
            </button>
            <button
              onClick={() => handleSubmit(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              <Save size={20} />
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit(false)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-black uppercase"
            >
              <Send size={20} />
              Post Job
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
