import { useEffect, useState } from "react";
import Application from "../core/Application";

const useWhiteboardApp = () => {
  const [app, setApp] = useState(null);
  useEffect(() => {
    const app = new Application({
      $canvas: document.querySelector(".webgl"),
    });
    setApp(app);
  }, []);
  return app;
};


export default useWhiteboardApp