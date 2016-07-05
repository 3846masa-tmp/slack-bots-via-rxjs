'use strict';

const Slack = require('@slack/client');
const RTM_EVENTS = Slack.RTM_EVENTS;

module.exports = function (rx) {
  rx.filters([
    (d) => d.type === RTM_EVENTS.MESSAGE,
    (d) => !d.subtype,
    (d) => d.text.match(/Hello/i)
  ]).maps([
    (d) => d.channel
  ]).subscribe((channel, { web }) => {
    web.chat.postMessage(channel, 'Hello!');
  });
};
