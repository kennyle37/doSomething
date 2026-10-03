import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 512,
  height: 512,
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene]
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
