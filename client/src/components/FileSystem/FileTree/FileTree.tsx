import React, { useState } from "react";
import { AiOutlineCaretDown, AiOutlineCaretRight } from "react-icons/ai";
import formatBytes from "../../../utils/formatBytes";

const Dir = ({ name, item, fileOnClick, folderOnClick }) => {
  const [open, setOpen] = useState(true);
  return (
    <li className="pl-4">
      {item instanceof File ? (
        // file
        <span
          onClick={async () => {
            fileOnClick && fileOnClick(item);
          }}
          className="pl-4 hover:underline"
          title={"file | " + formatBytes(item.size)}
        >
          {name}
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
          {name}
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
