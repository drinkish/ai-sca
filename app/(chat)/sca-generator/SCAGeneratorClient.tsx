"use client";

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { useCompletion } from 'ai/react';

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
    
    // Clear doctor notes and mark scheme, but don't clear patient notes immediately
    setDoctorNotes('');
    setMarkScheme('');
    
    // Generate new case
    scrollToRef(patientNotesRef);
    await generateContent('generatePatientNotes', 'patient');
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={handleGenerateRandomCase}
        disabled={isPatientLoading}
        className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
      >
        {isPatientLoading ? 'Generating...' : 'Generate Random Case'}
      </button>
      
      <p className="text-center text-sm text-gray-500">
        Generate a random case above or select a specific domain below
      </p>

      <div>
        <label htmlFor="domain" className="block mb-2">Select Domain:</label>
        <select 
          id="domain"
          value={domain} 
          onChange={(e) => setDomain(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select Domain</option>
          <option value="patient-less-than-19-years-old">Patient less than 19 years old</option>
          <option value="gender-reproductive-sexual-health">Gender, reproductive and sexual health, including women's, men's, LGBTQ+, gynaecology and breast</option>
          <option value="long-term-condition">Long-term condition, including cancer, multi-morbidity, and disability</option>
          <option value="older-adults">Older adults, including frailty and end of life care</option>
          <option value="mental-health">Mental health, including addiction, alcohol and substance misuse</option>
          <option value="urgent-unscheduled-care">Urgent and unscheduled care</option>
          <option value="health-disadvantages-vulnerabilities">Health disadvantages and vulnerabilities, including veterans, mental capacity, safeguarding, and communication difficulties</option>
          <option value="new-presentation-undifferentiated-disease">New presentation of undifferentiated disease</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="additionalInfo" className="block mb-2">Additional Information:</label>
        <textarea
          id="additionalInfo"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Enter additional information"
          className="w-full p-2 border rounded"
          rows={4}
        />
      </div>
      
      <button 
        onClick={handleGeneratePatientNotes}
        disabled={isPatientLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPatientLoading ? 'Generating...' : 'Generate Patient Notes'}
      </button>
      <div 
        ref={patientNotesRef}
        className="bg-gray-100 p-4 rounded text-left font-sans text-sm overflow-auto max-h-96"
      >
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          className="prose max-w-none"
        >
          {currentSection === 'patient' ? patientCompletion : patientNotes}
        </ReactMarkdown>
      </div>
      
      <button 
        onClick={handleGenerateDoctorNotes} 
        disabled={(!patientNotes && !patientCompletion) || isDoctorLoading}
        className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isDoctorLoading ? 'Generating...' : 'Generate Doctor\'s Notes'}
      </button>
      <div 
        ref={doctorNotesRef}
        className="bg-gray-100 p-4 rounded text-left font-sans text-sm overflow-auto max-h-96"
      >
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          className="prose max-w-none"
        >
          {currentSection === 'doctor' ? doctorCompletion : doctorNotes}
        </ReactMarkdown>
      </div>
      
      <button 
        onClick={handleGenerateMarkScheme} 
        disabled={(!doctorNotes && !doctorCompletion) || isMarkLoading}
        className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isMarkLoading ? 'Generating...' : 'Generate Mark Scheme'}
      </button>
      <div 
        ref={markSchemeRef}
        className="bg-gray-100 p-4 rounded text-left font-sans text-sm overflow-auto max-h-96"
      >
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          className="prose max-w-none"
        >
          {currentSection === 'mark' ? markCompletion : markScheme}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default SCAGeneratorClient;