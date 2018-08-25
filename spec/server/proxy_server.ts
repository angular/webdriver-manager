import * as http from 'http';
import * as httpProxy from 'http-proxy';

import * as env from './env';

const proxy = http.createServer((request, response) => {
  let hostHeader = request.headers['host'];
  console.log(
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