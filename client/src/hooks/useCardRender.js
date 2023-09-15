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

    WB.API.on("cardMove", ({ x, y, width, height }) => {
      // WB.API.cardMove({ x, y, width, height, id });
    });

    WB.API.on("cardLoad", (id) => {
      // WB.API.cardLoad(id);
    })

    WB.API.on("cardSelect", ({ x, y, width, height }) => {
      // WB.API.cardSelect(x, y, width, height);
    })

    WB.API.on("cardLeave", (id) => {
      // WB.API.cardLeave(id);
    })


  }, [WB]);

  return renderer;
};
