import * as http from 'http';
import * as httpProxy from 'http-proxy';
import * as loglevel from 'loglevel';
import * as env from './env';

const log = loglevel.getLogger('webdriver-manager-test');

const proxy = http.createServer((request, response) => {
  let hostHeader = request.headers['host'];
  log.debug(
      'request made to proxy: ' + request.url + ', ' +
      'target: ' + hostHeader);
  if (hostHeader.startsWith('http://') || hostHeader.startsWith('127.0.0.1')) {
    if (!hostHeader.startsWith('http://')) {
      hostHeader = 'http://' + hostHeader;
    }
    httpProxy.createProxyServer({target: hostHeader}).web(request, response);

  } else {
    if (!hostHeader.startsWith('https://')) {
      hostHeader = 'https://' + hostHeader;
    }
    httpProxy.createProxyServer({target: hostHeader}).web(request, response);
  }
});

proxy.listen(env.proxyPort);