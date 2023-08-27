import { useEffect } from "react";
import volumeViewer from "../core";

export default (...args) => {
  useEffect(() => {
    const vv = new volumeViewer(...args);
    console.log(vv.canvas);
  }, []);
};
