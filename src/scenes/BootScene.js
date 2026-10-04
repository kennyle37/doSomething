import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.add.text(256, 256, 'Idle Village\n\nrepo is live.', {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      fontFamily: 'monospace'
    }).setOrigin(0.5);
  }
}
