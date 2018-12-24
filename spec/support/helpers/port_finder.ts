// Borrowed from driver_provider/local from protractor.
import * as net from 'net';

/**
 * Find the port number that is available for the port range provided.
 * Assumes that the portRangeStart < portRangeEnd and that the portRangeEnd
 * should also be checked.
 * @param portRangeStart
 * @param portRangeEnd
 */
export async function findPort(
    portRangeStart: number, portRangeEnd: number): Promise<number> {
  // When no start is provided but an end range is provided, create
  // an arbitrary start point.
  if (!portRangeStart && portRangeEnd) {
    portRangeStart = portRangeEnd - 1000;
  }
  // When no end is provided but a start range is provided, create
  // an arbitrary end point.
  if (portRangeStart && !portRangeEnd) {
    portRangeEnd = portRangeStart + 1000;
  }
  // If no start and end are provided, create a range from 4000 to 5000.
  if (!portRangeStart && !portRangeEnd) {
    portRangeStart = 4000;
    portRangeEnd = 5000;
  }

  let portFound = null;
  for (let port = portRangeStart; port <= portRangeEnd; port++) {
    let server: net.Server;
    const result = await new Promise<boolean>(resolve => {
      // Start a server to check if we can listen to a port.
      server = net.createServer()
                   .listen(port)
                   .on('error',
                       () => {
                         // EADDRINUSE or EACCES, move on.
                         resolve(false);
                       })
                   .on('listening', () => {
                     resolve(true);
                   });
    });
    if (result) {
      // If the server is listening, close the server.
      server.close();
      portFound = port;
      break;
    }
  }
  return portFound;
}