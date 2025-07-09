import * as React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App-debug";
import "./index.css";

// Debug React environment
console.log('React in main:', React);
console.log('React.useRef in main:', React.useRef);

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
