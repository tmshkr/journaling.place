module.exports.retry = async function (fn) {
  let tries = 0;
  while (tries < 6) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      const seconds = 2 ** ++tries;
      console.error(error);
      console.log(`Retrying in ${seconds}s...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * seconds));
    }
  }
};
