export default function Footer() {
  return (
    <footer className="py-6 text-center text-gray-400 text-xs border-t bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 text-center">
        © {new Date().getFullYear()} Q-cheque Systems. All rights reserved.
      </div>
    </footer>
  );
}