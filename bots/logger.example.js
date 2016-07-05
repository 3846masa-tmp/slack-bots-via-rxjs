'use strict';

module.exports = function (rx) {
  rx.subscribe((data) => {
    console.log(data);
  });
};
