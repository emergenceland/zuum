import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const updateViewportHeight = () => {
  document.documentElement.style.setProperty(
    "--viewport-height",
    `${window.innerHeight}px`,
  );
};

updateViewportHeight();
ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
);
