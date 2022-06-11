import { isArray, isDefined, isString, isBlank } from "../helpers/types";
import Config from "../core/config";
import normGenerator from "./norm";
import { createKey } from "./KeyStore";

export default class FuseIndex {
  constructor({
    getFn = Config.getFn,
    fieldNormWeight = Config.fieldNormWeight,
  } = {}) {
    this.norm = normGenerator(fieldNormWeight, 3); // { get(value): any, clear(): void }
    this.getFn = getFn;
    this.isCreated = false;

    this.setIndexRecords();
  }
  setSources(docs = []) {
    this.docs = docs;
  }
  setIndexRecords(records = []) {
    this.records = records;
  }
  setKeys(keys = []) {
    this.keys = keys;
    this._keysMap = {};
    keys.forEach((key, idx) => {
      this._keysMap[key.id] = idx;
    });
  }
  /** 検索対象の値をdocsから抽出してインスタンス変数に格納する？ */
  create() {
    if (this.isCreated || !this.docs.length) {
      return;
    }

    this.isCreated = true;

    // List is Array<String>
    if (isString(this.docs[0])) {
      this.docs.forEach((doc, docIndex) => {
        this._addString(doc, docIndex);
      });
    } else {
      // List is Array<Object>
      this.docs.forEach((doc, docIndex) => {
        this._addObject(doc, docIndex);
      });
    }

    this.norm.clear();
  }
  // Adds a doc to the end of the index
  add(doc) {
    const idx = this.size();

    if (isString(doc)) {
      this._addString(doc, idx);
    } else {
      this._addObject(doc, idx);
    }
  }
  // Removes the doc at the specified index of the index
  removeAt(idx) {
    this.records.splice(idx, 1);

    // Change ref index of every subsquent doc
    for (let i = idx, len = this.size(); i < len; i += 1) {
      this.records[i].i -= 1;
    }
  }
  getValueForItemAtKeyId(item, keyId) {
    return item[this._keysMap[keyId]];
  }
  size() {
    return this.records.length;
  }
  _addString(doc, docIndex) {
    if (!isDefined(doc) || isBlank(doc)) {
      return;
    }

    let record = {
      v: doc,
      i: docIndex,
      n: this.norm.get(doc),
    };

    this.records.push(record);
  }
  /** 渡された構造体から、検索対象の値のみ抽出してthis.recordsに追加している？ */
  _addObject(doc, docIndex) {
    let record = { i: docIndex, $: {} };

    // すべてのキー（つまりパス）に対して反復処理を行い、そのキーにある値を取得する
    this.keys.forEach((key, keyIndex) => {
      // keys: { path, id, weight, src, getFn }[]
      // isString(key) || isArray(key) がtrueならkey.getFnはnull
      let value = key.getFn ? key.getFn(doc) : this.getFn(doc, key.path); // docに対してkey.pathでヒットした値を返す

      if (!isDefined(value)) {
        return;
      }

      if (isArray(value)) {
        let subRecords = [];
        const stack = [{ nestedArrIndex: -1, value }];

        while (stack.length) {
          const { nestedArrIndex, value } = stack.pop();

          if (!isDefined(value)) {
            continue;
          }

          if (isString(value) && !isBlank(value)) {
            let subRecord = {
              v: value,
              i: nestedArrIndex,
              n: this.norm.get(value),
            };

            subRecords.push(subRecord);
          } else if (isArray(value)) {
            value.forEach((item, k) => {
              stack.push({
                nestedArrIndex: k,
                value: item,
              });
            });
          } else {
            // If we're here, the `path` is either incorrect, or pointing to a non-string.
            // console.error(new Error(`Path "${key}" points to a non-string value. Received: ${value}`))
          }
        }
        record.$[keyIndex] = subRecords;
      } else if (isString(value) && !isBlank(value)) {
        let subRecord = {
          v: value,
          n: this.norm.get(value),
        };

        record.$[keyIndex] = subRecord;
      }
    });

    this.records.push(record);
  }
  toJSON() {
    return {
      keys: this.keys,
      records: this.records,
    };
  }
}

export function createIndex(
  keys,
  docs,
  { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}
) {
  const myIndex = new FuseIndex({ getFn, fieldNormWeight });
  myIndex.setKeys(keys.map(createKey)); // keys.map(createKey) => { path, id, weight, src, getFn }[]
  myIndex.setSources(docs);
  myIndex.create();
  return myIndex;
}

export function parseIndex(
  data,
  { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}
) {
  const { keys, records } = data;
  const myIndex = new FuseIndex({ getFn, fieldNormWeight });
  myIndex.setKeys(keys);
  myIndex.setIndexRecords(records);
  return myIndex;
}
