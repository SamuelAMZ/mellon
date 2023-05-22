import { createContext, useState } from "react";

const VisibleScrensContext = createContext();

export const VisibleScrensProvider = ({ children }) => {
  const [screen, setScreen] = useState({
    first: true,
    login: false,
    menu: false,
    connections: false,
    singleUser: false,
    connectionList: false,
    newKey: false,
    potential: false,
    keysList: false,
    potentialsList: false,
    mutualConnections: false,
  });

  const changeScreen = (newLogin) => {
    setScreen(newLogin);
  };

  return (
    <VisibleScrensContext.Provider value={{ screen, changeScreen }}>
      {children}
    </VisibleScrensContext.Provider>
  );
};

export default VisibleScrensContext;
