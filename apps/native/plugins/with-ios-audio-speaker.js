const { withAppDelegate, withXcodeProject } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

function addAudioConfigToAppDelegate(contents) {
  const swiftImport = "import UIKit";
  const audioConfigCode = `
    do {
      try AVAudioSession.sharedInstance().setCategory(
        .playAndRecord,
        options: [.defaultToSpeaker, .allowBluetooth]
      )
      try AVAudioSession.sharedInstance().setMode(.videoChat)
      try AVAudioSession.sharedInstance().setActive(true)
    } catch {}`;

  if (!contents.includes(swiftImport)) {
    contents = contents.replace(
      "import ExpoModulesCore",
      `import ExpoModulesCore\n${swiftImport}`
    );
  }

  const applicationDidFinishLaunching =
    "application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions:";
  if (contents.includes(applicationDidFinishLaunching)) {
    const lines = contents.split("\n");
    const result = [];
    let found = false;
    for (const line of lines) {
      result.push(line);
      if (!found && line.includes(applicationDidFinishLaunching)) {
        found = true;
      } else if (found && line.trim() === "self.window?.makeKeyAndVisible()") {
        result.push(audioConfigCode);
        found = false;
      }
    }
    contents = result.join("\n");
  }

  return contents;
}

module.exports = function withIosAudioSpeaker(config) {
  config = withAppDelegate(config, (config) => {
    if (config.modResults.language === "swift") {
      config.modResults.contents = addAudioConfigToAppDelegate(
        config.modResults.contents
      );
    }
    return config;
  });

  return config;
};
