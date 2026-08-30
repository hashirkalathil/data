'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  Edit3, 
  Printer, 
  ExternalLink, 
  FileText, 
  User, 
  ShieldCheck, 
  Plane, 
  CreditCard, 
  FolderCheck,
  CheckCircle2
} from 'lucide-react';

interface CandidateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Record<string, any> | null;
}

export function CandidateDrawer({
  isOpen,
  onClose,
  candidate,
}: CandidateDrawerProps) {
  const [activeTab, setActiveTab] = useState<'passport' | 'overview' | 'travel' | 'documents' | 'finance'>('passport');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  if (!isOpen || !candidate) return null;

  // Helper to check if a value is truly present and meaningful
  const hasValue = (val: any): boolean => {
    if (val === null || val === undefined) return false;
    const str = String(val).trim();
    return str !== '' && str !== '—' && str !== '-' && str !== 'undefined' && str !== 'null' && str !== 'N/A';
  };

  // Helper to find field value case-insensitively with partial matching
  const getField = (patterns: string[]): string => {
    for (const pat of patterns) {
      const lowerPat = pat.toLowerCase();
      // First exact lower-case match
      for (const key of Object.keys(candidate)) {
        if (key.toLowerCase() === lowerPat) {
          return candidate[key] ? String(candidate[key]).trim() : '';
        }
      }
      // Then includes match
      for (const key of Object.keys(candidate)) {
        if (key.toLowerCase().includes(lowerPat)) {
          return candidate[key] ? String(candidate[key]).trim() : '';
        }
      }
    }
    return '';
  };

  const slNo = getField(['Sl No.', 'Sl No', 'slno', 'id']);
  const candidateName = getField(['Candidate Name', 'Full Name', 'Name']) || 'Candidate Details';
  const passportNo = getField(['Passport No. ( in capital letters)', 'Passport Number', 'Passport No']);
  const country = getField(['Country Applied', 'Country Applied For', 'Country']);
  const trade = getField(['Trade', 'Profession', 'Job Category']);
  const mobile = getField(['Mobile Number', 'Contact Number', 'Phone', 'Mobile']);
  const medicalStatus = getField(['Medical Status', 'Fitness Status', 'Medical']);
  const flightDate = getField(['Flight Date', 'Date of Departure']);
  
  // Document links (only those that actually exist and have valid URLs)
  const docFields = [
    { label: 'Passport Photo', value: getField(['photo (passport size)', 'photo upload', 'person photo']) },
    { label: 'Passport Front Copy', value: getField(['passport photo (front)', 'passport copy front', 'passport front']) },
    { label: 'Passport Back Copy', value: getField(['passport photo (back)', 'passport copy back', 'passport back']) },
    { label: 'Aadhar Card (Front)', value: getField(['aadhar image (front)', 'aadhar front', 'aadhar image']) },
    { label: 'Aadhar Card (Back)', value: getField(['aadhar image (back)', 'aadhar back']) },
    { label: 'PAN Card', value: getField(['pancard image', 'pan card image', 'pancard']) },
    { label: 'Bank Passbook', value: getField(['bank pasbook', 'bank passbook']) },
    { label: 'Medical Documents', value: getField(['medical documents', 'medical report']) },
  ].filter(doc => doc.value && typeof doc.value === 'string' && doc.value.startsWith('http'));

  const avatarUrl = getField(['photo (passport size)', 'photo upload']);

  // Tab 1: Personal & Contact Fields
  const personalFields = [
    { label: "Father's Name", value: getField(["Father's Name", 'Father Name']) },
    { label: "Mother's Name", value: getField(["Mother's Name", 'Mother Name']) },
    { label: "Date of Birth", value: getField(['DOB', 'Date of Birth']) },
    { label: "Age", value: getField(['Age']) },
    { label: "Gender", value: getField(['Gender']) },
    { label: "Religion", value: getField(['Religion']) },
    { label: "Marital Status", value: getField(['Marital Status']) },
    { label: "Education / Qualification", value: getField(['Education', 'Qualification']) },
  ];

  const contactFields = [
    { label: "Primary Mobile", value: mobile },
    { label: "Alternate Mobile", value: getField(['Alternate Mobile Number', 'Alt Mobile']) },
    { label: "Address", value: getField(['Address', 'Present Address']), fullWidth: true },
    { label: "District", value: getField(['District']) },
    { label: "State", value: getField(['State']) },
    { label: "Pin Code", value: getField(['Pin Code', 'Pincode']) },
  ];

  // Tab 1: Passport & Identity Fields
  const passportFields = [
    { label: "Passport Number", value: passportNo, isMono: true },
    { label: "Date of Expiry", value: getField(['Date of Expiry', 'Passport Expiry Date', 'Passport Expiry', 'Expiry Date']) },
    { label: "Date of Issue", value: getField(['Date of Issue', 'Passport Issue Date', 'Issue Date']) },
    { label: "Place of Issue", value: getField(['Place of Issue', 'Issue Place']) },
    { label: "ECR / ECNR", value: getField(['ECR / ECNR', 'ECR/ECNR', 'ECR Status']) },
  ];

  const govtIdFields = [
    { label: "Aadhar Card No.", value: getField(['Aadhar Number', 'Aadhar No']), isMono: true },
    { label: "PAN Card No.", value: getField(['PAN Number', 'Pan No', 'PAN']), isMono: true },
  ];

  // Tab 3: Travel & Visa Fields
  const visaFields = [
    { label: "Country Applied For", value: country },
    { label: "Job Trade / Category", value: trade },
    { label: "Visa Type", value: getField(['Visa Type']) },
    { label: "Visa Number", value: getField(['Visa Number', 'Visa No']), isMono: true },
    { label: "Visa Stamping Date", value: getField(['Visa Stamping Date']) },
    { label: "Visa Expiry Date", value: getField(['Visa Expiry Date']) },
  ];

  const medicalFlightFields = [
    { label: "Medical Center", value: getField(['Medical Center Name', 'Medical Center']) },
    { label: "Medical Fitness", value: medicalStatus },
    { label: "Flight Departure Date", value: flightDate },
    { label: "Sector / Route", value: getField(['Sector / Destination', 'Flight Sector', 'Sector']) },
    { label: "PNR Number", value: getField(['PNR Number', 'PNR']), isMono: true },
    { label: "Ticket Status", value: getField(['Ticket Status']) },
  ];

  // Tab 4: Finance & Agent Fields
  const paymentFields = [
    { label: "Total Agreed Amount", value: getField(['Agreed Amount', 'Total Amount']) },
    { label: "Advance Paid", value: getField(['Advance Paid', 'Advance']) },
    { label: "Balance Amount", value: getField(['Balance Amount', 'Balance']) },
    { label: "Payment Mode", value: getField(['Payment Mode', 'Mode of Payment']) },
  ];

  const agentFields = [
    { label: "Collected By", value: getField(['Collected by', 'Collected By']) },
    { label: "Agent Name", value: getField(['Agent Name', 'Agent']) },
    { label: "Sub Agent", value: getField(['Sub Agent Name', 'Sub Agent']) },
    { label: "Remarks / Notes", value: getField(['Remarks', 'Notes']), fullWidth: true },
  ];

  // Any other non-empty custom columns from sheet that weren't captured above
  const standardLowerKeys = new Set([
    'sl no.', 'sl no', 'slno', 'id', 'candidate name', 'name', 'full name',
    'passport no. ( in capital letters)', 'passport number', 'passport no',
    'country applied', 'country applied for', 'country', 'trade', 'profession', 'job category',
    'mobile number', 'contact number', 'phone', 'mobile',
    'medical status', 'fitness status', 'medical', 'visa status', 'visa type', 'visa number',
    'flight date', 'date of departure',
    'photo (passport size)', 'photo upload', 'person photo',
    'passport photo (front)', 'passport copy front', 'passport front',
    'passport photo (back)', 'passport copy back', 'passport back',
    'aadhar image (front)', 'aadhar front', 'aadhar image',
    'aadhar image (back)', 'aadhar back',
    'pancard image', 'pan card image', 'pancard',
    'bank pasbook', 'bank passbook',
    'medical documents', 'medical report',
    "father's name", 'father name', "mother's name", 'mother name',
    'dob', 'date of birth', 'age', 'gender', 'religion', 'marital status', 'education', 'qualification',
    'alternate mobile number', 'alt mobile', 'address', 'present address', 'district', 'state', 'pin code', 'pincode',
    'place of issue', 'date of issue', 'date of expiry', 'ecr / ecnr', 'ecr/ecnr',
    'aadhar number', 'aadhar no', 'pan number', 'pan no', 'pan',
    'visa stamping date', 'visa expiry date',
    'medical center name', 'medical center',
    'sector / destination', 'flight sector', 'sector', 'pnr number', 'pnr', 'ticket status',
    'agreed amount', 'total amount', 'advance paid', 'advance', 'balance amount', 'balance', 'payment mode', 'mode of payment',
    'collected by', 'agent name', 'agent', 'sub agent name', 'sub agent', 'remarks', 'notes'
  ]);

  const otherFields = Object.entries(candidate)
    .filter(([k, v]) => !standardLowerKeys.has(k.toLowerCase().trim()) && hasValue(v) && !String(v).startsWith('http'))
    .map(([k, v]) => ({ label: k, value: String(v).trim() }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-16 w-16 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-indigo-50 flex items-center justify-center shrink-0">
                  {avatarUrl && avatarUrl.startsWith('http') ? (
                    <img 
                      src={avatarUrl} 
                      alt={candidateName} 
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setZoomImage(avatarUrl)}
                    />
                  ) : (
                    <span className="text-xl font-bold text-indigo-600">
                      {(candidateName[0] || 'C').toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900 truncate">
                      {candidateName}
                    </h2>
                    {slNo && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
                        #{slNo}
                      </span>
                    )}
                  </div>
                  {passportNo ? (
                    <p className="text-sm text-slate-500 font-mono mt-0.5">
                      Passport: <span className="font-semibold text-slate-800">{passportNo}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 font-mono mt-0.5 italic">
                      No Passport Specified
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                    {country && (
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                        {country}
                      </span>
                    )}
                    {trade && (
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {trade}
                      </span>
                    )}
                    {medicalStatus && (
                      <span className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 ${
                        medicalStatus.toLowerCase().includes('fit') 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <CheckCircle2 className="h-3 w-3" /> {medicalStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {slNo && (
                  <Link
                    href={`/edit?id=${slNo}`}
                    className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
                    title="Edit Candidate"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Link>
                )}
                <button
                  onClick={handlePrint}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Print Profile"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Close Drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 mt-6 border-b border-slate-200 overflow-x-auto text-xs font-medium scrollbar-none">
              {[
                { id: 'passport', label: 'Passport & Identity', icon: ShieldCheck },
                { id: 'overview', label: 'Personal & Contact', icon: User },
                { id: 'travel', label: 'Visa & Travel', icon: Plane },
                { id: 'documents', label: `Documents (${docFields.length})`, icon: FolderCheck },
                { id: 'finance', label: 'Finance & Agent', icon: CreditCard },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Tab: Passport & Identity (First Section) */}
            {activeTab === 'passport' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Passport Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {passportFields.map((f, i) => (
                      <DetailItem key={i} label={f.label} value={f.value} isMono={f.isMono} />
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Government Identification
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {govtIdFields.map((f, i) => (
                      <DetailItem key={i} label={f.label} value={f.value} isMono={f.isMono} />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Tab: Personal & Contact */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {personalFields.map((f, i) => (
                      <DetailItem key={i} label={f.label} value={f.value} />
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Contact & Address
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {contactFields.map((f, i) => (
                      <DetailItem key={i} label={f.label} value={f.value} fullWidth={f.fullWidth} />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Tab: Travel & Visa */}
            {activeTab === 'travel' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Visa & Application
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {visaFields.map((f, i) => (
                      <DetailItem key={i} label={f.label} value={f.value} isMono={f.isMono} />
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Medical & Flight Status
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {medicalFlightFields.map((f, i) => (
                      <DetailItem key={i} label={f.label} value={f.value} isMono={f.isMono} />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Tab: Documents */}
            {activeTab === 'documents' && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Uploaded Verification Documents ({docFields.length})
                </h3>
                {docFields.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
                    <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">No documents uploaded</p>
                    <p className="text-xs text-slate-400 mt-1">Upload files by editing this candidate record.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {docFields.map((doc, idx) => {
                      const isPdf = doc.value.toLowerCase().endsWith('.pdf') || doc.value.includes('.pdf');
                      return (
                        <div 
                          key={idx}
                          className="group relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="h-36 w-full rounded-lg bg-white overflow-hidden flex items-center justify-center border border-slate-100 relative">
                            {isPdf ? (
                              <div className="flex flex-col items-center justify-center p-4 text-center">
                                <FileText className="h-10 w-10 text-rose-500 mb-1" />
                                <span className="text-[11px] font-semibold text-slate-700">PDF Document</span>
                              </div>
                            ) : (
                              <img 
                                src={doc.value} 
                                alt={doc.label} 
                                className="w-full h-full object-contain cursor-zoom-in"
                                onClick={() => setZoomImage(doc.value)}
                              />
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {doc.label}
                            </span>
                            <a
                              href={doc.value}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 shrink-0 ml-1"
                            >
                              Open <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Finance & Agent */}
            {activeTab === 'finance' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Payment & Balance
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentFields.map((f, i) => (
                      <DetailItem key={i} label={f.label} value={f.value} />
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Agent & Collection Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {agentFields.map((f, i) => (
                      <DetailItem key={i} label={f.label} value={f.value} fullWidth={f.fullWidth} />
                    ))}
                  </div>
                </section>

                {otherFields.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Other Recorded Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {otherFields.map((f, i) => (
                        <DetailItem key={i} label={f.label} value={f.value} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Record ID: <span className="font-semibold text-slate-700">#{slNo || 'N/A'}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              {slNo && (
                <Link
                  href={`/edit?id=${slNo}`}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Candidate
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Zoom Image Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-900 transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <img 
              src={zoomImage} 
              alt="Zoomed document" 
              className="max-h-[85vh] max-w-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  isMono = false,
  fullWidth = false,
}: {
  label: string;
  value?: string;
  isMono?: boolean;
  fullWidth?: boolean;
}) {
  const trimmed = value && typeof value === 'string' ? value.trim() : '';
  const isEmpty = !trimmed || trimmed === '—' || trimmed === '-' || trimmed === 'undefined' || trimmed === 'null' || trimmed === 'N/A';

  return (
    <div className={`p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 shadow-2xs ${fullWidth ? 'col-span-2' : ''}`}>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</span>
      {isEmpty ? (
        <span className="block text-xs sm:text-sm text-slate-300 font-mono italic">—</span>
      ) : (
        <span className={`block text-xs sm:text-sm text-slate-800 font-semibold break-words ${isMono ? 'font-mono' : ''}`}>
          {trimmed}
        </span>
      )}
    </div>
  );
}
