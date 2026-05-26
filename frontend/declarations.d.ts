import 'react';

declare module 'html2pdf.js' {
  const html2pdf: any;
  export default html2pdf;
}

declare module 'react' {
  interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      style: React.DetailedHTMLProps<React.StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement> & {
        jsx?: boolean;
        global?: boolean;
      };
    }
  }
}
