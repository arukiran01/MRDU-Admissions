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

  const ReceiptCopy = ({ type }: { type: 'OFFICE COPY' | 'STUDENT COPY' }) => {
    const checklistItems = getChecklistItems(currentStudent.program);

    return (
    <div className="border-[2px] border-slate-900 p-6 h-full flex flex-col bg-white print:bg-white relative">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b-[2px] border-slate-900 pb-3 mb-4">
        <div className="flex items-center gap-4">
          <img 
            src="https://mrdu.edu.in/wp-content/uploads/2025/08/Logo.png" 
            alt="MRDU Logo" 
            className="h-16 w-auto" 
            referrerPolicy="no-referrer" 
          />
          <div className="flex flex-col">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 print:text-black leading-none mb-1">
              MALLA REDDY (MR)
            </h1>
            <p className="text-sm font-black text-slate-800 print:text-black uppercase tracking-widest leading-tight">
              (DEEMED TO BE UNIVERSITY)
            </p>
            <p className="text-[10px] font-bold text-slate-600 print:text-black leading-tight mt-0.5">
              Recognised Under Section 3 of The UGC Act, 1956.
            </p>
          </div>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <div className="inline-block border-[1.5px] border-slate-900 px-3 py-1 mb-2 bg-slate-100 print:bg-white">
            <span className="text-sm font-black text-slate-900 print:text-black uppercase tracking-widest">
              {type}
            </span>
          </div>
          <p className="text-[10px] font-black print:text-black leading-tight text-right opacity-90 uppercase">
            Maisammaguda, Dhulapally, Secunderabad - 500100
          </p>
          <p className="text-[10px] font-bold print:text-black leading-tight text-right opacity-90">
            www.mrdu.edu.in | Ph: 9348161303
          </p>
        </div>
      </div>

      <div className="flex justify-center mb-6 mt-1">
        <h2 className="text-xl font-black bg-slate-900 text-white print:bg-black print:text-white px-8 py-1.5 tracking-widest uppercase rounded-sm print:rounded-none">
          DOCUMENTS RECEIPT
        </h2>
      </div>

      {/* CONTENT: TWO COLUMNS FOR LANDSCAPE A5 */}
      <div className="grid grid-cols-[1fr_0.8fr] gap-8 flex-1">
        
        {/* LEFT COL: STUDENT DETAILS */}
        <div className="flex flex-col">
          <div className="border-[1.5px] border-slate-300 print:border-slate-900 p-5 rounded-lg bg-slate-50 print:bg-white print:rounded-none h-full">
            <div className="grid grid-cols-[130px_10px_1fr] gap-y-4 text-[13px] font-black print:text-black leading-relaxed">
              <div className="text-slate-500 print:text-slate-800 uppercase tracking-wide">Enq.No</div>
              <div>:</div>
              <div className="uppercase text-lg text-slate-900 print:text-black leading-none">{currentStudent.admissionNo}</div>

              <div className="text-slate-500 print:text-slate-800 uppercase tracking-wide">Student Name</div>
              <div>:</div>
              <div className="uppercase">{currentStudent.name}</div>

              <div className="text-slate-500 print:text-slate-800 uppercase tracking-wide">Father's Name</div>
              <div>:</div>
              <div className="uppercase">{currentStudent.fatherName}</div>

              <div className="text-slate-500 print:text-slate-800 uppercase tracking-wide">Program</div>
              <div>:</div>
              <div className="uppercase flex items-center gap-2">
                 {currentStudent.program}
                 <span className="text-[11px] font-bold border-[1.5px] border-slate-900 px-2 py-0.5 rounded-sm">
                   {currentStudent.academicYear}
                 </span>
              </div>

              <div className="text-slate-500 print:text-slate-800 uppercase tracking-wide">Course</div>
              <div>:</div>
              <div className="uppercase leading-tight">{currentStudent.branch}</div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: CHECKLIST */}
        <div className="flex flex-col">
          <div className="font-black text-[13px] underline underline-offset-4 mb-4 uppercase tracking-wide text-slate-800 print:text-black">
            Required Documents Submitted:
          </div>
          
          <div className="grid grid-cols-1 gap-y-2.5 pl-1">
            {checklistItems.map((item) => {
              const isGiven = !!currentStudent.documents[item.key as keyof typeof currentStudent.documents];
              return (
                <div key={item.key} className="flex items-center space-x-3">
                  <div className={`w-5 h-5 border-[1.5px] flex items-center justify-center shrink-0 rounded-[2px] bg-white ${isGiven ? 'border-slate-900 print:border-black' : 'border-slate-300 print:border-gray-400'}`}>
                    {isGiven && (
                      <span className="text-[14px] font-black text-slate-900 print:text-black leading-none mt-0.5">✓</span>
                    )}
                  </div>
                  <span className={`text-[12px] font-bold leading-none uppercase ${isGiven ? 'text-slate-900 print:text-black' : 'text-slate-500 print:text-gray-500'}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
            
            {/* OTHERS */}
            {currentStudent.documents.others && (
              <div className="flex items-start space-x-3 mt-2 pt-2 border-t-[1.5px] border-slate-100 print:border-slate-200">
                <div className="w-5 h-5 border-[1.5px] border-slate-900 print:border-black flex items-center justify-center shrink-0 rounded-[2px] bg-white mt-0.5">
                  <span className="text-[14px] font-black text-slate-900 print:text-black leading-none mt-0.5">✓</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold leading-none uppercase text-slate-900 print:text-black mb-1.5">
                    Other Documents
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 print:text-slate-800 uppercase max-w-[200px] leading-tight break-words">
                    {currentStudent.documents.others}
                  </span>
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>

      {/* FOOTER SECTION */}
      <div className="mt-5 flex justify-between items-end border-t-[1.5px] border-slate-900 pt-4">
        <div className="max-w-[55%]">
          <p className="text-[10px] font-bold leading-relaxed text-slate-600 print:text-black text-justify">
            <span className="font-black uppercase text-slate-800 print:text-black">Important Note:</span> Parents are requested to preserve this receipt for future clarifications in
            respect of fee paid by you. Fee once paid will not be refunded or transferred.
            Cheques subject to realization.
          </p>
        </div>
        
        <div className="text-center min-w-[220px] pb-1">
          <div className="border-t-[1.5px] border-slate-900 print:border-black w-full mb-2"></div>
          <p className="font-black text-[12px] tracking-widest uppercase text-slate-800 print:text-black">Authorized Signature</p>
        </div>
      </div>

    </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:py-0 print:bg-white font-sans text-slate-900 overflow-x-hidden">
      <div className="w-full max-w-[850px] mx-auto px-4 print:px-0 print:max-w-none print:mx-0">
        
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
          className="bg-white shadow-2xl mx-auto print:shadow-none w-full flex flex-col m-0 p-6 sm:p-10 print:p-0 box-border"
        >
          <style>
            {`
              @media print {
                @page { size: A4 portrait; margin: 12mm; }
                body { 
                  margin: 0;
                  padding: 0;
                  background-color: white !important;
                }
              }
            `}
          </style>
          
          {/* Twin Copy Layout (Vertical Natural Flow) */}
          <div className="flex flex-col w-full gap-8 print:gap-10">
            {/* Top Copy */}
            <ReceiptCopy type="OFFICE COPY" />

            {/* Horizontal centered cut line */}
            <div className="flex flex-row items-center justify-center w-full relative py-2">
               <div className="absolute inset-x-0 border-t-[1.5px] border-dashed border-slate-400"></div>
               <div className="bg-white px-6 z-10 flex flex-row items-center gap-4">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em]">CUT ALONG THIS LINE</span>
                  <span className="text-xl text-slate-400">✂</span>
               </div>
            </div>

            {/* Bottom Copy */}
            <ReceiptCopy type="STUDENT COPY" />
          </div>

        </div>
      </div>
    </div>
  );
}
