import {
  isDefined,
  isString,
  isNumber,
  isBoolean,
  isArray,
  toString
} from './types'

export default function get(obj, path) {
  let list = []
  let arr = false

  const deepGet = (obj, path, index) => {
    if (!isDefined(obj)) { // undefinedかnullなら早期リターン
      return
    }
    if (!path[index]) { // [][0] => undefined
      // パスが残っていなければ、気になるオブジェクトに到着したことになる。
      list.push(obj)
    } else {
      let key = path[index]

      const value = obj[key]

      if (!isDefined(value)) {
        return
      }

      // パスの最後の値で、それが文字列/数値/ブール値なら、
      // それをリストに追加します。
      if (
        index === path.length - 1 &&
        (isString(value) || isNumber(value) || isBoolean(value))
      ) {
        list.push(toString(value))
      } else if (isArray(value)) {
        arr = true
        // 配列の各項目を検索します。
        for (let i = 0, len = value.length; i < len; i += 1) {
          deepGet(value[i], path, index + 1)
        }
      } else if (path.length) {
        // オブジェクト。さらに再帰する。
        deepGet(value, path, index + 1)
      }
    }
  }

  // 後方互換性 (以前はパスが文字列だったため)
  deepGet(obj, isString(path) ? path.split('.') : path, 0)

  return arr ? list : list[0]
}
