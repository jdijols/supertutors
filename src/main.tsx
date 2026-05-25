import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import App from "@/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LandingPage } from "@/platform/landing/LandingPage";
import { LessonHost } from "@/platform/LessonHost";
import "@/styles/globals.css";

// Preview routes are dev-only tooling — lazy-load so lesson/dialogue assets
// don't inflate the main bundle.
const PizzaInScene = lazy(() => import("@/lessons/freddy-fractions/previews/PizzaInScene").then((m) => ({ default: m.PizzaInScene })));
const PizzaPreview = lazy(() => import("@/lessons/freddy-fractions/previews/PizzaPreview").then((m) => ({ default: m.PizzaPreview })));
const GuestPreview = lazy(() => import("@/lessons/freddy-fractions/previews/GuestPreview").then((m) => ({ default: m.GuestPreview })));
const VoicePreview = lazy(() => import("@/lessons/freddy-fractions/previews/VoicePreview").then((m) => ({ default: m.VoicePreview })));
const CvPreview = lazy(() => import("@/platform/previews/CvPreview").then((m) => ({ default: m.CvPreview })));

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "lessons/:slug", element: <LessonHost /> },
      { path: "lesson", element: <Navigate to="/lessons/freddy-fractions" replace /> },
      { path: "preview/pizza", element: <Suspense><PizzaPreview /></Suspense> },
      { path: "preview/scene", element: <Suspense><PizzaInScene /></Suspense> },
      { path: "preview/guests", element: <Suspense><GuestPreview /></Suspense> },
      { path: "preview/voice", element: <Suspense><VoicePreview /></Suspense> },
      { path: "preview/cv", element: <Suspense><CvPreview /></Suspense> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>,
);
