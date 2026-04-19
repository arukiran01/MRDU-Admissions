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
    <div className="flex flex-col text-black w-full border-[1.5px] border-black bg-[#fdfdf0] print:bg-white text-[10px] leading-tight font-sans relative pb-1">
      
      {/* Ghost text for "MREC" style watermarking/text if needed? Left empty. Using standard box. */}
      
      {/* HEADER ROW */}
      <div className="flex items-center justify-between p-2 pb-1 border-b-[1.5px] border-black">
         <div className="flex items-center gap-3">
            <img 
               src="https://mrdu.edu.in/wp-content/uploads/2025/08/Logo.png" 
               alt="MRDU" 
               className="h-14 w-14 object-contain mix-blend-multiply" 
               referrerPolicy="no-referrer"
            />
            <div className="flex flex-col pt-1">
               <h1 className="text-[17px] font-black uppercase tracking-tight leading-none mb-0.5">MALLA REDDY (MR)</h1>
               <p className="font-bold text-[8.5px] uppercase">(UGC Autonomous Institution, NBA & NAAC "A" Grade)</p>
               <p className="font-bold text-[8.5px]">(Approved by AICTE, New Delhi, Affiliated to JNTUH, Hyderabad)</p>
               <p className="font-bold text-[8.5px]">Maisammaguda, Dhulapally (Post), Kompally, Secunderabad - 500100</p>
               <p className="font-bold text-[8.5px]">www.mrec.ac.in, Phone No: 9348161303</p>
            </div>
         </div>
      </div>

      <div className="text-center font-bold text-[14px] uppercase tracking-wide py-2 pb-1.5 border-b-[1px] border-transparent">
         DOCUMENTS RECEIPT
      </div>

      <div className="flex flex-col px-3 mb-2 gap-[2px]">
         
         <div className="grid grid-cols-[140px_1fr] items-center">
            <span className="font-bold">Enq.No</span>
            <span className="font-semibold">: <span className="uppercase ml-1">{currentStudent.admissionNo}</span></span>
         </div>

         <div className="grid grid-cols-[140px_1fr] items-center">
            <span className="font-bold">Name of the student</span>
            <span className="font-semibold">: <span className="uppercase ml-1">{currentStudent.name}</span></span>
         </div>

         <div className="grid grid-cols-[140px_1fr] items-center">
            <span className="font-bold">Fathers' Name</span>
            <span className="font-semibold">: <span className="uppercase ml-1">{currentStudent.fatherName}</span></span>
         </div>

         <div className="grid grid-cols-[140px_1fr] items-center">
            <span className="font-bold">Academic Year</span>
            <span className="font-semibold">: <span className="uppercase ml-1">{currentStudent.academicYear}</span></span>
         </div>

         <div className="grid grid-cols-[140px_1fr] items-center">
            <span className="font-bold">Course Name</span>
            <span className="font-semibold">: <span className="uppercase ml-1">{currentStudent.branch} ({currentStudent.program})</span></span>
         </div>

      </div>

      <div className="flex justify-end pr-4 -mt-16 mb-16 opacity-0">.</div> {/* Spacer for symmetry if needed, skip for now */}

      <div className="flex flex-col px-3 gap-[3px] mt-1 mb-4">
         {checklistItems.map(item => {
            const isGiven = !!currentStudent.documents[item.key as keyof typeof currentStudent.documents];
            return (
              <div key={item.key} className="flex items-center gap-1.5">
                 <div className="w-[10px] h-[10px] border border-black flex justify-center items-center bg-white shrink-0 overflow-hidden">
                   {isGiven && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-[8px] h-[8px] text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                 </div>
                 <span className="font-semibold text-black">{item.label}</span>
              </div>
            );
         })}
         
         {currentStudent.documents.others && (
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className="w-[10px] h-[10px] border border-black flex justify-center items-center bg-white shrink-0 overflow-hidden">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-[8px] h-[8px] text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
               </div>
               <span className="font-semibold text-black uppercase">{currentStudent.documents.others}</span>
            </div>
         )}
      </div>

      <div className="flex justify-end pr-6 mb-2 mt-auto">
         <div className="flex flex-col items-center">
            {/* Fake cursive signature icon approximation */}
            <div className="w-12 h-6 border-b border-black flex items-end justify-center mb-0.5 relative">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-black absolute bottom-0 right-0 transform translate-y-1/4 opacity-60"><path d="M5 15l2-2 3.5 3.5 2-8 3 8 2.5-3 2 4M3 21h18"></path></svg>
            </div>
            <span className="font-bold text-[10px]">Admin</span>
         </div>
      </div>

      <div className="mt-1 flex border-t-[1.5px] border-black p-2 mx-0 relative">
         <p className="font-semibold text-[10px] leading-[1.3] text-justify w-full">
            <span className="font-bold">Note: </span>
            Parents are requested to preserve this receipt for future clarifications in
            respect of fee paid by you. Fee once paid will not be refunded or transferred.
            Cheques subject to realization.
         </p>
         {/* Small watermark text overlay showing COPY type */}
         <div className="absolute right-2 top-2 font-black text-slate-300 opacity-50 uppercase tracking-widest text-xs pointer-events-none">
            {type}
         </div>
      </div>

    </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-200 py-8 print:py-0 print:bg-white font-sans text-slate-900 overflow-x-hidden">
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
          className="bg-white print:bg-white shadow-2xl mx-auto print:shadow-none w-full print:w-[210mm] min-h-[297mm] flex flex-col items-center justify-start overflow-hidden relative box-border print:border-none p-6 print:p-0 gap-6"
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

          <div className="w-full h-auto">
            <ReceiptCopy type="OFFICE COPY" />
          </div>

          <div className="flex flex-row items-center justify-center w-full relative py-2 print:py-4 opacity-50 space-x-4">
             <div className="absolute inset-x-0 border-t-[1.5px] border-dashed border-slate-600 print:border-black"></div>
             <span className="bg-white px-4 z-10 text-[9px] font-black tracking-[0.5em] uppercase border border-slate-300">Cut Here</span>
             <span className="bg-white px-2 z-10 text-lg">✂</span>
          </div>

          <div className="w-full h-auto">
            <ReceiptCopy type="STUDENT COPY" />
          </div>

        </div>
      </div>
    </div>
  );
}
