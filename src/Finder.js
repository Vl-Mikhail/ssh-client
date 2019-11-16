const {Transform} = require('stream');
const {StringDecoder} = require('string_decoder');

const decoder = new StringDecoder('utf8');

const ANSI = {
  startChar: 0x9F,
  lastChar: 0x9C
};

/**
 * Распосзнаем комманды с сервера
 */
exports.Finder = class extends Transform {
  constructor() {
    super();
    this.dataBuffer = new Uint8Array(512);
    this.dataBufferPosition = 0;
    this.isWrite = false;
  }

  _transform(chunk, encoding, done) {
    chunk.forEach((p) => {
      if (p === ANSI.lastChar) {
        const data = this.dataBuffer.slice(0, this.dataBufferPosition);
        const stringData = decoder.write(Buffer.from(data));
        const [, command, ...args] = stringData.split(" ; ");

        this.emit('comm', {command, args});
        this.resetBuffer();
      } else {
        this.appendToDataBuffer(p);
      }
    });

    done(null, chunk);
  }

  resetBuffer() {
    this.dataBufferPosition = 0;
    this.isWrite = false;
  }

  appendToDataBuffer(data) {
    if (!this.isWrite && data !== ANSI.startChar) {
      return;
    }

    this.isWrite = true;
    this.dataBuffer[this.dataBufferPosition] = data;
    this.dataBufferPosition += 1;
  }
};
