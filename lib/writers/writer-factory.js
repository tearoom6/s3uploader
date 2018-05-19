'use babel'

import MarkdownWriter from './markdown-writer'
import HtmlWriter from './html-writer'

export default class WriterFactory {
  static buildWriter(textEditor) {
    const filePath = textEditor.getPath()
    if (filePath.endsWith('.htm') || filePath.endsWith('.html')) {
      return new HtmlWriter(textEditor)
    }
    // Default
    return new MarkdownWriter(textEditor)
  }
}
