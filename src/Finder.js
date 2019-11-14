const {Transform} = require('stream');
const {StringDecoder} = require('string_decoder');

const decoder = new StringDecoder('utf8');

/**
 * Распосзнаем комманды с сервера
 */
exports.Finder = class extends Transform {
  constructor() {
    super();
    this.apcDataBuffer = new Uint8Array(1024);
    this.apcDataBufferPosition = 0;
  }

  _transform(chunk, encoding, callback) {
    chunk.forEach((p) => {
      if (p === 0x9C) { // Последний printf
        const data = this.apcDataBuffer.slice(0, this.apcDataBufferPosition);
        const stringData = decoder.write(Buffer.from(data));
        const [, command, ...args] = stringData.split(" ; ");

        this.emit('comm', {command, args});
        this.apcDataBufferPosition = 0;
      } else {
        this.appendToDataBuffer(p);
      }
    });

    callback(null, chunk);
  }

  // Продумать алгоритм получения данных
  appendToDataBuffer(data) {
    this.apcDataBuffer[this.apcDataBufferPosition] = data;
    this.apcDataBufferPosition += 1;
  }
};
