'use babel'

/** @jsx etch.dom */

import etch from 'etch'

export default class ViewBase {
  constructor(props) {
    this.props = props || {}
    etch.initialize(this)
  }

  update(newProps) {
    Object.entries(newProps).forEach(([key, newValue]) => {
      this.props[key] = newValue
    })
    return etch.update(this)
  }

  async destroy() {
    await etch.destroy(this)
  }

  getElement() {
    return this.element
  }
}
