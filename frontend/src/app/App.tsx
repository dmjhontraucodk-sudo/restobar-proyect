// frontend/src/app/App.tsx
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast"; // Keep Toaster here for global toast messages

import { AppProviders } from "./providers/AppProviders";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <AppProviders>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
            fontSize: "14px",
            border: "1px solid #374151",
            maxWidth: "500px",
          },
          success: {
            duration: 3000,
            style: {
              background: "#10b981",
              border: "1px solid #059669",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#ef4444",
              border: "1px solid #dc2626",
            },
          },
        }}
      />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}
