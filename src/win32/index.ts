import fs from "fs-extra";
import path from "path";
import { spawn } from "child_process";
//@ts-ignore
import qode from "@nodegui/qode";
const cwd = process.cwd();
const deployDirectory = path.resolve(cwd, "deploy");
const configFile = path.resolve(deployDirectory, "config.json");

const copyQode = async (dest: string) => {
  const qodeBinaryFile = qode.qodePath;
  await fs.chmod(qodeBinaryFile, "755");
  await fs.copyFile(qodeBinaryFile, path.resolve(dest, "qode.exe"));
};

const copyAppDist = async (distPath: string, resourceDir: string) => {
  await fs.copy(distPath, path.resolve(resourceDir, "dist"), {
    recursive: true
  });
};

const runWinDeployQt = async (appName: string, buildDir: string) => {
  const qtHome = process.env.QT_INSTALL_DIR || qode.qtHome;
  const winDeployQtBin = path.resolve(qtHome, "bin", "windeployqt.exe");
  const winDeployQt = spawn(
    winDeployQtBin,
    [`qode.exe`, "--verbose=2", "--release", "--no-translations"],
    {
      cwd: buildDir
    }
  );

  return new Promise((resolve, reject) => {
    winDeployQt.stdout.on("data", function(data) {
      console.log("stdout: " + data.toString());
    });

    winDeployQt.stderr.on("data", function(data) {
      console.log("stderr: " + data.toString());
    });

    winDeployQt.on("exit", function(code) {
      if (!code) {
        return resolve();
      }
      return reject("child process exited with code " + code);
    });
  });
};

export const init = async (appName: string) => {
  const config = {
    appName: null
  };
  const templateDirectory = path.resolve(__dirname, "../../template/win32");
  const userTemplate = path.resolve(deployDirectory, "win32");
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
  const usertemplate = path.resolve(deployDirectory, "win32");
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
  console.log(`running windeployqt`);
  await runWinDeployQt(appName, buildAppPackage);
  console.log(`Build successful. Find the app at ${buildDir}`);
};
