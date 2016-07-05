'use strict';

const glob = require('glob');
const path = require('path');

module.exports = function loadBots(folder = './bots') {
  const files = glob.sync(path.join(folder, '*.js'));
  return files.filter((p) => !p.match(/\.example\.js/)).map((p) => require(`./${p}`));
};
