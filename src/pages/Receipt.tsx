import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { ArrowLeft, Printer, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    document.title = 'admissionslip';
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
      pdf.save(`Admission_Slip_${currentStudent.admissionNo}_${currentStudent.name.replace(/\s+/g, '_')}.pdf`);
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
    // Only show ticked documents as per user request: "only selected checkboxes only should print"
    const tickedDocuments = checklistMap.filter(item => !!currentStudent.documents[item.key as keyof typeof currentStudent.documents]);

    return (
    <div className="border-[1.5px] border-slate-900 p-3 h-full flex flex-col bg-white print:bg-white relative">
      <div className="text-center pb-2 mb-3 print:border-black">
        <div className="flex justify-center mb-1">
          <img 
            src="https://mrdu.edu.in/wp-content/uploads/2025/08/Logo.png" 
            alt="MRDU Logo" 
            className="h-12 w-auto" 
            referrerPolicy="no-referrer" 
          />
        </div>
        <h1 className="text-[18px] font-black uppercase tracking-tight mb-0.5 print:text-black leading-none">MALLA REDDY (MR)</h1>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[11px] font-black text-slate-800 print:text-black uppercase tracking-normal leading-tight">
            (DEEMED TO BE UNIVERSITY)
          </p>
          <p className="text-[8px] font-bold text-slate-700 print:text-black leading-tight">
            Recognised Under Section 3 of The UGC Act, 1956.
          </p>
        </div>
        <p className="text-[8px] font-black print:text-black mt-1.5 leading-tight border-t-[1.5px] border-slate-900 pt-1.5 pb-1">
          Maisammaguda, Dhulapally, Secunderabad - 500100, Telangana, India. | www.mrdu.edu.in | Phone No: 9348161303
        </p>
      </div>

      <div className="flex justify-center mb-4">
        <h2 className="text-[14px] font-black underline underline-offset-4 uppercase print:text-black tracking-[0.1em]">
          ADMISSIONS CERTIFICATION
        </h2>
      </div>

      <div className="grid grid-cols-[140px_15px_1fr] sm:grid-cols-[180px_15px_1fr] gap-y-1.5 mb-3 text-[12px] font-black print:text-black">
        <div>Enq.No</div>
        <div>:</div>
        <div className="uppercase">{currentStudent.admissionNo}</div>

        <div>Name of the student</div>
        <div>:</div>
        <div className="uppercase">{currentStudent.name}</div>

        <div>Fathers' Name</div>
        <div>:</div>
        <div className="uppercase">{currentStudent.fatherName}</div>

        <div>Academic Year</div>
        <div>:</div>
        <div className="uppercase">{currentStudent.academicYear}</div>

        <div>Course Name</div>
        <div>:</div>
        <div className="uppercase">{currentStudent.branch}</div>
      </div>

      <div className="mb-3 print:text-black">
        <div className="font-black text-[12px] underline mb-2 uppercase tracking-wide">Submitted Documents:</div>
        {tickedDocuments.length > 0 ? (
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
            {tickedDocuments.map((item) => {
              const displayLabel = item.key === 'others' 
                ? `Other: ${currentStudent.documents.others}`
                : item.label;
              return (
                <div key={item.key} className="flex items-center space-x-2">
                  <div className="w-[15px] h-[15px] border-[1.5px] border-slate-900 print:border-black flex items-center justify-center shrink-0 rounded-sm bg-white">
                    <span className="text-[10px] font-black text-slate-900 print:text-black">✓</span>
                  </div>
                  <span className="text-[11px] font-bold leading-none">{displayLabel}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-slate-400 italic text-[11px]">No original documents recorded.</div>
        )}
      </div>

      <div className="flex-1"></div>

      {/* Signature block */}
      <div className="flex justify-end mb-2 relative mt-auto pt-2">
        <div className="text-center min-w-[160px]">
          <div className="border-t-[1.5px] border-slate-900 print:border-black w-full mb-1"></div>
          <p className="font-black text-[10px] tracking-wide uppercase print:text-black">Authorized Signature</p>
        </div>
      </div>

      {/* Note Box */}
      <div className="border-[1.5px] border-slate-900 p-2 text-[9px] font-bold leading-relaxed print:border-black print:text-black">
        <p><span className="font-black">Note:</span> Parents are requested to preserve this receipt for future clarifications in
        respect of fee paid by you. Fee once paid will not be refunded or transferred.
        Cheques subject to realization.</p>
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:py-0 print:bg-white font-sans text-slate-900 overflow-x-auto">
      <div className="max-w-[1400px] min-w-[1100px] mx-auto print:min-w-0 print:mx-0">
        
        {/* Print Action Bar (Hidden in print) */}
        <div className="flex justify-between items-center mb-6 print:hidden px-6">
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

        {/* A4 Landscape Page Container */}
        <div 
          ref={receiptRef}
          className="bg-white shadow-2xl mx-auto print:shadow-none w-full aspect-[1.414/1] print:w-full print:h-[210mm] print:aspect-auto overflow-hidden flex flex-col m-0 p-0"
        >
          <style>
            {`
              @media print {
                @page { size: A4 landscape; margin: 0; }
                body { 
                  margin: 0;
                  padding: 0;
                  background-color: white !important;
                }
              }
            `}
          </style>
          
          {/* Header Row for Copy Designations (Outside the twin-copy padding for better alignment with sheet edge) */}
          <div className="flex justify-between px-10 pt-4 print:px-14 print:pt-6">
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest print:text-black">OFFICE COPY</div>
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest print:text-black">STUDENT COPY</div>
          </div>

          {/* Twin Copy Layout */}
          <div className="flex-1 px-4 pb-4 pt-1 print:px-8 print:pb-8 flex flex-row print:w-full print:h-full gap-4 print:gap-8 box-border">
            {/* Left Copy */}
            <div className="flex-1 h-full">
              <ReceiptCopy type="OFFICE COPY" />
            </div>

            {/* Vertically centered cut line */}
            <div className="flex flex-col items-center justify-center relative w-1 px-1">
               <div className="absolute inset-y-0 border-l-[1px] border-dashed border-slate-400"></div>
               <div className="bg-white py-4 z-10 flex flex-col items-center gap-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] vertical-text">CUT HERE</span>
                  <span className="text-sm">✂</span>
               </div>
            </div>

            {/* Right Copy */}
            <div className="flex-1 h-full">
              <ReceiptCopy type="STUDENT COPY" />
            </div>
          </div>

        </div>
      </div>
      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  );
}
