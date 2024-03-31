import { fork } from "child_process";
import consola from "consola";
import { glob } from "glob";
import path from "path";

const runTests = async () => {
  const testDir = path.resolve("./__test__");
  const testFiles = await glob([testDir, "**/*.test.ts"]);
  await Promise.allSettled(testFiles.map(async (filePath) => {
    const testFilePath = path.resolve(filePath);
    const testPromise = new Promise<void>((resolve, reject) => {
      const child = fork("node", ["--import tsx", "--test", testFilePath], { stdio: "inherit" });
      child.on("exit", (code) => {
        if (code !== 0) {
          consola.error(`Test file "${testFilePath}" failed.`);
          reject();
        }
        resolve();
      });
    });
    return testPromise;
  }));
};

(async () => {
  await runTests();
})();
