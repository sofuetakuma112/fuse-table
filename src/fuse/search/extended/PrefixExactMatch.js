// Token: ^file
// Match type: prefix-exact-match
// Description: Items that start with `file`
import BaseMatch from './BaseMatch'

export default class PrefixExactMatch extends BaseMatch {
  // eslint-disable-next-line no-useless-constructor
  constructor(pattern) {
    super(pattern)
  }
  static get type() {
    return 'prefix-exact'
  }
  static get multiRegex() {
    return /^\^"(.*)"$/
  }
  static get singleRegex() {
    return /^\^(.*)$/
  }
  search(text) {
    const isMatch = text.startsWith(this.pattern)

    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [0, this.pattern.length - 1]
    }
  }
}
