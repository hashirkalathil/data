'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  Plane,
  FolderCheck,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  UploadCloud,
  FileText,
  Trash2,
  ExternalLink,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface CandidateFormProps {
  mode: 'add' | 'edit';
  id?: string | null;
}

const STEPS = [
  { id: 1, label: 'Personal Details', desc: 'Basic info & address', icon: User },
  { id: 2, label: 'Passport & Identity', desc: 'Passport, Aadhar & PAN', icon: ShieldCheck },
  { id: 3, label: 'Travel & Visa', desc: 'Medical, visa & flight', icon: Plane },
  { id: 4, label: 'Documents & Photos', desc: 'Uploads & verifications', icon: FolderCheck },
  { id: 5, label: 'Finance & Review', desc: 'Payments & final check', icon: CreditCard },
];

export function CandidateForm({ mode, id }: CandidateFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [currentUser, setCurrentUser] = useState<string>('');
  const [initialData, setInitialData] = useState<Record<string, any>>({});
  const [collectedByType, setCollectedByType] = useState<'Me' | 'Other'>('Me');

  // File upload state
  const [filePerson, setFilePerson] = useState<File | null>(null);
  const [fileFront, setFileFront] = useState<File | null>(null);
  const [fileBack, setFileBack] = useState<File | null>(null);
  const [fileAadharFront, setFileAadharFront] = useState<File | null>(null);
  const [fileAadharBack, setFileAadharBack] = useState<File | null>(null);
  const [filePancard, setFilePancard] = useState<File | null>(null);
  const [filePassbook, setFilePassbook] = useState<File | null>(null);
  const [fileMedical, setFileMedical] = useState<File | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();

  // Watch key fields for calculations and reviews
  const agreedAmount = watch('agreed_amount') || '';
  const advancePaid = watch('advance_paid') || '';
  const dobValue = watch('dob') || '';

  // Calculate remaining balance dynamically
  const calculatedBalance = Math.max(0, (Number(agreedAmount) || 0) - (Number(advancePaid) || 0));

  // Auto-calculate age if DOB is entered
  useEffect(() => {
    if (dobValue && /^\d{4}-\d{2}-\d{2}$/.test(dobValue)) {
      const birth = new Date(dobValue);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      if (age >= 0 && age < 120) {
        setValue('age', String(age));
      }
    }
  }, [dobValue, setValue]);

  // Fetch initial configuration & candidate data (if edit mode)
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // Fetch current user
        try {
          const uRes = await fetch('/api/user');
          const uData = await uRes.json();
          if (uData.user) {
            setCurrentUser(uData.user.name || uData.user.username);
          }
        } catch (e) {
          console.error('Failed to get user', e);
        }

        if (mode === 'edit' && id) {
          // Fetch row data for editing
          const res = await fetch(`/api/data?id=${id}`);
          const resJson = await res.json();

          if (resJson.headers) setColumns(resJson.headers);

          if (resJson.data && resJson.data.length > 0) {
            const row = resJson.data[0];
            setInitialData(row);

            // Populate form fields based on common field names
            if (resJson.headers) {
              resJson.headers.forEach((col: string, idx: number) => {
                let val = row[col];
                // Convert DD/MM/YYYY to YYYY-MM-DD for date inputs
                if (col.toLowerCase().includes('dob') || col.toLowerCase().includes('date')) {
                  if (val && /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(val)) {
                    const [d, m, y] = val.split(/[\/\-]/);
                    val = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                  }
                }
                setValue(`field_${idx}`, val);
              });
            }

            const collectedBy = row['Collected by'];
            if (collectedBy === 'Me' || collectedBy === currentUser) {
              setCollectedByType('Me');
            } else if (collectedBy) {
              setCollectedByType('Other');
              setValue('collected_by_other_input', collectedBy);
            }
          } else {
            alert('Candidate record not found');
            router.push('/');
          }
        } else {
          // Add mode: fetch headers
          const res = await fetch('/api/data?limit=1');
          const resJson = await res.json();
          if (resJson.headers) {
            setColumns(resJson.headers);
          } else if (resJson.data && resJson.data.length > 0) {
            setColumns(Object.keys(resJson.data[0]));
          }
        }
      } catch (err: any) {
        console.error(err);
        alert(`Error initializing form: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [mode, id, router, setValue, currentUser]);

  const uploadFile = async (file: File, filename: string, folderType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);
    formData.append('folderType', folderType);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.webViewLink;
  };

  const handleDeleteExistingDoc = async (colName: string, url: string) => {
    if (!confirm(`Are you sure you want to remove this document?`)) return;

    try {
      if (url.includes('cloudinary.com')) {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
      }

      if (mode === 'edit' && id) {
        await fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slNo: id,
            data: { [colName]: '' },
          }),
        });

        setInitialData((prev) => ({
          ...prev,
          [colName]: '',
        }));
      }

      alert('Document removed successfully');
    } catch (err: any) {
      alert(`Error deleting document: ${err.message}`);
    }
  };

  const onSubmit = async (rawData: any) => {
    try {
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      };

      const data: Record<string, any> = {};

      // Restore data mapped to column headers
      Object.keys(rawData).forEach((k) => {
        if (k.startsWith('field_')) {
          const index = parseInt(k.replace('field_', ''));
          const colName = columns[index];
          if (colName) {
            let value = rawData[k];
            if (colName.toLowerCase().includes('dob') || colName.toLowerCase().includes('date')) {
              if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                value = formatDate(value);
              }
            }
            data[colName] = value;
          }
        } else {
          data[k] = rawData[k];
        }
      });

      // Handle Collected By
      if (collectedByType === 'Me') {
        data['Collected by'] = currentUser || 'Me';
      } else {
        if (!data['collected_by_other_input']) {
          alert('Please specify who collected the documents in Finance section.');
          setCurrentStep(5);
          return;
        }
        data['Collected by'] = data['collected_by_other_input'];
      }
      delete data['collected_by_other_input'];

      // Find passport number for file naming
      const ppKey = Object.keys(data).find((k) => /passport\s*no/i.test(k));
      const ppVal = ppKey ? data[ppKey] : (initialData['Passport No. ( in capital letters)'] || '');

      if (!ppVal && (filePerson || fileFront || fileBack || fileAadharFront || fileAadharBack || filePancard || filePassbook || fileMedical)) {
        alert('Please enter a Passport Number in Step 2 before uploading documents.');
        setCurrentStep(2);
        return;
      }

      setUploading(true);
      const getExt = (file: File) => (file.type === 'application/pdf' ? '.pdf' : '.jpg');

      // Upload files
      if (filePerson) {
        setStatusMsg('Uploading Person Photo...');
        const filename = `${ppVal}_person${getExt(filePerson)}`;
        data['photo (passport size)'] = await uploadFile(filePerson, filename, 'photo');
      }
      if (fileFront) {
        setStatusMsg('Uploading Passport Front...');
        const filename = `${ppVal}_passportCopy_front${getExt(fileFront)}`;
        data['passport photo (front)'] = await uploadFile(fileFront, filename, 'copy');
      }
      if (fileBack) {
        setStatusMsg('Uploading Passport Back...');
        const filename = `${ppVal}_passportCopy_back${getExt(fileBack)}`;
        data['passport photo (back)'] = await uploadFile(fileBack, filename, 'copy');
      }
      if (fileAadharFront) {
        setStatusMsg('Uploading Aadhar Front...');
        const filename = `${ppVal}_aadhar_front${getExt(fileAadharFront)}`;
        data['Aadhar Image (front)'] = await uploadFile(fileAadharFront, filename, 'adhar');
      }
      if (fileAadharBack) {
        setStatusMsg('Uploading Aadhar Back...');
        const filename = `${ppVal}_aadhar_back${getExt(fileAadharBack)}`;
        data['Aadhar Image (back)'] = await uploadFile(fileAadharBack, filename, 'adhar');
      }
      if (filePancard) {
        setStatusMsg('Uploading PAN Card...');
        const filename = `${ppVal}_pancard${getExt(filePancard)}`;
        data['pancard image'] = await uploadFile(filePancard, filename, 'pancard');
      }
      if (filePassbook) {
        setStatusMsg('Uploading Bank Passbook...');
        const filename = `${ppVal}_passbook${getExt(filePassbook)}`;
        data['bank pasbook'] = await uploadFile(filePassbook, filename, 'passbook');
      }
      if (fileMedical) {
        setStatusMsg('Uploading Medical Document...');
        const filename = `${ppVal}_medical${getExt(fileMedical)}`;
        data['Medical Documents (If any)'] = await uploadFile(fileMedical, filename, 'medical');
      }

      setStatusMsg('Saving Candidate Record to Google Sheets...');

      if (mode === 'add') {
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create candidate entry');
      } else {
        const res = await fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slNo: id,
            data,
          }),
        });
        if (!res.ok) throw new Error('Failed to update candidate entry');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(`Submission failed: ${err.message}`);
    } finally {
      setUploading(false);
      setStatusMsg('');
    }
  };

  // Helper to categorize which column belongs to which step
  const getStepForColumn = (col: string): number => {
    const c = col.toLowerCase();
    // Ignore Sl No and Image columns from text inputs
    if (c.includes('sl no') || c.includes('photo') || c.includes('image') || c.includes('pasbook') || c.includes('medical doc')) {
      return 0; // Handled separately
    }
    // Step 2: Passport & Gov ID
    if (c.includes('passport') || c.includes('aadhar') || c.includes('pan')) {
      return 2;
    }
    // Step 3: Visa, Travel, Medical fitness
    if (c.includes('visa') || c.includes('country') || c.includes('trade') || c.includes('flight') || c.includes('pnr') || c.includes('sector') || c.includes('ticket') || c.includes('medical center') || c.includes('medical status') || c.includes('fitness')) {
      return 3;
    }
    // Step 5: Finance & Agent
    if (c.includes('amount') || c.includes('advance') || c.includes('balance') || c.includes('payment') || c.includes('agent') || c.includes('collected') || c.includes('remark')) {
      return 5;
    }
    // Default: Step 1 (Personal & Contact)
    return 1;
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium text-slate-500">
          Loading candidate data & form configuration...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-1 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'add' ? 'Add New Candidate' : `Edit Candidate #${id}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {mode === 'add'
              ? 'Complete the 5 steps below to register candidate and upload documents.'
              : 'Modify candidate information or update verification documents.'}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700">
          <span>Step {currentStep} of 5</span>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCurrent = currentStep === step.id;
            const isDone = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`flex flex-col sm:flex-row items-center gap-2 p-2 sm:p-3 rounded-xl transition-all text-left relative ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : isDone
                    ? 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : step.id}
                </div>

                <div className="hidden md:flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate leading-tight">
                    {step.label}
                  </span>
                  <span className={`text-[10px] truncate ${isCurrent ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {step.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          
          {/* Step 1: Personal Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 1: Personal & Contact Information</h2>
                <p className="text-xs text-slate-500">Enter applicant identity, family background, and address</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {columns.map((col, idx) => {
                  if (getStepForColumn(col) !== 1) return null;
                  const fieldKey = `field_${idx}`;
                  const isDate = col.toLowerCase().includes('dob') || col.toLowerCase().includes('date');
                  const isSelectSex = col.toLowerCase() === 'sex' || col.toLowerCase() === 'gender';

                  return (
                    <div key={col} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        {col}
                      </label>
                      {isSelectSex ? (
                        <select
                          {...register(fieldKey)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <input
                          type={isDate ? 'date' : 'text'}
                          {...register(fieldKey)}
                          placeholder={`Enter ${col}`}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Passport & Identification */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 2: Passport & Identification Details</h2>
                <p className="text-xs text-slate-500">Passport numbers and government identification credentials</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {columns.map((col, idx) => {
                  if (getStepForColumn(col) !== 2) return null;
                  const fieldKey = `field_${idx}`;
                  const isDate = col.toLowerCase().includes('date');
                  const isPassport = col.toLowerCase().includes('passport no');

                  return (
                    <div key={col} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        {col} {isPassport && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type={isDate ? 'date' : 'text'}
                        {...register(fieldKey, { required: isPassport })}
                        placeholder={`Enter ${col}`}
                        className={`w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                          isPassport ? 'font-mono uppercase font-bold tracking-wider' : ''
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Travel, Visa & Medical */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 3: Travel, Visa & Medical Status</h2>
                <p className="text-xs text-slate-500">Destination country, profession trade, medical fitness, and flight booking</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {columns.map((col, idx) => {
                  if (getStepForColumn(col) !== 3) return null;
                  const fieldKey = `field_${idx}`;
                  const isDate = col.toLowerCase().includes('date');
                  const isMedicalStatus = col.toLowerCase().includes('medical status') || col.toLowerCase().includes('fitness');

                  if (isMedicalStatus) {
                    return (
                      <div key={col} className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">{col}</label>
                        <select
                          {...register(fieldKey)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="">Select Status</option>
                          <option value="Fit">Fit</option>
                          <option value="Unfit">Unfit</option>
                          <option value="Pending">Pending</option>
                          <option value="In Process">In Process</option>
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div key={col} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">{col}</label>
                      <input
                        type={isDate ? 'date' : 'text'}
                        {...register(fieldKey)}
                        placeholder={`Enter ${col}`}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Documents & Photos */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 4: Documents & Photo Uploads</h2>
                <p className="text-xs text-slate-500">Upload candidate photos, passport scans, identity proofs, and medical documents</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ModernFileCard
                  label="Person Photo (Passport Size)"
                  file={filePerson}
                  setFile={setFilePerson}
                  existingUrl={initialData['photo (passport size)'] || initialData['photo upload']}
                  onDelete={() => handleDeleteExistingDoc('photo (passport size)', initialData['photo (passport size)'] || initialData['photo upload'])}
                />

                <ModernFileCard
                  label="Passport Front Copy"
                  file={fileFront}
                  setFile={setFileFront}
                  existingUrl={initialData['passport photo (front)'] || initialData['passport copy front']}
                  onDelete={() => handleDeleteExistingDoc('passport photo (front)', initialData['passport photo (front)'] || initialData['passport copy front'])}
                />

                <ModernFileCard
                  label="Passport Back Copy"
                  file={fileBack}
                  setFile={setFileBack}
                  existingUrl={initialData['passport photo (back)'] || initialData['passport copy back']}
                  onDelete={() => handleDeleteExistingDoc('passport photo (back)', initialData['passport photo (back)'] || initialData['passport copy back'])}
                />

                <ModernFileCard
                  label="Aadhar Card (Front)"
                  file={fileAadharFront}
                  setFile={setFileAadharFront}
                  existingUrl={initialData['Aadhar Image (front)']}
                  onDelete={() => handleDeleteExistingDoc('Aadhar Image (front)', initialData['Aadhar Image (front)'])}
                />

                <ModernFileCard
                  label="Aadhar Card (Back)"
                  file={fileAadharBack}
                  setFile={setFileAadharBack}
                  existingUrl={initialData['Aadhar Image (back)']}
                  onDelete={() => handleDeleteExistingDoc('Aadhar Image (back)', initialData['Aadhar Image (back)'])}
                />

                <ModernFileCard
                  label="PAN Card"
                  file={filePancard}
                  setFile={setFilePancard}
                  existingUrl={initialData['pancard image']}
                  onDelete={() => handleDeleteExistingDoc('pancard image', initialData['pancard image'])}
                />

                <ModernFileCard
                  label="Bank Passbook"
                  file={filePassbook}
                  setFile={setFilePassbook}
                  existingUrl={initialData['bank pasbook']}
                  onDelete={() => handleDeleteExistingDoc('bank pasbook', initialData['bank pasbook'])}
                />

                <ModernFileCard
                  label="Medical Documents"
                  file={fileMedical}
                  setFile={setFileMedical}
                  existingUrl={initialData['Medical Documents (If any)']}
                  onDelete={() => handleDeleteExistingDoc('Medical Documents (If any)', initialData['Medical Documents (If any)'])}
                />
              </div>
            </div>
          )}

          {/* Step 5: Finance & Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 5: Finance, Agent & Submission Review</h2>
                <p className="text-xs text-slate-500">Review candidate details, payment ledger, and submission confirmation</p>
              </div>

              {/* Finance Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {columns.map((col, idx) => {
                  if (getStepForColumn(col) !== 5) return null;
                  const fieldKey = `field_${idx}`;
                  const isCollectedBy = col.toLowerCase().includes('collected by');

                  if (isCollectedBy) {
                    return (
                      <div key={col} className="space-y-1.5 col-span-1 sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700">{col}</label>
                        <div className="flex items-center gap-3">
                          <select
                            value={collectedByType}
                            onChange={(e) => setCollectedByType(e.target.value as any)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          >
                            <option value="Me">Me ({currentUser || 'Logged-in user'})</option>
                            <option value="Other">Other Person</option>
                          </select>

                          {collectedByType === 'Other' && (
                            <input
                              {...register('collected_by_other_input')}
                              placeholder="Enter Collector Name"
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={col} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">{col}</label>
                      <input
                        type="text"
                        {...register(fieldKey)}
                        placeholder={`Enter ${col}`}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Ready to Submit Banner */}
              <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-5 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {mode === 'add' ? 'Ready to Save New Candidate' : 'Ready to Update Candidate Record'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      All entered details and uploaded documents will be synchronized with Google Sheets.
                    </p>
                  </div>
                </div>

                {uploading && statusMsg && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-white px-3 py-1.5 rounded-lg shadow-xs">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{statusMsg}</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Stepper Footer Controls */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || uploading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all"
              >
                Next Step <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{statusMsg || 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>{mode === 'add' ? 'Register Candidate' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </form>
    </div>
  );
}

function ModernFileCard({
  label,
  file,
  setFile,
  existingUrl,
  onDelete,
}: {
  label: string;
  file: File | null;
  setFile: (f: File | null) => void;
  existingUrl?: string;
  onDelete?: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const isExistingPdf = existingUrl && (existingUrl.toLowerCase().endsWith('.pdf') || existingUrl.includes('.pdf'));
  const isSelectedPdf = file?.type === 'application/pdf';

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex flex-col justify-between h-52 relative group overflow-hidden">
      
      {/* File Present (Existing or Selected) */}
      {existingUrl && !file ? (
        <div className="flex-1 flex flex-col items-center justify-center relative bg-white rounded-lg p-2 border border-slate-100 overflow-hidden">
          {isExistingPdf ? (
            <div className="flex flex-col items-center">
              <FileText className="h-10 w-10 text-rose-500 mb-1" />
              <span className="text-[11px] font-semibold text-slate-700">PDF Document</span>
            </div>
          ) : (
            <img src={existingUrl} alt={label} className="w-full h-full object-contain" />
          )}

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <a
              href={existingUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-white text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              title="Preview File"
            >
              <Eye className="h-4 w-4" />
            </a>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-2 rounded-full bg-white text-rose-600 hover:bg-rose-50 transition-colors shadow-sm"
                title="Delete File"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <span className="absolute bottom-1 right-1 text-[9px] bg-slate-800/80 text-white px-1.5 py-0.5 rounded-sm">
            Saved
          </span>
        </div>
      ) : previewUrl ? (
        <div className="flex-1 flex flex-col items-center justify-center relative bg-white rounded-lg p-2 border border-slate-100 overflow-hidden">
          {isSelectedPdf ? (
            <div className="flex flex-col items-center">
              <FileText className="h-10 w-10 text-indigo-500 mb-1" />
              <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[120px]">{file?.name}</span>
            </div>
          ) : (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          )}

          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <label className="p-2 rounded-full bg-white text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer">
              <UploadCloud className="h-4 w-4" />
              <input
                type="file"
                accept="image/png, image/jpeg, application/pdf"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-2 rounded-full bg-white text-rose-600 hover:bg-rose-50 transition-colors shadow-sm"
              title="Remove File"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <span className="absolute bottom-1 right-1 text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-sm">
            New
          </span>
        </div>
      ) : (
        <label className="flex-1 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-3 text-center transition-colors">
          <div className="p-2.5 rounded-full bg-white shadow-xs text-slate-400 group-hover:text-indigo-600 group-hover:scale-105 transition-all mb-2">
            <UploadCloud className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Select File</span>
          <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, or PDF</span>
          <input
            type="file"
            accept="image/png, image/jpeg, application/pdf"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="hidden"
          />
        </label>
      )}

      <div className="mt-2 text-center">
        <span className="text-xs font-semibold text-slate-800 block truncate" title={label}>
          {label}
        </span>
      </div>
    </div>
  );
}
