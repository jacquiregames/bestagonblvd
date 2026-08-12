// src/components/BoardFrame.tsx
import React from "react";
import "../styles/BoardFrame.css";

interface BoardFrameProps {
  children: React.ReactNode;
  // FIX: Removed dead `players` and `turnOrder` props. They were never read inside this
  // component — they existed only to silence TypeScript warnings at call sites that
  // were passing them unnecessarily. The correct fix is to stop accepting props that
  // aren't used, not to accept them and ignore them. The call site in App.tsx has been
  // updated to stop passing them.
}

/**
 * BoardFrame
 *
 * Renders whatever is passed as children inside a consistent frame container.
 * The App composes the full game layout inside the children prop.
 */
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
