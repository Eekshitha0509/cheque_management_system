import PropTypes from 'prop-types'; // 1. Import PropTypes

export default function ProcessingOverlay({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-lg">
      <div className="text-center p-8">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
          Digitalizing Cheque
        </h2>
        <p className="text-slate-500 font-medium max-width: 300px; leading-relaxed mx-auto">
          Our AI is extracting the payee, date, and amount. Please wait a moment.
        </p>
      </div>
    </div>
  );
}

// 2. Define the prop validation
ProcessingOverlay.propTypes = {
  isVisible: PropTypes.bool.isRequired,
};