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
    await logAction('PDF Download', `Downloaded PDF receipt for student ${currentStudent.name} (Admission No: ${currentStudent.admissionNo}).`, currentStudent.id);

    try {
      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // Better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Admission_Receipt_${currentStudent.admissionNo}_${currentStudent.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try printing as PDF instead.');
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
  ];

  const ReceiptCopy = () => {
    // Filter to only include checked documents per the user's request "only ticked should print"
    const tickedDocuments = checklistMap.filter(item => !!currentStudent.documents[item.key as keyof typeof currentStudent.documents]);

    return (
    <div className="border border-slate-800 p-4 sm:p-6 h-full flex flex-col bg-transparent print:bg-transparent relative">
      <div className="text-center border-b border-gray-800 pb-3 mb-4 print:border-black">
        <div className="flex justify-center mb-2">
          <img src="https://mrdu.edu.in/wp-content/uploads/2025/08/Logo.png" alt="MRDU Logo" className="h-14 w-auto grayscale print:grayscale-0" referrerPolicy="no-referrer" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider mb-1 print:text-black leading-tight">MALLA REDDY (MR)</h1>
        <div className="flex flex-col items-center">
          <p className="text-[11px] sm:text-[13px] font-bold text-slate-800 print:text-black uppercase tracking-wide leading-tight mt-0.5">
            (DEEMED TO BE UNIVERSITY)
          </p>
          <p className="text-[9px] sm:text-[11px] font-medium text-slate-600 print:text-black leading-tight">
            Recognised Under Section 3 of The UGC Act, 1956.
          </p>
        </div>
        <p className="text-[10px] sm:text-[11px] font-semibold print:text-black mt-3">
          Maisammaguda, Dhulapally, Secunderabad - 500100, Telangana, India. | www.mrdu.edu.in | Phone No: 9348161303
        </p>
      </div>

      <h2 className="text-center text-lg font-bold mb-6 underline underline-offset-4 uppercase print:text-black tracking-wide">
        Admissions Certification
      </h2>

      <div className="grid grid-cols-[150px_10px_1fr] sm:grid-cols-[180px_10px_1fr] gap-y-3 mb-8 text-sm sm:text-base font-semibold print:text-black">
        <div>Enq.No</div>
        <div>:</div>
        <div>{currentStudent.admissionNo}</div>

        <div>Name of the student</div>
        <div>:</div>
        <div>{currentStudent.name}</div>

        <div>Fathers' Name</div>
        <div>:</div>
        <div>{currentStudent.fatherName}</div>

        <div>Academic Year</div>
        <div>:</div>
        <div>{currentStudent.academicYear}</div>

        <div>Course Name</div>
        <div>:</div>
        <div>{currentStudent.branch}</div>
      </div>

      <div className="space-y-3 mb-10 text-sm sm:text-base font-medium print:text-black">
        <div className="font-bold underline mb-2">Submitted Documents:</div>
        {tickedDocuments.length > 0 ? (
          <div className="grid grid-cols-2 gap-y-3 gap-x-8">
            {tickedDocuments.map((item) => (
              <div key={item.key} className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-gray-800 print:border-black flex items-center justify-center shrink-0 rounded-sm bg-white">
                  <span className="text-lg leading-none -mt-1 font-bold text-gray-800 print:text-black">✓</span>
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 italic">No documents verified yet.</div>
        )}
      </div>

      <div className="flex-1"></div>

      {/* Signature block */}
      <div className="flex justify-end mb-6 relative mt-auto pt-10">
        <div className="text-center min-w-[200px]">
          <div className="border-t-[1.5px] border-gray-800 print:border-black w-full mb-2"></div>
          <p className="font-bold text-sm tracking-wide uppercase print:text-black">Authorized Signature</p>
        </div>
      </div>

      <div className="border border-gray-800 p-3 text-xs sm:text-sm font-medium leading-snug print:border-black print:text-black">
        <span className="font-bold">Note:</span> Parents are requested to preserve this receipt for future clarifications in
        respect of fee paid by you. Fee once paid will not be refunded or transferred.
        Cheques subject to realization.
      </div>
    </div>
  )};

  return (
    <div className="min-h-screen bg-gray-200 py-8 print:py-0 print:bg-white font-sans text-gray-900 overflow-x-auto">
      <div className="max-w-[1200px] min-w-[700px] mx-auto print:min-w-0 print:mx-0">
        
        {/* Print Action Bar (Hidden in print) */}
        <div className="flex justify-between items-center mb-6 print:hidden px-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className={`flex items-center px-4 py-2 ${isDownloading ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-lg shadow-lg font-medium transition-all active:scale-95`}
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
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 font-medium transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </button>
          </div>
        </div>

        {/* A4 Page Container */}
        <div 
          ref={receiptRef}
          className="bg-white shadow-xl mx-auto print:shadow-none w-full max-w-[1240px] aspect-[1.414/1] print:w-full print:h-screen print:max-w-none overflow-hidden flex flex-col m-0 p-0 origin-top"
        >
          <style>
            {`
              @media print {
                @page { size: A4 landscape; margin: 0; }
                body { 
                  margin: 0;
                  padding: 0;
                  background-color: white !important;
                  -webkit-print-color-adjust: exact !important; 
                  print-color-adjust: exact !important; 
                }
              }
            `}
          </style>
          
          {/* We want two identical receipts side-by-side on an A4 Landscape page */}
          <div className="flex-1 p-6 print:p-8 flex flex-row justify-between print:w-full print:h-full gap-8 print:gap-12 box-border">
            {/* Left Copy */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-right text-[10px] font-bold mb-1 text-gray-500 uppercase tracking-widest">Office Copy</div>
              <ReceiptCopy />
            </div>

            {/* Cut Line */}
            <div className="border-l-2 border-dashed border-gray-400 mx-2 relative flex justify-center items-center">
               <span className="bg-white py-4 text-gray-400 text-xs font-mono tracking-widest uppercase absolute whitespace-nowrap rotate-90">✂ Cut Here ✂</span>
            </div>

            {/* Right Copy */}
            <div className="flex-1 flex flex-col justify-center">
               <div className="text-right text-[10px] font-bold mb-1 text-gray-500 uppercase tracking-widest">Student Copy</div>
              <ReceiptCopy />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
