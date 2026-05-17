import './globals.css';

export const metadata = {
  title: 'CodeSage AI — Senior Engineer AI Pull Request Reviewer',
  description: 'AI-powered pull request reviews that think, analyze, and communicate like a 10+ year veteran senior software engineer.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
