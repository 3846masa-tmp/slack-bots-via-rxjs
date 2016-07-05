'use strict';

const SlackBotter = require('./slack-botter');
const loadBots = require('./load-bots');

const TOKEN = process.env['SLACK_API_KEY'];

const bot = SlackBotter.create(TOKEN);

bot.add(loadBots());
bot.start();
