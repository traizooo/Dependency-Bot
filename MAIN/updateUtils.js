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
    console.log("-------------------------------------------------------")
    dependenciesToUpdate.forEach((dependency, index) => {
      console.log(`${index + 1}. ${dependency.packageName}: Installed (${dependency.installedVersion}), Latest (${dependency.latestVersion})`);
      console.log("-------------------------------------------------------")
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Update all dependencies? (y/n) ', (updateAllResponse) => {
      rl.close();

      if (updateAllResponse.toLowerCase() === 'y') {
        console.log('Updating all dependencies...');
        
        const updateCommands = dependenciesToUpdate.map((dependency) => {
          const packageName = dependency.packageName;
          const latestVersion = dependency.latestVersion;
          
          return `npm install ${packageName}@${latestVersion}`;
        });
        
        if (updateCommands.length > 0) {
          const command = updateCommands.join(' && ');
          
          exec(command, (error) => {
            if (error) {
              console.error(`Error updating all dependencies: ${error}`);
            } else {
              console.log('All updates completed.');
              printLogo();
            }
          });
        } else {
          console.log('No dependencies require an update.');
          printLogo();
        }
      } else {
        const updateDependency = async (dependencyToUpdate) => {
          const packageName = dependencyToUpdate.packageName;
          const installedVersion = dependencyToUpdate.installedVersion;
          const latestVersion = dependencyToUpdate.latestVersion;

          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          rl.question(`Update ${packageName} from ${installedVersion} to ${latestVersion}? (y/n) `, (answer) => {
            rl.close();

            if (answer.toLowerCase() === 'y') {
              console.log(`Updating ${packageName}...`);
              exec(`npm install ${packageName}@${latestVersion}`, (error) => {
                if (error) {
                  console.error(`Error updating ${packageName}: ${error}`);
                  console.log("-------------------------------------------------------")
                } else {
                  console.log(`${packageName} updated to version ${latestVersion}.`);
                  console.log("-------------------------------------------------------")
                  updateNextDependency();
                }
              });
            } else if (answer.toLowerCase() === 'n') {
              console.log(`Skipping update for ${packageName}...`);
              console.log("-------------------------------------------------------")
              updateNextDependency();
            }
          });
        };

        let currentIndex = 0;

        const updateNextDependency = () => {
          if (currentIndex < dependenciesToUpdate.length) {
            const dependencyToUpdate = dependenciesToUpdate[currentIndex];
            currentIndex++;
            updateDependency(dependencyToUpdate);
          } else {
            console.log('All updates completed.');
            printLogo();
          }
        };

        updateNextDependency();
      }
    });
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

function startUpdateCheck(interval, dependencies, packageJsonPath, email, receiveReports) {
  checkForUpdates(dependencies, packageJsonPath, false, email, receiveReports);
  setInterval(() => {
    checkForUpdates(dependencies, packageJsonPath, false, email, receiveReports);
  }, interval);
}

module.exports = {
  checkForUpdates,
  startUpdateCheck,
};