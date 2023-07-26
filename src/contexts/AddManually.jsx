import { createContext, useState } from "react";

const AddManuallyContext = createContext();

export const AddManuallyPorvider = ({ children }) => {
  const [addManually, setAddManually] = useState({
    active: false,
    previousView: null,
  });

  const changeAddManually = (newLogin) => {
    setAddManually(newLogin);
  };

  return (
    <AddManuallyContext.Provider value={{ addManually, changeAddManually }}>
      {children}
    </AddManuallyContext.Provider>
  );
};

export default AddManuallyContext;
