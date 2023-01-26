const { execSync } = require("child_process");
try {
  execSync(
    `aws ecr describe-images --repository-name=journaling.place --image-ids imageTag=${process.argv[2]}`
  );
  console.log("Image exists.");
  execSync(`echo IMAGE_EXISTS=true >> $GITHUB_OUTPUT`);
} catch (error) {
  if (error.message.includes("ImageNotFoundException")) {
    console.log("Image does not exist.");
    execSync(`echo IMAGE_EXISTS=false >> $GITHUB_OUTPUT`);
  } else {
    console.error(error);
    process.exit(1);
  }
}
