export default async function readDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  path = ""
) {
  const files: any = {};

  for await (const item of directoryHandle.values()) {
    if (item.kind === "directory") {
      const subDirectoryHandle = await directoryHandle.getDirectoryHandle(
        item.name
      );
      files[item.name] = await readDirectory(
        subDirectoryHandle,
        path + item.name + "/"
      );
    } else {
      const file = await item.getFile();
      files[item.name] = file;
    }
  }

  return files;
}
