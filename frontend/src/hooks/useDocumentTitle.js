import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | AcademicHub` : 'AcademicHub';
  }, [title]);
};

export default useDocumentTitle;
