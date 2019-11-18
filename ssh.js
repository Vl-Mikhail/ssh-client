const {URL} = require('url');
const Client = require('ssh2').Client;
const yargs = require('yargs');

const {Finder} = require('./src/Finder');
const {CommandInterpreter} = require('./src/CommandInterpreter');
const {localTcpForwarding} = require('./src/localTcpForwarding');
const {remoteTcpForwarding} = require('./src/remoteTCPForwarding');

const argv = yargs.parse(process.argv.slice(2));
const url = new URL(`ssh://${argv._}`);
const conn = new Client();

function parseArgv(argv) {
  const args = argv.split(':');
  if (args.length !== 4) {
    throw new Error(`Неверное колличество параметров: ${argv}`);
  }
  return args;
}

// https://github.com/mscdex/ssh2/issues/718
conn.on('ready', () => {
  if (argv.R) {
    const [srcIP, srcPort, destIP, destPort] = parseArgv(argv.R);
    localTcpForwarding(conn, srcIP, srcPort, destIP, destPort, (err) => {
      if (err) {
        console.error('cannot local TCP Forwarding:', err.message);
      }
    });
  }

  if (argv.L) {
    const [srcIP, srcPort, destIP, destPort] = parseArgv(argv.L);
    remoteTcpForwarding(conn, srcIP, srcPort, destIP, destPort, (err) => {
      if (err) {
        console.error('cannot remote TCP Forwarding:', err.message);
      }
    });
  }

  conn.shell({
    term: process.env.TERM,
    rows: process.stdout.rows,
    cols: process.stdout.columns
  }, (err, stream) => {
    if (err) throw err;

    stream.on('close', () => {
      console.log('Stream :: close');
      process.stdin.unref();
      conn.end();
    });

    const finder = new Finder();
    const cmdInterpreter = new CommandInterpreter(conn);

    finder.on('comm', (value) => {
      stream.pause();

      cmdInterpreter.interpr(value, (error) => {
        if (error) {
          console.error(error);
        }

        stream.resume();
      });
    });
    stream.pipe(finder);

    // Подключаем локальны stdin к удаленному stdin
    process.stdin.setRawMode(true);
    process.stdin.pipe(stream);

    // Подключаем удаленный output к локальному stdout
    stream.pipe(process.stdout);

    process.stdout.on('resize', () => {
      // Смена локального размера терминала
      stream.setWindow(process.stdout.rows, process.stdout.columns, 0, 0);
    });

    stream.on('close', () => {
      conn.end();
    });
  });
}).connect({
  host: url.host,
  port: url.port || 22,
  username: url.username,
  password: url.password
});
