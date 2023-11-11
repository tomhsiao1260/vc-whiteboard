import React, { useState } from "react";
import readDirectory from "../../utils/readDirectory";
import FileTree from "./FileTree/FileTree";
import _ from "lodash";
import { Resizable } from "re-resizable";
import { cn } from "../../utils/cn";

export default function FileSystem() {
  const [dir, setDir] = useState({});
  const [isResize, setIsResize] = useState(false);
  const handleFileOnClick = (file) => {
    console.log(file);
  };

  return (
    <div className="fixed mx-3 my-1 top-16 h-screen overflow-auto">
      {!_.isEmpty(dir) ? (
        <Resizable
          onResizeStart={() => {
            setIsResize(true);
          }}
          onResizeStop={() => {
            setIsResize(false);
          }}
          className={cn(
            "text-lg bg-[#111] opacity-80 py-2 pr-4 overflow-hidden border-4 transition-[border]",
            isResize ? "border-orange-900" : "border-[#111]"
          )}
        >
          <FileTree data={dir} fileOnClick={handleFileOnClick} />
        </Resizable>
      ) : (
        <button
          onClick={async () => {
            const directoryHandle = await window.showDirectoryPicker();
            const dir = await readDirectory(directoryHandle);
            setDir(dir);
          }}
          className="text-lg bg-[#111] opacity-80 hover:opacity-100 py-2 px-4"
        >
          Open Folder
        </button>
      )}
    </div>
  );
}
