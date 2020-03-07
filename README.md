# Packer 📦

Packer is a npm module that allows you to package apps built with NodeGui or React NodeGui into a standalone executable. Packer works on Mac, Windows and Linux

This is a initial MVP release of the module. 

On MacOS - Packer will output a dmg file

On Linux - Packer will output an AppImage which is something similar to a .app file in MacOS

On Windows - Packer outputs a folder containing the executable and all the dlls.

Currently if you need to produce a build you need to run the packer in different OS environments. That is, cross platform builds are not supported in this release. 

# Usage

- First step is to install the packer as a dev dependency. You can do so by:
  
  `npm install --save-dev @nodegui/packer`

- Next you can run the init command:
  
  ` npx nodegui-packer --init MyApp`
  
  This will produce the deploy directory containing the template. You can modify this to suite your needs. Like add icons, change the name, description and add other native features or dependencies. Make sure you commit this directory.

- Next you can run the pack command:
  
  `npx nodegui-packer --pack <path to dist>`
  
  This command essential takes the dist folder as the input and puts it in the suitable location inside the standalone executable. Also it runs the correct deployment tool (macdeployqt incase of mac, etc) and packs in the dependencies. The output of the command is found under the build directory. You should gitignore the build directory.
  
- macOS supports signing the application:

  `npx nodegui-packer --pack <path to dist> --sign <identity>`
  
  Identity should be added to the keychain and trusted first. Its value can be copied from: `security find-identity -p codesigning`

# How does it work ?

Packer uses Qt's packaging tools in all three platforms.

- On Mac - it uses macdeployqt : https://doc.qt.io/qt-5.9/osx-deployment.html#macdeploy
- On Windows - it uses windeployqt : https://doc.qt.io/qt-5/windows-deployment.html
- On Linux - There is no official tool, hence it uses linuxdeployqt - https://github.com/probonopd/linuxdeployqt


# Requirements
- Needs Qode v2.x (NodeGui v0.15.0 and up)


# Future enhancements:

1. Cross platform builds.
2. Better documentation.
3. Reduce / Remove unnecessary dynamic libraries.
4. Reduce qode binary size.

**Please feel free to help out with this in anyway you can.**
