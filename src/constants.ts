import { Student, DocumentKey } from './types';

export const getChecklistItems = (program: 'UG' | 'PG'): { key: DocumentKey; label: string }[] => {
  switch (program) {
    case 'UG':
      return [
        { key: 'sscMemo', label: '10TH CLASS MEMO' },
        { key: 'sscBonafide', label: '10TH CLASS BONAFIDE' },
        { key: 'schoolBonafide6to9', label: 'BONAFIDE FROM 6TH TO 9TH CLASS' },
        { key: 'interPC', label: 'INTER/DIPLOMA/DEGREE MEMO' },
        { key: 'tc', label: 'TRANSFER CERTIFICATE (TC)' },
        { key: 'interBonafide', label: 'INTER/DIPLOMA/DEGREE BONAFIDE' },
      ];
    case 'PG':
      return [
        { key: 'sscMemo', label: '10TH CLASS MEMO' },
        { key: 'interPC', label: 'INTER/DIPLOMA MEMO' },
        { key: 'degreeCMM', label: 'DEGREE/B.TECH CMM' },
        { key: 'degreePC', label: 'DEGREE/B.TECH PC' },
        { key: 'tc', label: 'TRANSFER CERTIFICATE (TC)' },
        { key: 'degreeBonafide', label: 'DEGREE/B.TECH BONAFIDE' },
      ];
    default:
      return [];
  }
};
