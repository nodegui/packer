import { spawn } from "child_process";
import plist from "plist";
import path from "path";
import fs from "fs-extra";
//@ts-ignore
import qode from "@nodegui/qode";
//@ts-ignore
import { qtHome } from "@nodegui/nodegui/config/qtConfig";

const cwd = process.cwd();
export const deployDirectory = path.resolve(cwd, "deploy");
export const configFile = path.resolve(deployDirectory, "config.json");
export const usertemplateDir = path.resolve(deployDirectory, "darwin");
export const buildDir = path.resolve(usertemplateDir, "build");

function getAllNodeAddons(dirPath: string) {
  const addonExt = "node";
  let dir = fs.readdirSync(dirPath);
  return dir
    .filter((elm) => elm.match(new RegExp(`.*\.(${addonExt}$)`, "ig")))
    .map((eachElement) => path.resolve(dirPath, eachElement));
}

function addonCommands(addonPaths: string[]): string[] {
  return addonPaths.reduce((commandList: string[], currentAddon) => {
    commandList.push(`-executable=${currentAddon}`);
    return commandList;
  }, []);
}

export async function copyQode(dest: string) {
  const qodeBinaryFile = qode.qodePath;
  await fs.chmod(qodeBinaryFile, "755");
  await fs.copyFile(qodeBinaryFile, path.resolve(dest, "qode"));
}

export async function copyAppDist(distPath: string, resourceDir: string) {
  await fs.copy(distPath, path.resolve(resourceDir, "dist"), {
    recursive: true,
  });
}

type macDeployQtOptions = {
  appName: string;
  buildDir: string;
  resourceDir: string;
};

export async function runMacDeployQt({
  appName,
  buildDir,
  resourceDir,
}: macDeployQtOptions) {
  const macDeployQtBin = path.resolve(qtHome, "bin", "macdeployqt");
  try {
    await fs.chmod(macDeployQtBin, "755");
  } catch (err) {
    console.warn(`Warning: Tried to fix permission for macdeployqt but failed`);
  }
  const distPath = path.resolve(resourceDir, "dist");
  const allAddons = getAllNodeAddons(distPath);

  const options = [
    `${appName}.app`,
    "-verbose=3",
    `-libpath=${qode.qtHome}`,
    '-dmg',
    ...addonCommands(allAddons),
  ];

  const macDeployQt = spawn(macDeployQtBin, options, { cwd: buildDir });

  return new Promise((resolve, reject) => {
    macDeployQt.stdout.on("data", function (data) {
      console.log("stdout: " + data.toString());
    });

    macDeployQt.stderr.on("data", function (data) {
      console.log("stderr: " + data.toString());
    });

    macDeployQt.on("exit", function (code) {
      if (!code) {
        return resolve();
      }
      return reject("child process exited with code " + code);
    });
  });
}

export async function fixupTemplateApp(
  config: Config,
  templateAppPath: string
) {
  const infoPlistPath = path.resolve(templateAppPath, "Contents", "Info.plist");
  const infoPlist = await fs.readFile(infoPlistPath, { encoding: "utf-8" });
  const infoPlistParsed: any = plist.parse(infoPlist);
  infoPlistParsed.CFBundleName = config.appName;
  await fs.writeFile(infoPlistPath, plist.build(infoPlistParsed));
}
