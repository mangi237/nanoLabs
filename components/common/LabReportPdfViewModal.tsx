import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  QrCode, 
  Award,
  Sparkles,
  Truck,
  MessageCircle,
  Layers,
  Upload,
  Image as ImageIcon,
  Activity
} from 'lucide-react';
import { PatientBooking, BookingTestItem } from '../../services/limsService';
import { formatDOBDisplay } from '../../data/cameroonInsurances';
import { DEFAULT_HEADER_FOOTER_TEMPLATES, HeaderFooterTemplateConfig } from '../admin/HeaderFooterTemplateManager';

interface LabReportPdfViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: PatientBooking | any;
  labInfo?: any;
}

export const LabReportPdfViewModal: React.FC<LabReportPdfViewModalProps> = ({
  isOpen,
  onClose,
  booking,
  labInfo
}) => {
  const [templates, setTemplates] = useState<HeaderFooterTemplateConfig[]>(DEFAULT_HEADER_FOOTER_TEMPLATES);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  const headerFileInputRef = useRef<HTMLInputElement>(null);
  const footerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nanoLabs_header_footer_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          if (parsed.length === 2) {
            setTemplates([...parsed, DEFAULT_HEADER_FOOTER_TEMPLATES[2], DEFAULT_HEADER_FOOTER_TEMPLATES[3]]);
          } else {
            setTemplates(parsed);
          }
        }
      }
      const activeId = localStorage.getItem('nanoLabs_active_template_id');
      if (activeId) {
        const foundIdx = DEFAULT_HEADER_FOOTER_TEMPLATES.findIndex(t => t.id === activeId);
        if (foundIdx >= 0) setSelectedTemplateIndex(foundIdx);
      }
    } catch {}
  }, []);

  const handleHeaderUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const updated = [...templates];
      const targetIdx = selectedTemplateIndex >= 2 ? selectedTemplateIndex : 2;
      updated[targetIdx] = {
        ...updated[targetIdx],
        headerImageUrl: result,
        useHeaderImageOnly: true
      };
      setTemplates(updated);
      setSelectedTemplateIndex(targetIdx);
      localStorage.setItem('nanoLabs_header_footer_templates', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  const handleFooterUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const updated = [...templates];
      const targetIdx = selectedTemplateIndex >= 2 ? selectedTemplateIndex : 2;
      updated[targetIdx] = {
        ...updated[targetIdx],
        footerImageUrl: result,
        useFooterImageOnly: true
      };
      setTemplates(updated);
      setSelectedTemplateIndex(targetIdx);
      localStorage.setItem('nanoLabs_header_footer_templates', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen || !booking) return null;

  const currentTpl = templates[selectedTemplateIndex] || templates[0] || DEFAULT_HEADER_FOOTER_TEMPLATES[0];

  const labName = currentTpl.labName || labInfo?.name || booking.labName || booking.labDetails?.name || 'nanoLabs Clinical Diagnostics Center';
  const labSlogan = currentTpl.subTitle || labInfo?.slogan || labInfo?.tagline || booking.labDetails?.slogan || 'Accredited Medical Biology & Clinical Laboratory Services';
  const labAddress = currentTpl.address || labInfo?.address || labInfo?.location || booking.labAddress || 'Boulevard de la Liberté, Akwa Medical Hub';
  const labPhone = currentTpl.phone || labInfo?.phone || booking.labPhone || '+237 233 42 88 00';
  const labEmergency = currentTpl.emergencyPhone || '+237 699 92 91 98';
  const labEmail = currentTpl.email || labInfo?.email || booking.labEmail || 'contact@nanolabs-diagnostics.cm';
  const labWebsite = currentTpl.website || labInfo?.website || booking.labWebsite || 'www.nanolabs-diagnostics.cm';
  const labArrete = currentTpl.arreteNumber || 'Arrêté N° 045/A/MINSANTE/SG/DPS/2020';
  const labAgrement = currentTpl.agrementNumber || 'Agrément N° 088/MINSANTE';
  const labTaxId = currentTpl.taxNumber || 'M039900008877A';
  const labDirectorName = currentTpl.directorName || 'Prof. Dr. Roland Enow';
  const labDirectorDiplomas = currentTpl.directorDiplomas || 'MD, PhD in Clinical Biology & Pathology';
  const labDirectorSpecialties = currentTpl.directorSpecialties || 'Clinical Chemistry, Molecular Diagnostics & Automated Hematology';
  const biologistSignatureTitle = currentTpl.biologistSignatureTitle || 'Directeur de Laboratoire & Biologiste Responsable';
  const footerNotes = currentTpl.footerNotes || 'Accredited Laboratory per ISO 15189 standards.';

  const handlePrint = () => {
    window.print();
  };

  // Generate formatted registration, collection, and reporting timestamps
  const registeredTimeStr = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '02:31 PM 02 Dec, 2026';
    
  const collectedTimeStr = booking.sampleCollectedAtDate
    ? new Date(booking.sampleCollectedAtDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(booking.sampleCollectedAtDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '03:11 PM 02 Dec, 2026';

  const reportedTimeStr = (booking.completedAt || booking.tests?.[0]?.completedAt)
    ? new Date(booking.completedAt || booking.tests?.[0]?.completedAt || '').toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(booking.completedAt || booking.tests?.[0]?.completedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '04:35 PM 02 Dec, 2026';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 my-auto max-h-[96vh] flex flex-col">
        
        {/* Top Control Bar (Non-printable) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 text-white shrink-0 print:hidden gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                Official Clinical Laboratory Report Preview
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Verified & Signed
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Order ID: {booking.bookingCode} • Invoice: {booking.invoiceNumber || 'INV-001'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Header/Footer Template Selector */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
              {templates.slice(0, 4).map((tpl, idx) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedTemplateIndex === idx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {idx === 0 ? 'Template 1' : idx === 1 ? 'Template 2' : `Custom ${idx - 1}`}
                </button>
              ))}
            </div>

            {/* Upload Custom Header / Footer Controls */}
            <input 
              type="file" 
              ref={headerFileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files?.[0]) handleHeaderUpload(e.target.files[0]);
              }} 
            />
            <input 
              type="file" 
              ref={footerFileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files?.[0]) handleFooterUpload(e.target.files[0]);
              }} 
            />

            <button
              type="button"
              onClick={() => headerFileInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
              title="Upload custom top letterhead image"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Upload Header</span>
            </button>

            <button
              type="button"
              onClick={() => footerFileInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
              title="Upload custom footer image"
            >
              <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
              <span>Upload Footer</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document Container */}
        <div className="overflow-y-auto flex-1 p-1 sm:p-4 bg-slate-100 my-2 rounded-2xl print:p-0 print:m-0 print:bg-white print:overflow-visible">
          
          <div 
            id="medical-report-sheet"
            className="bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-8 max-w-3xl mx-auto font-sans text-slate-900 print:shadow-none print:border-none print:max-w-none print:p-0 space-y-4"
          >
            
            {/* Top Header: Custom Uploaded Image OR Accredited Layout */}
            {currentTpl.headerImageUrl ? (
              <div className="border-b-2 border-slate-800 pb-2">
                <img 
                  src={currentTpl.headerImageUrl} 
                  alt={labName} 
                  style={{ maxHeight: `${currentTpl.headerImageHeight || 110}px` }}
                  className="w-full object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="border-b-2 border-slate-300 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Lab Branding */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-700 to-sky-500 text-white font-black flex items-center justify-center shadow-md border-2 border-white shrink-0">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                        {labName}
                      </h1>
                      <div className="text-xs font-bold text-sky-700 tracking-wide uppercase">
                        {labSlogan}
                      </div>
                      <div className="text-[10px] text-slate-600 leading-tight max-w-sm mt-0.5">
                        {labAddress} {currentTpl.bpCity ? `• ${currentTpl.bpCity}` : ''}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        {labArrete} • {labAgrement} • N.I.U: {labTaxId}
                      </div>
                    </div>
                  </div>

                  {/* Right Top Contact Bar */}
                  <div className="flex flex-col items-end text-[11px] text-slate-700 space-y-1">
                    <div className="flex items-center gap-1 font-bold text-slate-900">
                      <Phone className="w-3.5 h-3.5 text-blue-700" />
                      <span>{labPhone}</span>
                    </div>
                    {labEmail && (
                      <div className="flex items-center gap-1 font-medium text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-blue-700" />
                        <span>{labEmail}</span>
                      </div>
                    )}
                    {labWebsite && (
                      <div className="bg-gradient-to-r from-blue-700 to-sky-600 text-white px-3 py-1 rounded-md text-[11px] font-bold shadow-xs flex items-center gap-1">
                        <Globe className="w-3 h-3 text-sky-200" />
                        <span>{labWebsite.replace(/^https?:\/\//, '')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-sky-500 to-teal-400 rounded-full mt-3"></div>
              </div>
            )}

            {/* Patient Metadata Grid Box */}
            <div className="border border-slate-300 rounded-xl p-3 sm:p-4 bg-slate-50/70 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              
              {/* Left Demographic Column */}
              <div className="md:col-span-4 space-y-1.5">
                <div>
                  <div className="text-base font-black text-slate-900">
                    {booking.patientName || 'CHIKWADO NWEKE CHRISTIANUS'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500">Age: </span>
                    <strong className="text-slate-900">{booking.patientAge || 39} Years</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Sex: </span>
                    <strong className="text-slate-900">{booking.patientGender || 'Male'}</strong>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">PID / Code: </span>
                  <strong className="font-mono text-slate-900">{booking.patientPid || booking.bookingCode || 'PID-555'}</strong>
                </div>
              </div>

              {/* Middle Sample / Ref By Column */}
              <div className="md:col-span-4 border-y md:border-y-0 md:border-x border-slate-200 py-2 md:py-0 md:px-3 flex flex-col justify-between space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-2xs">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  <div className="text-[10px] text-slate-600 leading-tight">
                    <div className="font-bold text-slate-800">Sample Matrix:</div>
                    <div>{booking.tests?.[0]?.sampleTypeRequired || 'Whole Blood / Plasma'}</div>
                  </div>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Médecin Prescripteur:</div>
                  <div className="text-slate-900 text-[11px] font-black">
                    {booking.doctorName || 'Dr HAPPY LYNDA - NEPHROLOGUE'}
                  </div>
                  <div className="text-slate-600 text-[10px] font-medium">
                    {booking.doctorFacility || 'Polyclinique de Poitiers / Centre Affilié'}
                  </div>
                </div>
              </div>

              {/* Right Barcode & Timestamps Column */}
              <div className="md:col-span-4 space-y-1.5 text-right flex flex-col justify-between">
                <div>
                  <div className="font-mono text-[9px] tracking-widest text-slate-800 font-bold uppercase inline-block">
                    ||||| | ||| |||| || | || ||||
                  </div>
                  <div className="font-mono text-[9px] text-slate-600">
                    {booking.bookingCode || '0 35545 62336 78 1'}
                  </div>
                </div>

                <div className="text-[10px] space-y-0.5 text-slate-600">
                  <div>
                    <span>Registered on: </span>
                    <strong className="text-slate-800">{registeredTimeStr}</strong>
                  </div>
                  <div>
                    <span>Collected on: </span>
                    <strong className="text-slate-800">{collectedTimeStr}</strong>
                  </div>
                  <div>
                    <span>Reported on: </span>
                    <strong className="text-slate-800">{reportedTimeStr}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Test Results Section with Multi-tier Hierarchy (Department -> Sub-Header -> Parameters) */}
            {booking.tests?.map((testItem: BookingTestItem, tIdx: number) => (
              <div key={testItem.id || tIdx} className="space-y-2 pt-1">
                
                {/* Centered Bold Test Title */}
                <div className="text-center border-b-2 border-slate-800 pb-1 bg-slate-50/50 p-2 rounded-t-lg">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {testItem.testName || 'Complete Blood Count (CBC)'}
                  </h2>
                  <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-2">
                    <span>Sample: <strong>{testItem.sampleTypeRequired || 'Whole Blood'}</strong></span>
                    <span>•</span>
                    <span>Department: <strong>{testItem.category || 'Hematology'}</strong></span>
                  </div>
                </div>

                {/* Sub-parameters or Direct Value Table */}
                <div className="relative overflow-hidden">
                  
                  {/* Watermark */}
                  {currentTpl.showWatermark && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                      <span className="text-5xl font-black text-slate-900 tracking-widest uppercase transform -rotate-12">
                        {currentTpl.watermarkText || labName}
                      </span>
                    </div>
                  )}

                  <table className="w-full text-left text-xs border-collapse relative z-10">
                    <thead>
                      <tr className="border-b-2 border-slate-400 text-slate-800 text-[11px] bg-slate-100">
                        <th className="py-2 px-3 font-black uppercase">Investigation / Parameter</th>
                        <th className="py-2 px-3 font-black text-center uppercase">Result</th>
                        <th className="py-2 px-3 font-black text-center uppercase">Biological Reference Interval</th>
                        <th className="py-2 px-3 font-black text-right uppercase">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {testItem.subParameters && testItem.subParameters.length > 0 ? (
                        testItem.subParameters
                          .filter(sp => sp.printOnReport !== false)
                          .map((sp, sIdx) => {
                            const isHigh = sp.flag === 'High' || sp.isAbnormal;
                            const isLow = sp.flag === 'Low';
                            const isBorderline = sp.flag === 'Borderline';

                            const refVal = sp.refRangeWords || (
                              booking.patientGender === 'Female' 
                                ? (sp.refRangeFemale || sp.refRangeMale || 'Normal')
                                : booking.patientGender === 'Child' 
                                  ? (sp.refRangeChild || sp.refRangeMale || 'Normal')
                                  : (sp.refRangeMale || 'Normal')
                            );

                            const isCalculated = sp.parameterType === 'formula' || sp.computationFormula;

                            return (
                              <React.Fragment key={sp.id || sIdx}>
                                {sp.subHeader && sIdx > 0 && testItem.subParameters && testItem.subParameters[sIdx - 1]?.subHeader !== sp.subHeader && (
                                  <tr className="bg-slate-100/80 font-black text-[11px] text-slate-900 border-y border-slate-300">
                                    <td colSpan={4} className="py-1 px-3 uppercase tracking-wider text-teal-900">
                                      {sp.subHeader}
                                    </td>
                                  </tr>
                                )}
                                <tr className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-1.5 px-3 font-medium text-slate-900">
                                    <div className="font-semibold">{sp.name}</div>
                                    {isCalculated && (
                                      <span className="text-[9px] text-slate-500 font-normal italic">
                                        Computed: {sp.computationFormula || 'Formula'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-1.5 px-3 text-center font-bold">
                                    <div className="inline-flex items-center justify-center gap-1.5">
                                      <span className={`font-black ${
                                        isHigh ? 'text-rose-700' : isLow ? 'text-blue-700' : 'text-slate-900'
                                      }`}>
                                        {sp.value || 'N/A'}
                                      </span>

                                      {isHigh && (
                                        <span className="px-1.5 py-0.2 text-[9px] bg-rose-100 text-rose-800 font-black rounded uppercase border border-rose-300">
                                          High
                                        </span>
                                      )}
                                      {isLow && (
                                        <span className="px-1.5 py-0.2 text-[9px] bg-blue-100 text-blue-800 font-black rounded uppercase border border-blue-300">
                                          Low
                                        </span>
                                      )}
                                      {isBorderline && (
                                        <span className="px-1.5 py-0.2 text-[9px] bg-amber-100 text-amber-800 font-black rounded uppercase border border-amber-300">
                                          Borderline
                                        </span>
                                      )}
                                    </div>
                                    {sp.resultInWords && (
                                      <div className="text-[9px] text-slate-500 italic">{sp.resultInWords}</div>
                                    )}
                                  </td>
                                  <td className="py-1.5 px-3 text-center text-slate-700 font-mono text-[11px]">
                                    {refVal}
                                  </td>
                                  <td className="py-1.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                                    {sp.unit}
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })
                      ) : (
                        <tr>
                          <td className="py-2.5 px-3 font-black text-slate-900">
                            {testItem.testName}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-sm text-blue-900">
                            {testItem.resultValue || 'Normal / Non-Reactive'}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700 font-mono text-[11px]">
                            {booking.patientGender === 'Female' ? testItem.refRangeFemale : testItem.refRangeMale || 'Normal'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                            {testItem.units || 'Index'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Antibiogram / Antibiotic Susceptibility Matrix Table (if available) */}
                {testItem.antibiogram && testItem.antibiogram.length > 0 && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-300 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-300">
                      <span className="font-black text-xs text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-blue-700" />
                        Antibiogram / Antibiotic Susceptibility Testing (AST)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Kirby-Bauer Disc Diffusion</span>
                    </div>

                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-700 text-[10px] uppercase bg-slate-200/60 font-black">
                          <th className="py-1.5 px-2">Antibiotic Agent</th>
                          <th className="py-1.5 px-2 text-center">Disc Potency</th>
                          <th className="py-1.5 px-2 text-center">Zone Diameter (mm)</th>
                          <th className="py-1.5 px-2 text-center">CLSI / EUCAST Breakpoint</th>
                          <th className="py-1.5 px-2 text-right">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        {testItem.antibiogram.map((abItem: any, abIdx: number) => {
                          const abName = abItem.antibioticName || abItem.antibiotic || 'Antibiotic';
                          const discPotency = abItem.potency || abItem.discPotency || '10 µg';
                          const zoneVal = abItem.zoneDiameterMm || abItem.zoneMm || '';
                          const sens = (abItem.susceptibility || abItem.sensitivity || 'Sensitive').toString();
                          const isSens = sens === 'Sensitive' || sens === 'S';
                          const isRes = sens === 'Resistant' || sens === 'R';

                          return (
                            <tr key={abItem.id || abIdx} className="hover:bg-slate-100/70">
                              <td className="py-1 px-2 font-bold text-slate-900">{abName}</td>
                              <td className="py-1 px-2 text-center text-slate-600 font-mono text-[11px]">{discPotency}</td>
                              <td className="py-1 px-2 text-center text-slate-700 font-mono text-[11px] font-bold">{zoneVal ? `${zoneVal} mm` : '-'}</td>
                              <td className="py-1 px-2 text-center text-slate-500 text-[10px]">{abItem.refBreakpoints || 'CLSI / EUCAST'}</td>
                              <td className="py-1 px-2 text-right">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block ${
                                  isSens ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                  isRes ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                  'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}>
                                  {sens}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Instruments & Interpretation */}
                <div className="pt-2 space-y-1 text-[11px] text-slate-700 border-t border-slate-200">
                  <div>
                    <strong className="text-slate-900">Method / Instruments: </strong>
                    <span>{testItem.reagentsUsed?.length ? `Reagents: ${testItem.reagentsUsed.map(r => r.reagentName).join(', ')} • ` : ''}Automated Diagnostic Analyzer Platform</span>
                  </div>
                  <div>
                    <strong className="text-slate-900">Clinical Interpretation: </strong>
                    <span>{testItem.labNotes || 'Biological parameters evaluated per validated clinical standard operating procedures.'}</span>
                  </div>
                </div>

              </div>
            ))}

            {/* End of Report Strip */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200">
              <span className="font-semibold italic">Merci pour votre confiance</span>
              <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
                **** End of Diagnostic Report ****
              </span>
            </div>

            {/* Signatures & Pathologist Sign-Off Block */}
            <div className="pt-4 border-t-2 border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center text-xs">
              
              {/* Medical Lab Technician */}
              <div>
                <div className="h-8 flex items-center justify-center font-serif text-slate-800 italic font-bold text-sm tracking-wide">
                  {booking.tests?.[0]?.completedBy || 'Mangi Lerine Laslie'}
                </div>
                <div className="font-black text-slate-900">Technicien Analyste</div>
                <div className="text-[10px] text-slate-500 font-medium">Exécuté et Validé</div>
              </div>

              {/* Head Pathologist / Lab Director */}
              <div>
                <div className="h-8 flex items-center justify-center font-serif text-blue-900 italic font-bold text-sm tracking-wide">
                  {labDirectorName}
                </div>
                <div className="font-black text-slate-900">{labDirectorName}</div>
                <div className="text-[10px] text-slate-500 font-medium">{biologistSignatureTitle}</div>
              </div>

              {/* Quality & Accreditation Sign-off */}
              <div className="hidden sm:block">
                <div className="h-8 flex items-center justify-center font-serif text-teal-800 italic font-bold text-sm tracking-wide">
                  {labName}
                </div>
                <div className="font-black text-slate-900">Contrôle Qualité & Visa</div>
                <div className="text-[10px] text-slate-500 font-medium font-mono">
                  {labArrete}
                </div>
              </div>

            </div>

            {/* Bottom Footer: Custom Uploaded Image OR Accredited Strip */}
            {currentTpl.footerImageUrl ? (
              <div className="mt-4 pt-2 border-t border-slate-200">
                <img 
                  src={currentTpl.footerImageUrl} 
                  alt="Footer Stamp" 
                  style={{ maxHeight: `${currentTpl.footerImageHeight || 60}px` }}
                  className="w-full object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="bg-slate-900 text-white rounded-xl overflow-hidden p-2.5 flex items-center justify-between text-[11px] gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-sky-500 rounded-lg text-slate-900">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-sky-200">
                    {footerNotes}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-emerald-700 text-white px-2.5 py-0.5 rounded-md font-bold text-[10px]">
                  <MessageCircle className="w-3 h-3 text-white" />
                  <span>{labPhone}</span>
                </div>

                <div className="text-[10px] text-slate-300 font-mono">
                  Édité le: {reportedTimeStr}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default LabReportPdfViewModal;
