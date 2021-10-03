import fs from "fs-extra";
import path from "path";
import { spawn } from "child_process";
//@ts-ignore
import qode from "@nodegui/qode";
//@ts-ignore
import { qtHome } from "@nodegui/nodegui/config/qtConfig";
const cwd = process.cwd();
const deployDirectory = path.resolve(cwd, "deploy");
const configFile = path.resolve(deployDirectory, "config.json");
const linuxDeployQtBin = path.resolve(
  __dirname,
  "..",
  "..",
  "deps",
  "linuxdeployqt"
);

const copyQode = async (dest: string) => {
  const qodeBinaryFile = qode.qodePath;
  await fs.chmod(qodeBinaryFile, "755");
  await fs.copyFile(qodeBinaryFile, path.resolve(dest, "qode"));
};

const copyAppDist = async (distPath: string, resourceDir: string) => {
  await fs.copy(distPath, path.resolve(resourceDir, "dist"), {
    recursive: true,
  });
};

function getAllNodeAddons(dirPath: string) {
  const addonExt = "node";
  let dir = fs.readdirSync(dirPath);
  return dir
    .filter((elm) => elm.match(new RegExp(`.*\.(${addonExt}$)`, "ig")))
    .map((eachElement) => path.resolve(dirPath, eachElement));
}

const addonCommands = (addonPaths: string[]): string[] => {
  return addonPaths.reduce((commandList: string[], currentAddon) => {
    commandList.push(`-executable=${currentAddon}`);
    return commandList;
  }, []);
};

const runLinuxDeployQt = async (appName: string, buildDir: string) => {
  const distPath = path.resolve(buildDir, "dist");
  const allAddons = getAllNodeAddons(distPath);
  const LD_LIBRARY_PATH = `${qtHome}/lib:${process.env.LD_LIBRARY_PATH}`;

  const linuxDeployQt = spawn(
    linuxDeployQtBin,
    [
      `qode`,
      "-verbose=2",
      "-bundle-non-qt-libs",
      "-appimage",
      `-qmake=${path.resolve(qtHome, "bin", "qmake")}`,
      ...addonCommands(allAddons),
    ],
    { cwd: buildDir, env: { ...process.env, LD_LIBRARY_PATH } }
  );

  return new Promise((resolve, reject) => {
    linuxDeployQt.stdout.on("data", function (data) {
      console.log("stdout: " + data.toString());
    });

    linuxDeployQt.stderr.on("data", function (data) {
      console.log("stderr: " + data.toString());
    });

    linuxDeployQt.on("exit", function (code) {
      if (!code) {
        return resolve(true);
      }
      return reject("child process exited with code " + code);
    });
  });
};

export const init = async (appName: string) => {
  const config = {
    appName: null,
  };
  const templateDirectory = path.resolve(__dirname, "../../template/linux");
  const userTemplate = path.resolve(deployDirectory, "linux");
  const appDir = path.resolve(userTemplate, appName);
  await fs.mkdirp(path.resolve(userTemplate, appDir));
  await fs.copy(templateDirectory, appDir, { recursive: true });
  Object.assign(config, { appName });
  await fs.writeJSON(configFile, config);
};

export const pack = async (distPath: string) => {
  const config = await fs.readJSON(
    path.resolve(deployDirectory, "config.json")
  );
  const { appName } = config;
  const usertemplate = path.resolve(deployDirectory, "linux");
  const templateAppDir = path.resolve(usertemplate, appName);
  const buildDir = path.resolve(usertemplate, "build");
  const buildAppPackage = path.resolve(buildDir, appName);

  console.log(`cleaning build directory at ${buildDir}`);
  await fs.remove(buildDir);
  console.log(`creating build directory at ${buildDir}`);
  await fs.copy(templateAppDir, buildAppPackage, { recursive: true });
  console.log(`copying qode`);
  await copyQode(buildAppPackage);
  console.log(`copying dist`);
  await copyAppDist(distPath, buildAppPackage);
  console.log(`running linuxdeployqt`);
  await runLinuxDeployQt(appName, buildAppPackage);
  console.log(
    `Build successful. Find the AppImage at ${buildAppPackage}. Look for an executable file with extension .AppImage`
  );
};
