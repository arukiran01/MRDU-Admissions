import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { ArrowLeft, Printer } from 'lucide-react';

export default function Receipt() {
  const { currentStudent, logAction } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentStudent) {
      navigate('/dashboard');
    }
  }, [currentStudent, navigate]);

  if (!currentStudent) return null;

  const handlePrint = async () => {
    await logAction('Receipt Generation', `Generated receipt for student ${currentStudent.name} (Admission No: ${currentStudent.admissionNo}).`, currentStudent.id);
    window.print();
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
    <div className="border border-slate-800 p-6 sm:p-8 bg-transparent print:bg-transparent relative">
      <div className="text-center border-b border-gray-800 pb-4 mb-4 print:border-black">
        <div className="flex justify-center mb-2">
          <img src="https://mrdu.edu.in/wp-content/uploads/2025/08/Logo.png" alt="MRDU Logo" className="h-14 w-auto grayscale print:grayscale-0" referrerPolicy="no-referrer" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider mb-1 print:text-black">MALLA REDDY (MR)</h1>
        <p className="text-[10px] sm:text-xs font-medium leading-tight print:text-black mb-1">
          <span className="font-bold text-[13px] sm:text-sm">(DEEMED TO BE UNIVERSITY)</span><br />
          Recognised Under Section 3 of The UGC Act, 1956, Vide Notification No.9-5/2025-U.3(A)<br />
          by Department of Higher Education, Ministry of Education, Government of India.
        </p>
        <p className="text-[11px] sm:text-xs font-semibold print:text-black mt-2">
          www.mrdu.edu.in | Phone No: 9348161303
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

      {/* Signature block */}
      <div className="flex justify-end mb-6 relative">
        <div className="text-center">
          {/* Blank space for manual signature */}
          <div className="mb-1 w-32 h-12 flex items-center justify-center relative"></div>
          <p className="font-semibold text-sm print:text-black border-t border-gray-800 pt-2 px-4">Authorized Signature</p>
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
    <div className="min-h-screen bg-gray-200 py-8 print:py-0 print:bg-white font-sans text-gray-900">
      <div className="max-w-[210mm] mx-auto print:mx-0">
        
        {/* Print Action Bar (Hidden in print) */}
        <div className="flex justify-between items-center mb-6 print:hidden px-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <button 
            onClick={handlePrint}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 font-medium transition-colors"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print / Save as PDF
          </button>
        </div>

        {/* A4 Page Container */}
        <div className="bg-white shadow-xl mx-auto print:shadow-none print:w-full print:h-screen overflow-hidden flex flex-col m-0 p-0">
          <style>
            {`
              @media print {
                @page { size: A4 portrait; margin: 0; }
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
          
          {/* We want two identical receipts on one A4 page, usually takes ~50% each */}
          <div className="flex-1 p-6 print:p-8 flex flex-col justify-between print:w-[210mm] print:h-[297mm]">
            {/* Top Copy */}
            <div className="mb-4">
              <div className="text-right text-xs font-bold mb-1 text-gray-500 uppercase tracking-widest">Office Copy</div>
              <ReceiptCopy />
            </div>

            {/* Cut Line */}
            <div className="border-t-2 border-dashed border-gray-400 my-4 relative flex justify-center items-center">
              <span className="bg-white px-4 text-gray-400 text-xs font-mono tracking-widest uppercase absolute">✂ Cut Here ✂</span>
            </div>

            {/* Bottom Copy */}
            <div className="mt-4">
               <div className="text-right text-xs font-bold mb-1 text-gray-500 uppercase tracking-widest">Student Copy</div>
              <ReceiptCopy />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
