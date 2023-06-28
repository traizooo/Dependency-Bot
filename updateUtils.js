const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const { exec } = require('child_process');

async function checkForUpdates(dependencies, packageJsonPath, updateAll) {
  console.log('Checking for updates...');

  const dependenciesToUpdate = [];

  for (const dependency of dependencies) {
    const packageName = dependency;

    try {
      const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
      const latestVersion = response.data['dist-tags'].latest;

      const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonData);
      const installedVersion = packageJson.dependencies[packageName] || packageJson.devDependencies[packageName];

      if (installedVersion && installedVersion !== latestVersion) {
        dependenciesToUpdate.push({
          packageName,
          installedVersion,
          latestVersion,
        });
      }
    } catch (error) {
      console.error(`Error fetching data for ${packageName}: ${error}`);
    }
  }

  if (dependenciesToUpdate.length > 0) {
    console.log('Dependencies that require an update:');
    dependenciesToUpdate.forEach((dependency, index) => {
      console.log(`${index + 1}. ${dependency.packageName}: Installed (${dependency.installedVersion}), Latest (${dependency.latestVersion})`);
    });

    if (!updateAll) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const updateDependency = async (dependencyToUpdate) => {
        const packageName = dependencyToUpdate.packageName;
        const installedVersion = dependencyToUpdate.installedVersion;
        const latestVersion = dependencyToUpdate.latestVersion;

        const answer = await new Promise((resolve) => {
          rl.question(`Update ${packageName} from ${installedVersion} to ${latestVersion}? (y/n) `, (response) => {
            resolve(response.toLowerCase());
          });
        });

        if (answer === 'y') {
          console.log(`Updating ${packageName}...`);
          exec(`npm install ${packageName}@${latestVersion}`, (error) => {
            if (error) {
              console.error(`Error updating ${packageName}: ${error}`);
            } else {
              console.log(`${packageName} updated to version ${latestVersion}.`);
              updateNextDependency();
            }
          });
        } else if (answer === 'n') {
          console.log(`Skipping update for ${packageName}...`);
          updateNextDependency();
        }
      };

      let currentIndex = 0;

      const updateNextDependency = () => {
        if (currentIndex < dependenciesToUpdate.length) {
          const dependencyToUpdate = dependenciesToUpdate[currentIndex];
          currentIndex++;
          updateDependency(dependencyToUpdate);
        } else {
          rl.close();
          console.log('All updates completed.');
          printLogo();
        }
      };

      updateNextDependency();
    } else {
      console.log('Updating all dependencies...');
      const updatePromises = dependenciesToUpdate.map((dependencyToUpdate) => {
        const packageName = dependencyToUpdate.packageName;
        const latestVersion = dependencyToUpdate.latestVersion;

        console.log(`Updating ${packageName}...`);
        return new Promise((resolve) => {
          exec(`npm install ${packageName}@${latestVersion}`, (error) => {
            if (error) {
              console.error(`Error updating ${packageName}: ${error}`);
            } else {
              console.log(`${packageName} updated to version ${latestVersion}.`);
            }
            resolve();
          });
        });
      });

      Promise.all(updatePromises).then(() => {
        console.log('All updates completed.');
        printLogo();
      });
    }
  } else {
    console.log('No dependencies require an update.');
    printLogo();
  }
}

function printLogo() {
  console.log(`
  ██████╗  ██████╗ ███╗   ██╗███████╗
  ██╔══██╗██╔═══██╗████╗  ██║██╔════╝
  ██║  ██║██║   ██║██╔██╗ ██║█████╗  
  ██║  ██║██║   ██║██║╚██╗██║██╔══╝  
  ██████╔╝╚██████╔╝██║ ╚████║███████╗
  ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚══════╝
  `);
  process.exit();
}

function startUpdateCheck(interval, dependencies, packageJsonPath, updateAll) {
  checkForUpdates(dependencies, packageJsonPath, updateAll);
  setInterval(() => {
    checkForUpdates(dependencies, packageJsonPath, updateAll);
  }, interval);
}

module.exports = {
  checkForUpdates,
  startUpdateCheck,
};
