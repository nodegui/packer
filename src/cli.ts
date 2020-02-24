#!/usr/bin/env node

import program from "commander";
import process from "process";
import { getPacker } from "./index";

program
  .option("-i, --init <name>", "Creates initial deploy files")
  .option("-p, --pack <distPath>", "Packs the app into deployable")
  .option("-s, --sign <identity>", "Signs the app during packing using identity (macOS)");

program.parse(process.argv);
const options = program.opts();

const platformName = process.platform;
const packer = getPacker(platformName);

if (program.init) {
  packer.init(options.init);
}

if (program.pack) {
  packer.pack(options.pack, options.sign);
}
