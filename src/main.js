import Phaser from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import VillageScene from './scenes/VillageScene.js';

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
  scene: [VillageScene],
  plugins: {
    scene: [{ key: 'rexUI', plugin: RexUIPlugin, mapping: 'rexUI' }],
  },
};

// eslint-disable-next-line no-new
new Phaser.Game(config);