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
    <div className="flex flex-col h-full text-slate-900 print:text-black w-full overflow-hidden">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start mb-4 gap-2">
         <div className="flex items-center gap-2">
            <img 
              src="https://mrdu.edu.in/wp-content/uploads/2025/08/Logo.png" 
              alt="Logo" 
              className="h-10 sm:h-12 w-auto mix-blend-multiply" 
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col justify-center">
               <h1 className="text-[12px] sm:text-[14px] font-black leading-tight uppercase tracking-tight">MALLA REDDY (MR)</h1>
               <p className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wide">(DEEMED TO BE UNIVERSITY)</p>
               <p className="text-[6.5px] sm:text-[7px] font-semibold mt-0.5">Recognised under Section 3 of the UGC Act, 1956</p>
            </div>
         </div>
         
         <div className="flex border-[1.5px] border-slate-900 print:border-black px-2 py-1 bg-white items-center justify-center shrink-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{type}</span>
         </div>
      </div>
      
      {/* Address row */}
      <div className="w-full text-right text-[7.5px] sm:text-[8px] border-b-[1.5px] border-slate-900 print:border-black pb-2 mb-4 font-bold">
         MAISAMMAGUDA, DHULAPALLY, SECUNDERABAD - 500100 | www.mrdu.edu.in | Ph: 9348161303
      </div>

      <div className="text-center mb-6">
         <h2 className="text-[14px] sm:text-[16px] font-black uppercase tracking-[0.2em] text-slate-400 print:text-slate-400">DOCUMENTS RECEIPT</h2>
      </div>

      {/* Body layout (Left/Right within column) */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch w-full mb-auto print:flex-col">
         
         {/* Top/Left side: Fields */}
         <div className="flex-1 border-[1.5px] border-slate-900 print:border-black p-3 sm:p-4 bg-white/40">
            <div className="flex flex-col gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-black">
               
               <div className="grid grid-cols-[100px_10px_1fr] items-center">
                 <span className="uppercase">ENQ.NO</span>
                 <span>:</span>
                 <span className="uppercase text-[11px] sm:text-[12px]">{currentStudent.admissionNo}</span>
               </div>

               <div className="grid grid-cols-[100px_10px_1fr] items-start">
                 <span className="uppercase mt-0.5">STUDENT NAME</span>
                 <span className="mt-0.5">:</span>
                 <span className="uppercase leading-tight">{currentStudent.name}</span>
               </div>

               <div className="grid grid-cols-[100px_10px_1fr] items-start">
                 <span className="uppercase mt-0.5">FATHER'S NAME</span>
                 <span className="mt-0.5">:</span>
                 <span className="uppercase leading-tight">{currentStudent.fatherName}</span>
               </div>

               <div className="grid grid-cols-[100px_10px_1fr] items-center">
                 <span className="uppercase">PROGRAM</span>
                 <span>:</span>
                 <div className="flex items-center gap-2">
                    <span className="uppercase">{currentStudent.program}</span>
                    <span className="border-[1.5px] border-slate-900 print:border-black px-1.5 py-0.5 text-[8px] sm:text-[9px] rounded-sm bg-white/50">{currentStudent.academicYear}</span>
                 </div>
               </div>

               <div className="grid grid-cols-[100px_10px_1fr] items-center">
                 <span className="uppercase">COURSE</span>
                 <span>:</span>
                 <span className="uppercase">{currentStudent.branch}</span>
               </div>

            </div>
         </div>

         {/* Bottom/Right side: Checklist */}
         <div className="flex-1 mt-4 lg:mt-0 print:mt-4 pl-0 lg:pl-2 print:pl-0">
            <h3 className="text-[9px] sm:text-[10px] font-black uppercase underline underline-offset-4 mb-4">
              REQUIRED DOCUMENTS SUBMITTED:
            </h3>
            <div className="flex flex-col gap-2.5 sm:gap-3">
               {checklistItems.map(item => {
                 const isGiven = !!currentStudent.documents[item.key as keyof typeof currentStudent.documents];
                 return (
                   <div key={item.key} className="flex items-center gap-3">
                      <div className={`w-4 h-4 border-[1.5px] border-slate-900 print:border-black flex justify-center items-center shrink-0 bg-white`}>
                        {isGiven && <span className="text-[12px] font-black mt-0.5">✓</span>}
                      </div>
                      <span className="text-[8.5px] sm:text-[9.5px] leading-tight font-black uppercase">{item.label}</span>
                   </div>
                 );
               })}
               
               {currentStudent.documents.others && (
                 <div className="flex items-start gap-3 mt-2 pt-2">
                    <div className={`w-4 h-4 border-[1.5px] border-slate-900 print:border-black flex justify-center items-center shrink-0 bg-white mt-0.5`}>
                      <span className="text-[12px] font-black mt-0.5">✓</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-700">OTHERS</span>
                       <span className="text-[8.5px] sm:text-[9.5px] leading-tight font-black uppercase line-clamp-2">{currentStudent.documents.others}</span>
                    </div>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* Footer Section */}
      <div className="mt-6 border-t-[1.5px] border-slate-900 print:border-black pt-2 flex justify-between items-end gap-4">
         <p className="text-[7px] sm:text-[8px] leading-tight text-justify font-bold flex-1">
           <strong className="uppercase font-black text-slate-800 print:text-black">IMPORTANT NOTE:</strong> Parents are requested to preserve this receipt for future clarifications in
           respect of fee paid by you. Fee once paid will not be refunded or transferred.
           Cheques subject to realization.
         </p>
         
         <div className="shrink-0 w-32 border-t-[1.5px] border-slate-900 print:border-black text-center pt-1.5 mb-1">
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider">AUTHORIZED SIGNATURE</p>
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
          className="bg-white print:bg-white shadow-2xl mx-auto print:shadow-none w-full min-h-[900px] print:h-[297mm] flex flex-row overflow-hidden relative box-border print:border-none p-4 print:p-0"
        >
          <style>
            {`
              @media print {
                @page { size: A4 portrait; margin: 5mm; }
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
          
          <div className="absolute inset-y-0 left-1/2 -ml-[1px] border-l-[1.5px] border-dashed border-slate-400 print:border-black h-full"></div>

          <div className="flex-1 w-1/2 pr-6 print:pr-10 py-6 print:py-8 flex flex-col box-border">
            <ReceiptCopy type="OFFICE COPY" />
          </div>

          <div className="flex-1 w-1/2 pl-6 print:pl-10 py-6 print:py-8 flex flex-col box-border">
            <ReceiptCopy type="STUDENT COPY" />
          </div>

        </div>
      </div>
    </div>
  );
}
