import "./globals.css";
import Header from "../components/Header";

export const metadata = {
  title: "Teacher Attendance",
  description: "Scan in, see the daily and monthly earliest-arrival ranking.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900">
        <div className="max-w-md mx-auto p-4">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
