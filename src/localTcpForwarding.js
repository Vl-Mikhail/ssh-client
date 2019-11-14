/**
 *  Проброс локального порта на удаленный сервер;
 */
const net = require('net');

// sudo netstat -an | grep 2222
// https://github.com/mscdex/ssh2/issues/675
exports.localTcpForwarding = function (sshConn, srcHost, srcPort, dstHost, dstPort) {
  const server = net.createServer((sock) => {
    sshConn.forwardOut(srcHost, srcPort, dstHost, dstPort, (err, stream) => {
      if (err) {
        console.error(err);
        sock.end();
        return;
      }

      server.pipe(stream);
      stream.pipe(server);

      stream.on('end', () => console.log('close'));
      sock.on('close', () => {
        stream.end();
      });
    });
  });

  server.listen(srcPort, srcHost);
};
