"use client";
import { useCompletion } from 'ai/react';
import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

const SCAGeneratorClient: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [patientNotes, setPatientNotes] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [markScheme, setMarkScheme] = useState('');
  const [currentSection, setCurrentSection] = useState<'patient' | 'doctor' | 'mark' | null>(null);

  const patientNotesRef = useRef<HTMLDivElement>(null);
  const doctorNotesRef = useRef<HTMLDivElement>(null);
  const markSchemeRef = useRef<HTMLDivElement>(null);

  const {
    complete: completePatient,
    completion: patientCompletion,
    isLoading: isPatientLoading,
  } = useCompletion({
    api: '/api/sca-generator',
    onFinish: (result) => setPatientNotes(result)
  });

  const {
    complete: completeDoctor,
    completion: doctorCompletion,
    isLoading: isDoctorLoading,
  } = useCompletion({
    api: '/api/sca-generator',
    onFinish: (result) => setDoctorNotes(result)
  });

  const {
    complete: completeMark,
    completion: markCompletion,
    isLoading: isMarkLoading,
  } = useCompletion({
    api: '/api/sca-generator',
    onFinish: (result) => setMarkScheme(result)
  });

  const generateContent = async (action: string, section: 'patient' | 'doctor' | 'mark') => {
    setCurrentSection(section);
    const body = {
      action,
      domain,
      additionalInfo,
      patientNotes,
      doctorNotes
    };

    let result;
    switch (section) {
      case 'patient':
        result = await completePatient('', { body });
        if (result) setPatientNotes(result);
        break;
      case 'doctor':
        result = await completeDoctor('', { body });
        if (result) setDoctorNotes(result);
        break;
      case 'mark':
        result = await completeMark('', { body });
        if (result) setMarkScheme(result);
        break;
    }
  };

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGeneratePatientNotes = async () => {
    scrollToRef(patientNotesRef);
    await generateContent('generatePatientNotes', 'patient');
  };

  const handleGenerateDoctorNotes = async () => {
    scrollToRef(doctorNotesRef);
    await generateContent('generateDoctorNotes', 'doctor');
  };

  const handleGenerateMarkScheme = async () => {
    scrollToRef(markSchemeRef);
    await generateContent('generateMarkScheme', 'mark');
  };

  const handleGenerateRandomCase = async () => {
    const domains = [
      "patient-less-than-19-years-old",
      "gender-reproductive-sexual-health",
      "long-term-condition",
      "older-adults",
      "mental-health",
      "urgent-unscheduled-care",
      "health-disadvantages-vulnerabilities",
      "new-presentation-undifferentiated-disease"
    ];
    
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    setDomain(randomDomain);
    
    setDoctorNotes('');
    setMarkScheme('');
    
    scrollToRef(patientNotesRef);
    await generateContent('generatePatientNotes', 'patient');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-center">SCA Case Generator</h1>
        <p className="text-center text-gray-600">Generate practice cases for your GP SCA exam preparation</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 border">
        <button 
          onClick={handleGenerateRandomCase}
          disabled={isPatientLoading}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 w-full font-medium transition-all hover:from-orange-600 hover:to-orange-700 shadow-sm"
        >
          {isPatientLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full size-4 border-2 border-b-transparent border-white"></span>
              Generating...
            </span>
          ) : 'Generate Random Case'}
        </button>
        
        <p className="text-center text-sm text-gray-500">
          Generate a random case above or customize your case below
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 border">
        <div className="space-y-2">
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700">Domain</label>
          <select 
            id="domain"
            value={domain} 
            onChange={(e) => setDomain(e.target.value)}
            className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Domain</option>
            <option value="patient-less-than-19-years-old">Patient less than 19 years old</option>
            <option value="gender-reproductive-sexual-health">Gender, reproductive and sexual health, including women&apos;s, men&apos;s, LGBTQ+, gynaecology and breast</option>
            <option value="long-term-condition">Long-term condition, including cancer, multi-morbidity, and disability</option>
            <option value="older-adults">Older adults, including frailty and end of life care</option>
            <option value="mental-health">Mental health, including addiction, alcohol and substance misuse</option>
            <option value="urgent-unscheduled-care">Urgent and unscheduled care</option>
            <option value="health-disadvantages-vulnerabilities">Health disadvantages and vulnerabilities, including veterans, mental capacity, safeguarding, and communication difficulties</option>
            <option value="new-presentation-undifferentiated-disease">New presentation of undifferentiated disease</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">Additional Information</label>
          <textarea
            id="additionalInfo"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Enter any specific requirements or focus areas"
            className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
          />
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <button 
            onClick={handleGeneratePatientNotes}
            disabled={isPatientLoading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 font-medium transition-all hover:from-blue-600 hover:to-blue-700 shadow-sm"
          >
            {isPatientLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full size-4 border-2 border-b-transparent border-white"></span>
                Generating...
              </span>
            ) : 'Generate Patient Notes'}
          </button>
          <div 
            ref={patientNotesRef}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              className="prose max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-p:text-gray-600 prose-strong:text-gray-900"
            >
              {currentSection === 'patient' ? patientCompletion : patientNotes}
            </ReactMarkdown>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleGenerateDoctorNotes} 
            disabled={(!patientNotes && !patientCompletion) || isDoctorLoading}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 font-medium transition-all hover:from-green-600 hover:to-green-700 shadow-sm"
          >
            {isDoctorLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full size-4 border-2 border-b-transparent border-white"></span>
                Generating...
              </span>
            ) : 'Generate Doctor Notes'}
          </button>
          <div 
            ref={doctorNotesRef}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              className="prose max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-p:text-gray-600 prose-strong:text-gray-900"
            >
              {currentSection === 'doctor' ? doctorCompletion : doctorNotes}
            </ReactMarkdown>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleGenerateMarkScheme} 
            disabled={(!doctorNotes && !doctorCompletion) || isMarkLoading}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 font-medium transition-all hover:from-purple-600 hover:to-purple-700 shadow-sm"
          >
            {isMarkLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full size-4 border-2 border-b-transparent border-white"></span>
                Generating...
              </span>
            ) : 'Generate Mark Scheme'}
          </button>
          <div 
            ref={markSchemeRef}
            className="bg-white p-6 rounded-lg shadow-sm border"
          >
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              className="prose max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-p:text-gray-600 prose-strong:text-gray-900"
            >
              {currentSection === 'mark' ? markCompletion : markScheme}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SCAGeneratorClient;