// Token: !^fire
// Match type: inverse-prefix-exact-match
// Description: Items that do not start with `fire`

import BaseMatch from './BaseMatch'

export default class InversePrefixExactMatch extends BaseMatch {
  // eslint-disable-next-line no-useless-constructor
  constructor(pattern) {
    super(pattern)
  }
  static get type() {
    return 'inverse-prefix-exact'
  }
  static get multiRegex() {
    return /^!\^"(.*)"$/
  }
  static get singleRegex() {
    return /^!\^(.*)$/
  }
  search(text) {
    const isMatch = !text.startsWith(this.pattern)

    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [0, text.length - 1]
    }
  }
}
