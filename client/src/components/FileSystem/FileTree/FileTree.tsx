import React, { useState } from "react";
import { AiOutlineCaretDown, AiOutlineCaretRight } from "react-icons/ai";

const Dir = ({ name, item, fileOnClick }) => {
  const [open, setOpen] = useState(true);
  return (
    <li className="pl-4">
      {item instanceof File ? (
        <span
          onClick={async () => {
            fileOnClick && fileOnClick(item);
          }}
          className="pl-4 hover:underline"
        >
          {name}
        </span>
      ) : (
        <span
          onClick={() => {
            setOpen(!open);
          }}
          className="flex items-center gap-1 hover:underline"
        >
          {open ? <AiOutlineCaretRight /> : <AiOutlineCaretDown />}
          {name}
        </span>
      )}
      {item instanceof Object && open && (
        <FileTree data={item} fileOnClick={fileOnClick} />
      )}
    </li>
  );
};

const FileTree = ({ data, fileOnClick }) => {
  return (
    <ul className="text-sm cursor-pointer">
      {Object.entries(data).map(([name, item]) => (
        <Dir key={name} name={name} item={item} fileOnClick={fileOnClick} />
      ))}
    </ul>
  );
};

export default FileTree;
