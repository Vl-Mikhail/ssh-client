const fs = require('fs');
const {join, basename} = require('path');

/**
 * Класс по работе с доступными коммандами
 */
exports.CommandInterpreter = class {
  constructor(sshConnection) {
    this.sshConnection = sshConnection;
    this.availableCommands = {
      get: this.getFile,
      put: this.putFile,
    };
  }

  interpr(data, cb) {
    const cmdFunction = this.availableCommands[data.command];
    cmdFunction.call(this, ...data.args, cb);
  }

  /**
   * Получаем файл с сервера
   */
  getFile(remoteFile, fileName, localDir, cb) {
    this.sshConnection.sftp((err, sftp) => {
      if (err) {
        cb(err);
        return;
      }

      const local = join(localDir, fileName);
      sftp.fastGet(remoteFile, local, {}, cb);
      console.log("Успешная загрузка");
    });
  }

  /**
   * Отправляем файл на сервер
   */
  putFile(localFile, remoteDir, cb) {
    const bname = basename(localFile);
    fs.stat(localFile, (statErr, stats) => {
      if (statErr) {
        cb(statErr);
        return;
      }

      if (!stats.isFile) {
        cb(new Error(`Не стандартный файл: ${localFile}`));
        return;
      }

      this.sshConnection.sftp((err, sftp) => {
        if (err) {
          cb(err);
          return;
        }

        const remoteDest = join(remoteDir.trim() || './', bname);
        sftp.fastPut(localFile, remoteDest, cb);
        console.log("Успешная загрузка");
      });
    });
  }
};
