import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "@/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LandingPage } from "@/modules/landing/LandingPage";
import { LessonView } from "@/modules/lesson/LessonView";
import { PizzaInScene } from "@/modules/preview/PizzaInScene";
import { PizzaPreview } from "@/modules/preview/PizzaPreview";
import { GuestPreview } from "@/modules/preview/GuestPreview";
import { SandboxPreview } from "@/modules/preview/SandboxPreview";
import { VoicePreview } from "@/modules/preview/VoicePreview";
import "@/styles/globals.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "lesson", element: <LessonView /> },
      { path: "preview/pizza", element: <PizzaPreview /> },
      { path: "preview/scene", element: <PizzaInScene /> },
      { path: "preview/sandbox", element: <SandboxPreview /> },
      { path: "preview/guests", element: <GuestPreview /> },
      { path: "preview/voice", element: <VoicePreview /> },
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
