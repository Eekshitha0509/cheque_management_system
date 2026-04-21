import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PropTypes from "prop-types";  

export const metadata = {
  title: "Q-cheque | Digital Ledger",
  description: "Modern Cheque Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

// ✅ ADD THIS BLOCK
RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};