import fs from "fs-extra";
import path from "path";

import {
  deployDirectory,
  configFile,
  fixupTemplateApp,
  copyQode,
  copyAppDist,
  runMacDeployQt,
  usertemplateDir,
  buildDir,
} from "./helpers";

export async function init(appName: string) {
  const templateDirectory = path.resolve(__dirname, "../../template/darwin");
  const templateApp = path.resolve(usertemplateDir, `${appName}.app`);
  await fs.mkdirp(path.resolve(usertemplateDir, templateApp));
  await fs.copy(templateDirectory, templateApp, { recursive: true });
  const config: Config = { appName };
  await fs.writeJSON(configFile, config);
  await fixupTemplateApp(config, templateApp);
}

export async function pack(distPath: string) {
  const config = await fs.readJSON(
    path.resolve(deployDirectory, "config.json")
  );
  const { appName } = config;

  const templateAppDir = path.resolve(usertemplateDir, `${appName}.app`);
  const buildAppPackage = path.resolve(buildDir, `${appName}.app`);
  const Contents = path.resolve(buildAppPackage, "Contents");
  const MacOs = path.resolve(Contents, "MacOS");
  const resourceDir = path.resolve(Contents, "Resources");
  console.log(`cleaning build directory at ${buildDir}`);
  await fs.remove(buildDir);
  console.log(`creating build directory at ${buildDir}`);
  await fs.copy(templateAppDir, buildAppPackage, { recursive: true });
  console.log(`copying qode`);
  await copyQode(MacOs);
  console.log(`copying dist`);
  await copyAppDist(distPath, resourceDir);
  console.log(`running macdeployqt`);
  await runMacDeployQt({ appName, buildDir, resourceDir });
  console.log(`Build successful. Find the app at ${buildDir}`);
}
