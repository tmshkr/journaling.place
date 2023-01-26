const { execSync } = require("child_process");
const TAG = process.argv[2];

const { imageDetails } = JSON.parse(
  execSync("aws ecr describe-images --repository-name=journaling.place")
);
const image = imageDetails[0].imageTags.find((imageTag) => imageTag === TAG);

execSync(`echo IMAGE_EXISTS=${!!image} >> $GITHUB_OUTPUT`);
