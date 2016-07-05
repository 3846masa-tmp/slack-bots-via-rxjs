'use strict';

const Slack = require('@slack/client');
const RtmClient = Slack.RtmClient;
const WebClient = Slack.WebClient;
const RTM_EVENTS = Slack.RTM_EVENTS;

const Rx = require('rxjs/Rx');
const Observable = Rx.Observable;

const isPromise = require('is-promise');

class SlackBotter {
  constructor ({ _token, _rtm, _web, _rx } = {}) {
    this._token = _token;
    this._rtm = _rtm || new RtmClient(this._token);
    this._web = _web || new WebClient(this._token);
    if (!_rx) {
      const rxs =
        Object.keys(RTM_EVENTS)
        .map((k) => Observable.fromEvent(this._rtm, RTM_EVENTS[k]));
      _rx = Observable.merge(...rxs).map((data) => ({ data, raw: data }));
    }
    this._rx = _rx;
  }

  static create (token) {
    const instance = new SlackBotter({ _token: token });
    return instance;
  }

  add (bots) {
    bots = new Array().concat(...bots);
    for (let bot of bots) {
      bot(this);
    }
  }

  filters (filters) {
    let rx = this._rx;

    for (let filter of filters || []) {
      rx = rx.flatMap(({ data, raw } = {}) => {
        const result = filter(data);
        if (isPromise(result)) {
          return result.then((bool) => ({ data, raw, result: bool }));
        } else {
          return Promise.resolve({ data, raw, result });
        }
      }).filter(({ result }) => result);
    }

    return new SlackBotter(Object.assign({}, this, { _rx: rx }));
  }

  maps (maps) {
    let rx = this._rx;

    for (let map of maps || []) {
      rx = rx.flatMap(({ data, raw } = {}) => {
        let result;
        try {
          result = map(data);
        } catch (_e) {
          console.error(_e.stack || _e);
          return Promise.resolve({ data: null, raw });
        }
        if (isPromise(result)) {
          result = result.catch((_e) => {
            console.error(_e.stack || _e);
            return Promise.resolve({ data: null, raw });
          });
          return result.then((res) => ({ data: res, raw }));
        } else if (Array.isArray(result)) {
          return result.map((res) => ({ data: res, raw }));
        } else {
          return Promise.resolve({ data: result, raw });
        }
      });
    }

    return new SlackBotter(Object.assign({}, this, { _rx: rx }));
  }

  subscribe (subscribeFunc) {
    const rx = this._rx.filter(({ data }) => data !== null && data !== undefined);
    rx.subscribe(({ data, raw } = {}) => {
      subscribeFunc(data, {
        rtm: this._rtm, web: this._web, raw
      });
    });
    return true;
  }

  start () {
    this._rtm.start();
  }
}

module.exports = SlackBotter;
