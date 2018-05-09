'use babel';

import S3uploaderView from './s3uploader-view';
import { CompositeDisposable } from 'atom';

export default {

  s3uploaderView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.s3uploaderView = new S3uploaderView(state.s3uploaderViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.s3uploaderView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      's3uploader:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.s3uploaderView.destroy();
  },

  serialize() {
    return {
      s3uploaderViewState: this.s3uploaderView.serialize()
    };
  },

  toggle() {
    console.log('S3uploader was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
