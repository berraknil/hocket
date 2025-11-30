import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "./error-page";
import "./index.css";
import { webTargets } from "@/settings.json";

const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("./routes/landing"),
    errorElement: <ErrorPage />,
  },
  {
    path: "/auth/sign-in",
    lazy: () => import("./routes/auth/sign-in"),
    errorElement: <ErrorPage />,
  },
  {
    path: "/dashboard",
    lazy: () => import("./routes/dashboard"),
    errorElement: <ErrorPage />,
  },
  {
    path: "s/:name",
    lazy: () => import("./routes/session"),
    errorElement: <ErrorPage />,
  },
  ...webTargets.map((target) => ({
    path: `frames/${target}`,
    lazy: () => import(`./routes/frames/${target}.tsx`),
  })),
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </React.StrictMode>,
);
