// src/components/BoardFrame.tsx
import React from "react";
import "../styles/BoardFrame.css";

interface BoardFrameProps {
  children: React.ReactNode; 
}
 
const BoardFrame: React.FC<BoardFrameProps> = ({ children }) => {
  return (
    <div className="board-frame">
      <div className="center-content">
        {children}
      </div>
    </div>
  );
};

export default BoardFrame;
