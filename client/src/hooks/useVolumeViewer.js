import { useEffect, useState } from "react";
import Application from "../core/Application";

export default () => {
  const [whiteboard, setWhiteboard] = useState(null);
  useEffect(() => {
    const whiteboard = new Application({
      $canvas: document.querySelector(".webgl"),
    });
    setWhiteboard(whiteboard);
  }, []);
  return whiteboard;
};
