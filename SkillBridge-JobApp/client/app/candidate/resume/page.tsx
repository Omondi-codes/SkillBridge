'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Briefcase,
  GraduationCap,
  Code,
  User,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import api from '@/lib/api';

interface ParsedData {
  personal_info?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary?: string;
  skills?: string[] | {
    technical_skills?: string[];
    soft_skills?: string[];
    languages?: string[];
    tools?: string[];
  };
  experience?: Array<{
    company?: string;
    position?: string;
    title?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    duration?: string;
    description?: string;
    achievements?: string[];
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    start_date?: string;
    end_date?: string;
    year?: string;
    gpa?: string;
  }>;
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
    credential_id?: string;
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
  awards?: string[];
}

interface Resume {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  is_primary: boolean;
  parsed_data?: ParsedData;
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchResumeData();
  }, []);

  const fetchResumeData = async () => {
    try {
      setLoading(true);

      const resumesRes = await api.get('/resumes/my-resumes');
      const resumesData = resumesRes.data.data || [];

      console.log('Resume API response:', resumesRes.data);
      console.log('Resumes data:', resumesData);

      const mappedResumes = (Array.isArray(resumesData) ? resumesData : []).map((resume: Record<string, unknown>) => ({
        id: (resume._id as string) || (resume.id as string),
        file_name: (resume.filename as string) || 'Untitled',
        file_url: (resume.file_url as string) || '',
        file_size: (resume.file_size as number) || 0,
        uploaded_at: (resume.created_at as string) || new Date().toISOString(),
        is_primary: (resume.is_primary as boolean) || false,
        parsed_data: (resume.parsed_data as ParsedData) || null,
      }));

      setResumes(mappedResumes);

      // Auto-select first resume if available
      if (mappedResumes.length > 0 && !selectedResume) {
        setSelectedResume(mappedResumes[0]);
      }

    } catch (error) {
      console.error('Error fetching resume data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchResumeData();
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      await api.delete(`/resumes/${resumeId}`);
      if (selectedResume?.id === resumeId) {
        setSelectedResume(null);
      }
      await fetchResumeData();
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Failed to delete resume. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  // Upload loading overlay
  if (uploading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4">
              <Upload className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="text-2xl font-black mb-2">PARSING RESUME</h3>
            <p className="text-gray-600 mb-4 font-mono text-sm">
              Analyzing your resume with AI...
            </p>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700">Extracting text from document</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-gray-700">Parsing with Gemini AI</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-gray-700">Generating embeddings</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                <span className="text-gray-700">Storing in database</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-black h-full rounded-full animate-[progress_2s_ease-in-out_infinite]"></div>
            </div>
            <p className="text-xs text-gray-500 mt-4 font-mono">This may take 10-30 seconds</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Resume Upload Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
              <FileText size={24} />
              UPLOADED RESUMES
            </h2>
            <div className="flex items-center gap-3">
              <div className="meta-line"></div>
              <span className="meta-text">MANAGE YOUR DOCUMENTS</span>
            </div>
          </div>
          <label className="cursor-pointer btn-accent flex items-center gap-2">
            <Upload size={20} />
            {uploading ? 'UPLOADING...' : 'UPLOAD RESUME'}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {resumes.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2 font-semibold">NO RESUMES UPLOADED YET</p>
            <p className="text-gray-500 text-sm font-mono">Upload your resume to start applying for jobs</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                onClick={() => setSelectedResume(resume)}
                className={`bg-gray-50 border rounded-lg p-4 hover:border-gray-400 transition-all duration-200 cursor-pointer ${
                  selectedResume?.id === resume.id ? 'border-black ring-2 ring-black' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${selectedResume?.id === resume.id ? 'bg-black' : 'bg-gray-300'}`}>
                      <FileText className={selectedResume?.id === resume.id ? 'text-white' : 'text-gray-600'} size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm">{resume.file_name}</h3>
                        {resume.is_primary && (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-mono rounded-md border border-emerald-200">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-gray-600 text-xs font-mono">{formatFileSize(resume.file_size)}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600 text-xs font-mono">
                          {formatDate(resume.uploaded_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {resume.file_url && (
                      <a
                        href={resume.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-lg transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye size={20} />
                      </a>
                    )}
                    {resume.file_url && (
                      <a
                        href={resume.file_url}
                        download
                        className="p-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-lg transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download size={20} />
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteResume(resume.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parsed Resume Data */}
      {selectedResume?.parsed_data && (
        <>
          {/* Contact Information */}
          {selectedResume.parsed_data.personal_info && (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <User size={24} />
                  CONTACT INFORMATION
                </h2>
                <div className="flex items-center gap-3">
                  <div className="meta-line"></div>
                  <span className="meta-text">EXTRACTED FROM RESUME</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedResume.parsed_data.personal_info.name && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-mono text-gray-500">NAME</p>
                      <p className="font-semibold">{selectedResume.parsed_data.personal_info.name}</p>
                    </div>
                  </div>
                )}
                {selectedResume.parsed_data.personal_info.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-mono text-gray-500">EMAIL</p>
                      <p className="font-semibold">{selectedResume.parsed_data.personal_info.email}</p>
                    </div>
                  </div>
                )}
                {selectedResume.parsed_data.personal_info.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-mono text-gray-500">PHONE</p>
                      <p className="font-semibold">{selectedResume.parsed_data.personal_info.phone}</p>
                    </div>
                  </div>
                )}
                {selectedResume.parsed_data.personal_info.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs font-mono text-gray-500">LOCATION</p>
                      <p className="font-semibold">{selectedResume.parsed_data.personal_info.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedResume.parsed_data.summary && (
            <div className="card">
              <div className="mb-4">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <FileText size={24} />
                  PROFESSIONAL SUMMARY
                </h2>
                <div className="flex items-center gap-3">
                  <div className="meta-line"></div>
                  <span className="meta-text">AI EXTRACTED</span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{selectedResume.parsed_data.summary}</p>
            </div>
          )}

          {/* Experience */}
          {selectedResume.parsed_data.experience && selectedResume.parsed_data.experience.length > 0 && (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <Briefcase size={24} />
                  WORK EXPERIENCE
                </h2>
                <div className="flex items-center gap-3">
                  <div className="meta-line"></div>
                  <span className="meta-text">PARSED FROM RESUME</span>
                </div>
              </div>

              <div className="space-y-6">
                {selectedResume.parsed_data.experience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-black pl-6 pb-4">
                    <h3 className="font-black text-lg">{exp.position || exp.title}</h3>
                    <p className="text-gray-700 font-semibold">{exp.company}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm">
                      {exp.location && (
                        <span className="text-gray-600 font-mono">{exp.location}</span>
                      )}
                      {exp.location && (exp.start_date || exp.duration) && (
                        <span className="text-gray-400">•</span>
                      )}
                      {(exp.start_date || exp.duration) && (
                        <span className="text-gray-500 font-mono">
                          {exp.duration || `${exp.start_date} - ${exp.end_date || 'Present'}`}
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-gray-600 text-sm mt-3 leading-relaxed">{exp.description}</p>
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {exp.achievements.map((achievement, idx) => (
                          <li key={idx} className="text-gray-600 text-sm flex items-start gap-2">
                            <span className="text-black mt-1">▪</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {selectedResume.parsed_data.education && selectedResume.parsed_data.education.length > 0 && (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <GraduationCap size={24} />
                  EDUCATION
                </h2>
                <div className="flex items-center gap-3">
                  <div className="meta-line"></div>
                  <span className="meta-text">PARSED FROM RESUME</span>
                </div>
              </div>

              <div className="space-y-4">
                {selectedResume.parsed_data.education.map((edu, index) => (
                  <div key={index} className="border-l-2 border-black pl-6 pb-4">
                    <h3 className="font-black text-lg">{edu.degree}</h3>
                    <p className="text-gray-700 font-semibold">{edu.institution}</p>
                    {edu.field && (
                      <p className="text-gray-600 text-sm mt-1">{edu.field}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-sm">
                      {(edu.year || edu.start_date) && (
                        <span className="text-gray-500 font-mono">
                          {edu.year || `${edu.start_date} - ${edu.end_date || 'Present'}`}
                        </span>
                      )}
                      {edu.gpa && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600 font-mono">GPA: {edu.gpa}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {selectedResume.parsed_data.skills && (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <Code size={24} />
                  SKILLS
                </h2>
                <div className="flex items-center gap-3">
                  <div className="meta-line"></div>
                  <span className="meta-text">AI EXTRACTED</span>
                </div>
              </div>

              {Array.isArray(selectedResume.parsed_data.skills) ? (
                <div className="flex flex-wrap gap-2">
                  {selectedResume.parsed_data.skills.map((skill: string, index: number) => {
                    const skillName = skill;
                    return (
                      <span
                        key={index}
                        className="px-4 py-2 bg-black text-white rounded-lg font-semibold text-sm"
                      >
                        {skillName}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const s = selectedResume.parsed_data.skills as { technical_skills?: string[]; soft_skills?: string[]; tools?: string[]; languages?: string[] } | undefined;
                    if (!s) return null;
                    return (<>
                  {s.technical_skills && s.technical_skills.length > 0 && (
                    <div>
                      <h3 className="font-black text-sm mb-2 text-gray-600">TECHNICAL SKILLS</h3>
                      <div className="flex flex-wrap gap-2">
                        {s.technical_skills.map((skill: string, index: number) => (
                          <span key={index} className="px-4 py-2 bg-black text-white rounded-lg font-semibold text-sm">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {s.soft_skills && s.soft_skills.length > 0 && (
                    <div>
                      <h3 className="font-black text-sm mb-2 text-gray-600">SOFT SKILLS</h3>
                      <div className="flex flex-wrap gap-2">
                        {s.soft_skills.map((skill: string, index: number) => (
                          <span key={index} className="px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold text-sm">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {s.tools && s.tools.length > 0 && (
                    <div>
                      <h3 className="font-black text-sm mb-2 text-gray-600">TOOLS & TECHNOLOGIES</h3>
                      <div className="flex flex-wrap gap-2">
                        {s.tools.map((skill: string, index: number) => (
                          <span key={index} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold text-sm">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {s.languages && s.languages.length > 0 && (
                    <div>
                      <h3 className="font-black text-sm mb-2 text-gray-600">LANGUAGES</h3>
                      <div className="flex flex-wrap gap-2">
                        {s.languages.map((skill: string, index: number) => (
                          <span key={index} className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold text-sm">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  </>);
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Certifications */}
          {selectedResume.parsed_data.certifications && selectedResume.parsed_data.certifications.length > 0 && (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <FileText size={24} />
                  CERTIFICATIONS
                </h2>
                <div className="flex items-center gap-3">
                  <div className="meta-line"></div>
                  <span className="meta-text">PARSED FROM RESUME</span>
                </div>
              </div>

              <div className="space-y-4">
                {selectedResume.parsed_data.certifications.map((cert, index) => (
                  <div key={index} className="border-l-2 border-black pl-6 pb-4">
                    <h3 className="font-black text-lg">{cert.name}</h3>
                    {cert.issuer && (
                      <p className="text-gray-700 font-semibold">{cert.issuer}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-sm">
                      {cert.date && (
                        <span className="text-gray-500 font-mono">{cert.date}</span>
                      )}
                      {cert.credential_id && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600 font-mono">ID: {cert.credential_id}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {selectedResume.parsed_data.projects && selectedResume.parsed_data.projects.length > 0 && (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <Code size={24} />
                  PROJECTS
                </h2>
                <div className="flex items-center gap-3">
                  <div className="meta-line"></div>
                  <span className="meta-text">PARSED FROM RESUME</span>
                </div>
              </div>

              <div className="space-y-6">
                {selectedResume.parsed_data.projects.map((project, index) => (
                  <div key={index} className="border-l-2 border-black pl-6 pb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-lg">{project.name}</h3>
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-mono"
                        >
                          [link]
                        </a>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-gray-600 text-sm mt-2 leading-relaxed">{project.description}</p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {project.technologies.map((tech, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-xs font-mono">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          {selectedResume.parsed_data.awards && selectedResume.parsed_data.awards.length > 0 && (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <FileText size={24} />
                  AWARDS & ACHIEVEMENTS
                </h2>
                <div className="flex items-center gap-3">
                  <div className="meta-line"></div>
                  <span className="meta-text">PARSED FROM RESUME</span>
                </div>
              </div>

              <ul className="space-y-2">
                {selectedResume.parsed_data.awards.map((award, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-black mt-1 font-black">▪</span>
                    <span className="text-gray-700">{award}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {selectedResume && !selectedResume.parsed_data && (
        <div className="card">
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2 font-semibold">NO PARSED DATA AVAILABLE</p>
            <p className="text-gray-500 text-sm font-mono">The resume parsing may still be in progress or failed.</p>
          </div>
        </div>
      )}
    </div>
  );
}
