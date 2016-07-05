'use strict';

const Twitter = require('twit');
const Slack = require('@slack/client');
const RTM_EVENTS = Slack.RTM_EVENTS;

const twitter = new Twitter({
  consumer_key: process.env['TWITTER_CONSUMER_KEY'],
  consumer_secret: process.env['TWITTER_CONSUMER_SECRET'],
  access_token: process.env['TWITTER_ACCESS_TOKEN'],
  access_token_secret: process.env['TWITTER_ACCESS_SECRET']
});

module.exports = function (rx) {
  rx.filters([
    (d) => d.type === RTM_EVENTS.REACTION_ADDED,
    (d) => d.item.type === 'message',
    (d) => d.reaction === 'tweet',
    (d) => d.user === d.item_user,
    (d) => rx._web.users.info(d.user).then((info) => info.user.name === '3846masa')
  ]).maps([
    (d) => rx._web.channels.history(d.item.channel, {
      latest: d.item.ts,
      oldest: d.item.ts,
      inclusive: 1,
      count: 1
    }),
    (res) => res.messages[0]
  ]).subscribe((msg, { web, raw }) => {
    twitter.post('statuses/update', { status: msg.text })
      .then(() => {
        web.reactions.remove('tweet', {
          channel: raw.item.channel,
          timestamp: raw.item.ts
        });
      })
      .catch(() => {
        web.reactions.add('x', {
          channel: raw.item.channel,
          timestamp: raw.item.ts
        });
      });
  });
};
