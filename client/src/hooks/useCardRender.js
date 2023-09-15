import { useCallback, useEffect, useState } from "react";

// render card (threejs part) via id, and return data that react app need.

export default (WB, id) => {
  /**
   * $ renderer object
   * * x: number | undefined
   * * y: number | undefined
   * * z: number | undefined
   * * isLoad: boolean
   */
  const [renderer, setRenderer] = useState(null);

  useEffect(() => {
    // yao's code (may be a function call)
    // do the threejs rendering work, and provide data that react app need.
    // call setRenderer to update State
    // e.g. setRenderer({x: 1, y: 2, z: 3, isLoad: true})
  }, [renderer]);

  return renderer;
};
