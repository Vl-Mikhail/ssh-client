/**
 *  Проброс удаленного порта на локальный компьютер;
 */
const net = require('net');

// sudo netstat -an | grep 2222
exports.localTcpForwarding = function (sshConn, srcHost, srcPort, dstHost, dstPort) {
  const server = net.createServer((sock) => {
    sshConn.forwardOut(srcHost, srcPort, dstHost, dstPort, (err, stream) => {
      if (err) {
        console.error(err);
        sock.end();
        return;
      }

      sock.pipe(stream);
      stream.pipe(sock);

      stream.on('end', () => console.log('close'));
      sock.on('close', () => {
        stream.end();
      });
    });
  });

  server.listen(srcPort, srcHost);
};
