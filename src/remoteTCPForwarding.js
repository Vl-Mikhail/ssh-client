/**
 * Проброс удаленного порта на локальный компьютер;
 */
const net = require('net');

exports.remoteTcpForwarding = function (sshConn, srcHost, srcPort, dstHost, dstPort, cb) {
  sshConn.forwardIn(srcHost, srcPort, (err) => {
    cb(err);
  });

  sshConn.on('tcp connection', (info, accept, reject) => {
    const client = net.createConnection({host: dstHost, port: dstPort}, () => {
      const conn = accept();
      conn.on('close', () => {
        client.end();
      }).on('data', (data) => {
        client.write(data);
      });

      client.on('close', () => {
        conn.end();
      }).on('data', (data) => {
        conn.write(data);
      });
    });

    client.on('error', (err) => {
      console.error(err);
      reject();
    });
  });
};
