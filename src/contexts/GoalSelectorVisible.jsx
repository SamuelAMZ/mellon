import { createContext, useState } from "react";

const GoalsSelectorVisibleContext = createContext();

export const GoalsSelectorVisiblePorvider = ({ children }) => {
  const [goalsSelectorVisible, setGoalsSelectorVisible] = useState(false);

  const changeGoalsSelectorVisible = (newLogin) => {
    setGoalsSelectorVisible(newLogin);
  };

  return (
    <GoalsSelectorVisibleContext.Provider
      value={{ goalsSelectorVisible, changeGoalsSelectorVisible }}
    >
      {children}
    </GoalsSelectorVisibleContext.Provider>
  );
};

export default GoalsSelectorVisibleContext;
