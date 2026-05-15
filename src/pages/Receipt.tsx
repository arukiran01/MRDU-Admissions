import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { ArrowLeft, Printer, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getChecklistItems } from '../constants';

export default function Receipt() {
  const { currentStudent, logAction } = useAppContext();
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!currentStudent) {
      navigate('/dashboard');
    }
  }, [currentStudent, navigate]);

  if (!currentStudent) return null;

  const handlePrint = async () => {
    await logAction('Receipt Generation', `Generated receipt for student ${currentStudent.name} (Admission No: ${currentStudent.admissionNo}).`, currentStudent.id);
    const originalTitle = document.title;
    document.title = `${currentStudent.admissionNo} Certificate Slip`;
    window.print();
    document.title = originalTitle;
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || !currentStudent) return;
    
    setIsDownloading(true);

    try {
      // Ensure the component is fully rendered and images are loaded
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(receiptRef.current, {
        scale: 1.25, // Lower scale for better memory management while keeping clarity
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1400, // Fixed design width
        windowWidth: 1400,
        scrollX: 0,
        scrollY: -window.scrollY // Fix for scrolled pages
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85); // JPEG is smaller than PNG for PDFs
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${currentStudent.admissionNo}_Certificate_Slip.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('PDF generation encountered a temporary limit. \n\nPlease use the "Print Receipt" button and select "Save as PDF" specifically for a high-quality A4 copy.');
    } finally {
      setIsDownloading(false);
    }
  };

  const checklistMap = [
    { key: 'ssc', label: '10th Class Memo' },
    { key: 'schoolBonafide', label: '10th Class Bonafide' },
    { key: 'interBonafide', label: 'Inter/Diploma Bonafide' },
    { key: 'tc', label: 'Transfer Certificate (TC)' },
    { key: 'interPC', label: 'Inter/Diploma PC' },
    { key: 'degreeCMM', label: 'Degree CMM' },
    { key: 'degreePC', label: 'Degree PC' },
    { key: 'aadhaar', label: 'Aadhaar Card' },
    { key: 'rankCard', label: 'Entrance Rank Card' },
    { key: 'others', label: 'Other Documents' },
  ];

  const ReceiptCopy = ({ type, isRight = false }: { type: 'OFFICE COPY' | 'STUDENT COPY', isRight?: boolean }) => {
    const checklistItems = getChecklistItems(currentStudent.program);

    return (
    <div className="flex flex-col text-black w-full bg-white font-sans relative h-full"> 
      
      {/* Outer Labels */}
      <div className={`font-black text-[11px] tracking-wider uppercase mb-2 ${isRight ? 'text-right' : 'text-left'}`}>
         {type}
      </div>

      {/* Main Container */}
      <div className="border-[1.5px] border-black p-4 sm:p-5 flex flex-col bg-white flex-grow">
        
        {/* HEADER */}
        <div className="flex flex-col items-center text-center pb-2">
           <img 
              src="https://mrdu.edu.in/wp-content/uploads/2025/08/Logo.png" 
              alt="MRDU" 
              className="h-12 w-12 object-contain mb-1.5" 
              referrerPolicy="no-referrer"
           />
           <h1 className="text-[17px] font-black uppercase tracking-tight leading-none mb-1">MALLA REDDY (MR)</h1>
           <p className="font-bold text-[10px] uppercase tracking-wide mb-1">(DEEMED TO BE UNIVERSITY)</p>
           <p className="font-bold text-[7px] sm:text-[8px] tracking-wide">Recognised Under Section 3 of The UGC Act, 1956.</p>
        </div>

        <div className="border-t-[1px] border-black mt-1 mb-[3px]"></div>
        <div className="text-center font-bold text-[8px] sm:text-[9px] px-2 leading-snug">
           Maisammaguda, Dhulapally - 500100, Telangana, India. | www.mrdu.edu.in | Phone No: 9348161303
        </div>
        <div className="border-t-[1px] border-black mt-[3px] mb-6"></div>

        <div className="text-center font-extrabold text-[13px] uppercase underline underline-offset-4 mb-6 tracking-wide">
           CERTIFICATE ACKNOWLEDGMENT
        </div>

        <div className="flex flex-col gap-2.5 mb-8 px-2">
           <div className="grid grid-cols-[120px_1fr] items-start text-[10px] sm:text-[11px]">
              <span className="font-bold">Enq/Adm No</span>
              <span className="font-bold">: {currentStudent.admissionNo}</span>
           </div>
           <div className="grid grid-cols-[120px_1fr] items-start text-[10px] sm:text-[11px]">
              <span className="font-bold">Student Name</span>
              <span className="font-bold uppercase leading-snug">: {currentStudent.name}</span>
           </div>
           <div className="grid grid-cols-[120px_1fr] items-start text-[10px] sm:text-[11px]">
              <span className="font-bold">Fathers' Name</span>
              <span className="font-bold uppercase leading-snug">: {currentStudent.fatherName}</span>
           </div>
           <div className="grid grid-cols-[120px_1fr] items-start text-[10px] sm:text-[11px]">
              <span className="font-bold">Academic Year</span>
              <span className="font-bold uppercase">: 2026-27</span>
           </div>
           <div className="grid grid-cols-[120px_1fr] items-start text-[10px] sm:text-[11px]">
              <span className="font-bold">Program</span>
              <span className="font-bold uppercase leading-snug">: {currentStudent.program}</span>
           </div>
           <div className="grid grid-cols-[120px_1fr] items-start text-[10px] sm:text-[11px]">
              <span className="font-bold">Course Name</span>
              <span className="font-bold uppercase leading-snug">: {currentStudent.branch}</span>
           </div>
        </div>

        <div className="font-extrabold text-[10px] sm:text-[11px] uppercase underline underline-offset-2 mb-4 px-2 tracking-wide">
           DOCUMENTS CHECKLIST:
        </div>

        <div className="flex flex-col gap-1.5 px-2 mb-8 flex-grow">
           {checklistItems.map(item => {
              const isGiven = !!currentStudent.documents[item.key as keyof typeof currentStudent.documents];
              
              const renderLabelWithSuperscript = (label: string) => {
                if (label.includes('10TH')) {
                  return <span key={label}>10<sup className="text-[7.5px] lowercase font-black">th</sup>{label.substring(4)}</span>;
                }
                if (label.includes('6TH') && label.includes('9TH')) {
                   return <span key={label}>BONAFIDE FROM 6<sup className="text-[7.5px] lowercase font-black">th</sup> TO 9<sup className="text-[7.5px] lowercase font-black">th</sup> CLASS</span>;
                }
                return label;
              };

              return (
                <div key={item.key} className="flex items-center gap-2">
                   <div className="w-4 h-4 border-[1.5px] border-black flex justify-center items-center bg-white shrink-0 overflow-hidden">
                     {isGiven && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                   </div>
                   <span className="font-bold text-black uppercase text-[9px] sm:text-[10px]">{renderLabelWithSuperscript(item.label)}</span>
                </div>
              );
           })}
           
           <div className="flex items-end gap-2 mt-1">
              <div className="w-4 h-4 border-[1.5px] border-black flex justify-center items-center bg-white shrink-0 overflow-hidden mb-[1px]">
                {currentStudent.documents.others && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
              <div className="font-bold text-black uppercase text-[9px] sm:text-[10px] flex flex-1 items-end gap-1.5">
                 <span className="shrink-0 mb-[1px]">OTHERS:</span>
                 <div className="flex-1 border-b-[1.5px] border-black pb-[1px] min-w-0">
                     <span className="px-1 line-clamp-1">{currentStudent.documents.others || '\u00A0'}</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="mt-auto">
           <div className="flex justify-end mb-4 px-4 pt-8">
              <div className="flex flex-col items-center">
                 <div className="w-32 border-b-[1.5px] border-black mb-1.5"></div>
                 <span className="font-bold text-[8px] uppercase tracking-wide">Authorized Signature</span>
              </div>
           </div>

           <div className="border-[1.5px] border-black px-3 py-2 bg-slate-50 print:bg-white text-justify">
              <p className="font-bold text-[7px] sm:text-[8px] leading-[1.4] text-left">
                 <span className="font-black uppercase mr-1">NOTE:</span>
                 Parents are requested to preserve this Acknowledgment till the end of the course.
              </p>
           </div>
        </div>

      </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-200 py-8 print:py-0 print:bg-white font-sans text-slate-900 overflow-x-hidden" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      <div className="w-full max-w-[794px] mx-auto px-4 print:px-0 print:max-w-none print:w-[210mm] print:h-[297mm]">
        
        {/* Print Action Bar (Hidden in print) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 print:hidden">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center px-5 py-2.5 bg-white text-slate-700 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex gap-4">
            <button 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className={`flex items-center px-5 py-2.5 ${isDownloading ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-lg shadow-sm font-semibold transition-all active:scale-95`}
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </button>
 
            <button 
              onClick={handlePrint}
              className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 font-semibold transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </button>
          </div>
        </div>

        <div 
          ref={receiptRef}
          className="bg-white print:bg-white shadow-2xl mx-auto print:shadow-none w-[210mm] min-h-[297mm] flex flex-row relative box-border print:border-none p-4"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          <style>
            {`
              @media print {
                @page { size: A4 portrait; margin: 0; }
                body { 
                  margin: 0;
                  padding: 0;
                  background-color: white !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
            `}
          </style>

          {/* Left Column - OFFICE COPY */}
          <div className="flex-1 w-1/2 p-2 print:p-4 flex flex-col h-full">
            <ReceiptCopy type="OFFICE COPY" isRight={false} />
          </div>

          {/* Center Cut Line Divides A4 vertically */}
          <div className="absolute inset-y-8 left-1/2 -ml-[0.5px] border-l-[1px] border-dashed border-slate-400 print:border-black flex flex-col items-center justify-center opacity-50 z-10 w-[1px]">
             <span className="bg-white py-4 text-[7px] font-bold tracking-[0.5em] uppercase border border-white text-black whitespace-nowrap -ml-[2px]" style={{ writingMode: 'vertical-rl' }}>CUT HERE</span>
             <span className="bg-white py-2 z-10 text-lg border border-white text-black -ml-[3px]">✂</span>
          </div>

          {/* Right Column - STUDENT COPY */}
          <div className="flex-1 w-1/2 p-2 print:p-4 flex flex-col h-full">
            <ReceiptCopy type="STUDENT COPY" isRight={true} />
          </div>

        </div>
      </div>
    </div>
  );
}
