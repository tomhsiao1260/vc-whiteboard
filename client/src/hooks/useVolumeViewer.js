import { useEffect } from "react";
import Application from "../core/Application";

export default () => {
  useEffect(() => {
    new Application({
      $canvas: document.querySelector(".webgl"),
    });
  }, []);
};
