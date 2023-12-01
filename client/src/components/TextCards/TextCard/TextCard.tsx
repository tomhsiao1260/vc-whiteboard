import React, { useState } from "react";
import { cn } from "../../../utils/cn";
import { css } from "@emotion/css";
import { useHover } from "../../../hooks/useHover";

export default function TextCard({ card }) {
  const [hover, isHover] = useHover();
  const [fontSize, setFontSize] = useState<number>(16);
  return (
    <div
      // @ts-ignore
      ref={hover}
      className={cn(
        "hover:border-[#DDD] border-transparent border-2",
        "fixed translate-x-[-50%] translate-y-[-50%]",

        css(`
            top: ${card.positionScreen.y}px;
            left: ${card.positionScreen.x}px;
            width: ${card.widthScreen}px;
            height:${card.heightScreen}px;
        `)
      )}
    >
      {isHover && (
        <div
          className="absolute top-[-24px] flex justify-between"
          style={{ width: card.widthScreen }}
        >
          <p>{card.name}</p>
          <div className="flex gap-2 text-black ">
            <p className="text-white">font size</p>
            <input
              className="py-0.5"
              value={fontSize}
              onChange={(e) => {
                setFontSize(Number(e.target.value));
              }}
              type="text"
            />
          </div>
        </div>
      )}
      <div
        className={cn(
          "overflow-auto",
          css(`
            top: ${card.positionScreen.y}px;
            left: ${card.positionScreen.x}px;
            width: ${card.widthScreen}px;
            height:${card.heightScreen}px;
        `)
        )}
      >
        <pre
          style={{ fontSize }}
          dangerouslySetInnerHTML={{ __html: card.content }}
        ></pre>
      </div>
    </div>
  );
}
