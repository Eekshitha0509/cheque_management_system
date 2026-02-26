import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
        Digital Cheque Management <br />
        <span className="text-blue-600">Simplified.</span>
      </h1>
      <p className="text-gray-600 max-w-lg mb-10 text-lg">
        Replace your manual record books. Digitally track every cheque with real-time status alerts.
      </p>
      <Link 
        href="/register" 
        className="px-10 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg transition"
      >
        Get Started Now
      </Link>
    </div>
  );
}