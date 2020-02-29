#!/usr/bin/env node

const os = require("os");
const fs = require("fs");
const path = require("path");
const { download } = require("@nodegui/artifact-installer");

const platform = os.platform();
const outDir = path.resolve(__dirname, "..", "deps");
const linuxDeployQtBinary = path.resolve(outDir, "linuxdeployqt");

function getArtifactsConfig() {
  const artifacts = [
    {
      name: "Linux deploy Qt",
      link: `https://github.com/probonopd/linuxdeployqt/releases/download/continuous/linuxdeployqt-continuous-x86_64.AppImage`,
      outPath: linuxDeployQtBinary,
      postSetup: async () => {
        console.log("Setting up permissions for linuxdeployqt");
        return fs.chmodSync(linuxDeployQtBinary, 0o755);
      }
    }
  ];
  return artifacts;
}

async function setupBinaries() {
  if (platform !== "linux") {
    return console.log(`Nothing extra to setup for ${platform}`);
  }

  return Promise.all(
    getArtifactsConfig().map(async artifact => {
      return download(artifact.link, artifact.outPath, {
        name: artifact.name,
        skipIfExist: true
      }).then(artifact.postSetup);
    })
  );
}

setupBinaries().catch(err => {
  console.error(err);
  process.exit(1);
});
