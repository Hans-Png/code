import path from "path";

const rootDirPath = path.resolve(__dirname, "../../");
const dataDirPath = path.resolve(rootDirPath, "data");
const logDirPath = path.resolve(rootDirPath, "logs");

export default {
  root: rootDirPath,
  data: dataDirPath,
  log: logDirPath,
};
