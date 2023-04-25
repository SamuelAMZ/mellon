import react, { useEffect, useState } from "react";

// react query
import { QueryClient, QueryClientProvider } from "react-query";

// contexts
import { VisibleScrensProvider } from "./contexts/visibleScreens";

// components
import FirstScreen from "./components/FirstScreen";

function App() {
  // react query
  const client = new QueryClient();

  useEffect(() => {
    chrome.runtime.sendMessage({ from: "openFirstDegreeTab" });

    // append font
    const fontLink1 = document.createElement("link");
    fontLink1.rel = "preconnect";
    fontLink1.href = "https://fonts.googleapis.com";

    const fontLink2 = document.createElement("link");
    fontLink2.rel = "preconnect";
    fontLink2.href = "https://fonts.gstatic.com";
    fontLink2.crossOrigin = true;

    const fontLink3 = document.createElement("link");
    fontLink3.href =
      "https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700&display=swap";
    fontLink3.rel = "stylesheet";

    document.head.appendChild(fontLink1);
    document.head.appendChild(fontLink2);
    document.head.appendChild(fontLink3);
  }, []);

  return (
    <>
      <QueryClientProvider client={client}>
        <VisibleScrensProvider>
          <FirstScreen />
        </VisibleScrensProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
