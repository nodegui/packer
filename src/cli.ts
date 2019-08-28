#!/usr/bin/env node

import program from "commander";
import { init, pack } from "./index";

program
  .option("-i, --init <name>", "Creates initial deploy files")
  .option("-p, --pack <distPath>", "Packs the app into deployable");

program.parse(process.argv);
const options = program.opts();

if (program.init) {
  init(options.init);
}

if (program.pack) {
  pack(options.pack);
}
