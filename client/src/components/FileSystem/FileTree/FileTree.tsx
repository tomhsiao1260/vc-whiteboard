import React, { useCallback, useState } from "react";
import { AiOutlineCaretDown, AiOutlineCaretRight } from "react-icons/ai";
import formatBytes from "../../../utils/formatBytes";
import {
  LuScroll,
  LuFolder,
  LuFolderOpen,
  LuImage,
  LuFile,
  LuFileText,
} from "react-icons/lu";

const Dir = ({ name, item, fileOnClick, folderOnClick }) => {
  const [open, setOpen] = useState(true);

  const distinguishFileType = useCallback((name: string, type: string) => {
    const spl = type.split("/")[0];
    if (spl === "image") {
      return (
        <>
          <LuImage color="lightgreen" />
          {name}
        </>
      );
    } else if (spl === "text" || type.split("/")[0] === "application") {
      return (
        <>
          <LuFileText />
          {name}
        </>
      );
    } else {
      return (
        <>
          <LuFile />
          {name}
        </>
      );
    }
  }, []);

  return (
    <li className="pl-4">
      {item instanceof File ? (
        // file
        <span
          onClick={async () => {
            fileOnClick && fileOnClick(item);
          }}
          className="flex items-center pl-4 hover:underline"
          title={"file | " + formatBytes(item.size)}
        >
          <div className="flex items-center gap-2">
            {distinguishFileType(name, item.type)}
          </div>
        </span>
      ) : (
        // folder
        <span
          onClick={() => {
            setOpen(!open);
            folderOnClick && folderOnClick(item);
          }}
          className="flex items-center gap-1 hover:underline"
          title="segment"
        >
          {open ? <AiOutlineCaretRight /> : <AiOutlineCaretDown />}
          {name.match(/202[34]\d+/gu) ? (
            <div className="flex items-center gap-2">
              <LuScroll className="text-orange-500" />
              {name}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {open ? (
                <LuFolderOpen className="text-yellow-400" />
              ) : (
                <LuFolder className="text-yellow-400" />
              )}
              {name}
            </div>
          )}
        </span>
      )}
      {item instanceof Object && open && (
        <FileTree
          data={item}
          fileOnClick={fileOnClick}
          folderOnClick={folderOnClick}
        />
      )}
    </li>
  );
};

const FileTree = ({ data, fileOnClick, folderOnClick }) => {
  return (
    <ul className="text-sm cursor-pointer">
      {Object.entries(data).map(([name, item]) => (
        <Dir
          key={name}
          name={name}
          item={item}
          fileOnClick={fileOnClick}
          folderOnClick={folderOnClick}
        />
      ))}
    </ul>
  );
};

export default FileTree;
