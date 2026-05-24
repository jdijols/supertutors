import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import App from "@/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LandingPage } from "@/platform/landing/LandingPage";
import { LessonHost } from "@/platform/LessonHost";
import { PizzaInScene } from "@/lessons/freddy-fractions/previews/PizzaInScene";
import { PizzaPreview } from "@/lessons/freddy-fractions/previews/PizzaPreview";
import { GuestPreview } from "@/lessons/freddy-fractions/previews/GuestPreview";
import { VoicePreview } from "@/lessons/freddy-fractions/previews/VoicePreview";
import { CvPreview } from "@/platform/previews/CvPreview";
import "@/styles/globals.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "lessons/:slug", element: <LessonHost /> },
      { path: "lesson", element: <Navigate to="/lessons/freddy-fractions" replace /> },
      { path: "preview/pizza", element: <PizzaPreview /> },
      { path: "preview/scene", element: <PizzaInScene /> },
      { path: "preview/guests", element: <GuestPreview /> },
      { path: "preview/voice", element: <VoicePreview /> },
      { path: "preview/cv", element: <CvPreview /> },
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
