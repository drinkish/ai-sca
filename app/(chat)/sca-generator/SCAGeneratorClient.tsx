/* eslint-disable react/no-unescaped-entities */
"use client";


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

  const patientNotesRef = useRef<HTMLDivElement>(null);
  const doctorNotesRef = useRef<HTMLDivElement>(null);
  const markSchemeRef = useRef<HTMLDivElement>(null);

  const generateContent = async (action: string) => {
    const response = await fetch('/api/sca-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        domain,
        additionalInfo,
        patientNotes,
        doctorNotes,
      }),
    });
    const data = await response.json();
    return data.result;
  };

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGeneratePatientNotes = async () => {
    const result = await generateContent('generatePatientNotes');
    setPatientNotes(result);
    scrollToRef(patientNotesRef);
  };

  const handleGenerateDoctorNotes = async () => {
    const result = await generateContent('generateDoctorNotes');
    setDoctorNotes(result);
    scrollToRef(doctorNotesRef);
  };

  const handleGenerateMarkScheme = async () => {
    const result = await generateContent('generateMarkScheme');
    setMarkScheme(result);
    scrollToRef(markSchemeRef);
  };

  return (
    <div className="space-y-4">
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
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Generate Patient Notes
      </button>
      <div 
        ref={patientNotesRef}
        className="bg-gray-100 p-4 rounded text-left font-sans text-sm overflow-auto max-h-96"
      >
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          className="prose max-w-none"
        >{patientNotes}</ReactMarkdown>
      </div>
      
      <button 
        onClick={handleGenerateDoctorNotes} 
        disabled={!patientNotes}
        className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Generate Doctor's Notes
      </button>
      <div 
        ref={doctorNotesRef}
        className="bg-gray-100 p-4 rounded text-left font-sans text-sm overflow-auto max-h-96"
      >
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          className="prose max-w-none"
        >{doctorNotes}</ReactMarkdown>
      </div>
      
      <button 
        onClick={handleGenerateMarkScheme} 
        disabled={!doctorNotes}
        className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Generate Mark Scheme
      </button>
      <div 
        ref={markSchemeRef}
        className="bg-gray-100 p-4 rounded text-left font-sans text-sm overflow-auto max-h-96"
      >
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          className="prose max-w-none"
        >{markScheme}</ReactMarkdown>
      </div>
    </div>
  );
};

export default SCAGeneratorClient;