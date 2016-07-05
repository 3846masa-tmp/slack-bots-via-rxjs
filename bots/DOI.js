'use strict';

const request = require('request-promise');
const moment = require('moment');
const Slack = require('@slack/client');
const RTM_EVENTS = Slack.RTM_EVENTS;

// http://www.regexpal.com/93795
const DOI_REGEXP = /\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/;

module.exports = function (rx) {
  rx.filters([
    (d) => d.type === RTM_EVENTS.MESSAGE,
    (d) => !d.subtype,
    (d) => d.text.match(/<(.*?)>/g)
  ]).maps([
    (d) => d.text.match(/<.*?>/g)[0],
    (md) => md.match(/<(.*?)>/)[1],
    (url) => request.get(url)
  ]).filters([
    (html) => html.match(DOI_REGEXP)
  ]).maps([
    (html) => html.match(DOI_REGEXP)[0],
    (doi) => request.get(`http://api.crossref.org/works/${doi}`),
    (json) => JSON.parse(json).message
  ]).subscribe((info, { web, raw }) => {
    const fields = [{
      title: 'Proceeding',
      value: info['container-title'].join(''),
      short: false
    }, {
      title: 'Authors',
      value: info.author.map((d) => `${d.given} ${d.family}`).join(', '),
      short: false
    }, {
      title: 'DOI',
      value: info.DOI,
      short: true
    }, {
      title: 'Date',
      value: moment(info.created.timestamp).locale('ja').format('L'),
      short: true
    }];

    const attachments = [{
      title: `${info.title.join('')}: ${info.subtitle.join('')}`,
      title_link: info.URL,
      fields
    }];

    const config = {
      username: 'DOI bot',
      icon_emoji: ':closed_book:',
      attachments
    };

    web.chat.postMessage(raw.channel, '', config);
  });
};
