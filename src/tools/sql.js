module.exports = class {
  static async getCssSrc(id = '', max = 50) {
    let cssSrc = '';
    let targetId = id;
    const nodeInfo = await this.getNodeInfoById(id);
    if (!nodeInfo) {
      return '';
    }
    targetId = nodeInfo.pid;
    for (let i = 0; i <= max; i++) {
      const stmt = db.prepare(`SELECT id,pid,className,style,[index] from layers where id ='${targetId}'`.toString());
      const nodeInfo = stmt.get();
      if (!nodeInfo) {
        break;
      }
      if (i > 0 && i % 3 === 0 && false) { // @at-root
        cssSrc = '.' + nodeInfo.className + ' > .at-root ' + cssSrc;
      } else {
        cssSrc = '.' + nodeInfo.className + ' > ' + cssSrc;
      }
      targetId = nodeInfo.pid;
    }
    return cssSrc;
  }

  static getRunTimeInfoByKey(key = '') {
    const stmt = db.prepare(`SELECT *  from runtime where key ='${key}'`.toString());
    const runtimeInfo = stmt.get();
    return runtimeInfo;
  }

  static updateRunTimeInfoByKey(key = '', value = '') {
    const info = this.getRunTimeInfoByKey(key);
    if (info) {
      const stmt = db.prepare('update runtime set value=@value where key=@key');
      stmt.run({
        key,
        value
      });
    } else {
      const insert = db.prepare('INSERT INTO runtime (key,value) VALUES (@key,@value)');
      insert.run({
        key,
        value
      });
    }
  }

  static appendRunTimeInfoByKey(key = '', value = '') {
    const info = this.getRunTimeInfoByKey(key);
    if (info) {
      const stmt = db.prepare('update runtime set value=@value where key=@key');
      stmt.run({
        key,
        value: info.value + value
      });
    } else {
      const insert = db.prepare('INSERT INTO runtime (key,value) VALUES (@key,@value)');
      insert.run({
        key,
        value
      });
    }
  }

  static async getNodeInfoById(id = '') {
    const stmt = db.prepare(`SELECT * from layers where id ='${id}'`.toString());
    const nodeInfo = stmt.get();
    return nodeInfo;
  }
};
