import { useEffect, useState } from "react";
import Application from "../core/Application";

export default () => {
  const [WB, setWB] = useState(null);
  useEffect(() => {
    const WB = new Application({
      $canvas: document.querySelector(".webgl"),
    });
    setWB(WB);
  }, []);
  return WB;
};
