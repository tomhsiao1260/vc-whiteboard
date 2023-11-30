import React, { useState } from "react";
import readDirectory from "../../utils/readDirectory";
import FileTree from "./FileTree/FileTree";
import _ from "lodash";
import { Resizable } from "re-resizable";
import { cn } from "../../utils/cn";
import PubSub from "pubsub-js";
import { nanoid } from "nanoid";

export default function FileSystem() {
  const [dir, setDir] = useState({});
  const [isResize, setIsResize] = useState(false);

  const handleFileBtnOnClick = async () => {
    const directoryHandle = await window.showDirectoryPicker();
    const dir = await readDirectory(directoryHandle);
    setDir(dir);
  };

  const handleFileOnClick = async (file: File) => {
    const arraybuffer = await file.arrayBuffer();
    const blob = new Blob([arraybuffer], { type: file.name });
    PubSub.publish("onFileSelect", {
      id: nanoid(),
      fileType: file.type,
      fileName: file.name,
      blob,
    });
  };

  const handleFolderOnClick = async () => {};

  return (
    <div className="fixed mx-3 my-1 top-16 h-[90%] overflow-auto z-50">
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
            isResize ? "" : "border-[#111]"
          )}
        >
          <FileTree
            data={dir}
            fileOnClick={handleFileOnClick}
            folderOnClick={handleFolderOnClick}
          />
        </Resizable>
      ) : (
        <button
          onClick={handleFileBtnOnClick}
          className="text-lg bg-[#111] opacity-80 hover:opacity-100 py-2 px-4"
        >
          Open Folder
        </button>
      )}
    </div>
  );
}
