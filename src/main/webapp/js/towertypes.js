"use strict";

var towerTypes = [];

towerTypes[0] = {
  name: "Alien Wand",
  desc: "Hilft Labyrinthe zu bauen",
  level: 0,
  isBlocking: true,
  price: 10,
  sellPrice: 5,
  tex: null
};

towerTypes[1] = {
  name: "Laser Tower",
  desc: "Schießt Laserstrahlen",
  level: 0,
  isBlocking: true,
  radius: 2,
  freq: 8,
  power: 10,
  price: 20,
  sellPrice: 5,
  tex: null,
  shotTex: null,
  extend: {
    init: function () {
      this.focus = null;
      this.dist = 0;
      this.reload = this.getFreq();
      this.aimFunc = aimFuncs.first;

      this.shotSpr = new PIXI.Sprite(this.type.shotTex);
      this.shotSpr.anchor.set(0, 0.5);
      this.shotSpr.x = this.x + game.cellCenter;
      this.shotSpr.y = this.y + game.cellCenter;
      this.game.shotCon.addChild(this.shotSpr);
    },
    destroy: function () {
      Tower.prototype.destroy.call(this);
      this.game.shotCon.removeChild(this.shotSpr);
      this.shotSpr.destroy();
    },
    update: function () {
      var y = this.shotSpr.scale.y;
      y -= 0.1;
      if (y < 0) {
        y = 0;
        this.spr.texture = this.type.tex;
      }
      this.shotSpr.scale.y = y;
    },
    beforeCollide: function () {
      this.reload--;
      this.focus = null;
      this.dist = 0;
    },
    collide: function (mob, dist) {
      if (this.reload > 0) return;

      if (this.isInRadius(dist) && this.aimFunc(mob, dist)) {
        this.focus = mob;
        this.dist = dist;
      }
    },
    afterCollide: function () {
      if (this.reload <= 0) {
        this.reload = this.getFreq();
      }
      if (this.focus !== null) {
        this.focus.hit(this.getPower(), this);
        this.spr.texture = this.type.tex2;
        this.spr.rotation = this.shotSpr.rotation = this.angleToMob(this.focus);
        this.shotSpr.scale.x = this.dist;
        this.shotSpr.scale.y = 1;
      }
    }
  }

};

towerTypes[2] = {
  name: "Starker Laser Tower",
  desc: "Schießt extra starke Laserstrahlen",
  level: 1,
  isBlocking: true,
  radius: 3,
  freq: 5,
  power: 70,
  price: 250,
  sellPrice: 100,
  tex: null,
  shotTex: null,
  extend: {
    init: function () {
      this.focus = null;
      this.dist = 0;
      this.reload = this.getFreq();
      this.aimFunc = aimFuncs.first;

      this.shotSpr = new PIXI.Sprite(this.type.shotTex);
      this.shotSpr.anchor.set(0, 0.5);
      this.shotSpr.x = this.x + game.cellCenter;
      this.shotSpr.y = this.y + game.cellCenter;
      this.game.shotCon.addChild(this.shotSpr);
    },
    destroy: function () {
      Tower.prototype.destroy.call(this);
      this.game.shotCon.removeChild(this.shotSpr);
      this.shotSpr.destroy();
    },
    update: function () {
      var y = this.shotSpr.scale.y;
      y -= 0.1;
      if (y < 0) {
        y = 0;
        this.spr.texture = this.type.tex;
      }
      this.shotSpr.scale.y = y;
    },
    beforeCollide: function () {
      this.reload--;
      this.focus = null;
      this.dist = 0;
    },
    collide: function (mob, dist) {
      if (this.reload > 0) return;

      if (this.isInRadius(dist) && this.aimFunc(mob, dist)) {
        this.focus = mob;
        this.dist = dist;
      }
    },
    afterCollide: function () {
      if (this.reload <= 0) {
        this.reload = this.getFreq();
      }
      if (this.focus !== null) {
        this.focus.hit(this.getPower(), this);
        this.spr.texture = this.type.tex2;
        this.spr.rotation = this.shotSpr.rotation = this.angleToMob(this.focus);
        this.shotSpr.scale.x = this.dist;
        this.shotSpr.scale.y = 1;
      }
    }
  }

};

towerTypes[3] = {
  name: "Sharpshooter",
  desc: "Laserkanone für weite Entfernungen",
  level: 0,
  isBlocking: true,
  radius: 7,
  freq: 30,
  power: 50,
  price: 150,
  sellPrice: 50,
  tex: null,
  shotTex: null,
  extend: {
    init: function () {
      this.focus = null;
      this.dist = 0;
      this.reload = this.getFreq();
      this.aimFunc = aimFuncs.first;

      this.shotSpr = new PIXI.Sprite(this.type.shotTex);
      this.shotSpr.anchor.set(0, 0.5);
      this.shotSpr.x = this.x + game.cellCenter;
      this.shotSpr.y = this.y + game.cellCenter;
      this.game.shotCon.addChild(this.shotSpr);
    },
    destroy: function () {
      Tower.prototype.destroy.call(this);
      this.game.shotCon.removeChild(this.shotSpr);
      this.shotSpr.destroy();
    },
    update: function () {
      var y = this.shotSpr.scale.y;
      y -= 0.03;
      if (y < 0) y = 0;
      this.shotSpr.scale.y = y;
    },
    beforeCollide: function () {
      this.reload--;
      this.focus = null;
      this.dist = 0;
    },
    collide: function (mob, dist) {
      if (this.reload > 0) return;

      if (this.isInRadius(dist) && this.aimFunc(mob, dist)) {
        this.focus = mob;
        this.dist = dist;
      }
    },
    afterCollide: function () {
      if (this.reload <= 0) {
        this.reload = this.getFreq();
      }
      if (this.focus !== null) {
        this.focus.hit(this.getPower(), this);
        this.spr.rotation = this.shotSpr.rotation = this.angleToMob(this.focus);
        this.shotSpr.scale.x = this.dist;
        this.shotSpr.scale.y = 1;
      }
    }
  }
};

towerTypes[4] = {
  name: "Special Sharpshooter",
  desc: "Schießt noch weiter",
  level: 1,
  isBlocking: true,
  radius: 10,
  freq: 25,
  power: 100,
  price: 1500,
  sellPrice: 400,
  tex: null,
  shotTex: null,
  extend: {
    init: function () {
      this.focus = null;
      this.dist = 0;
      this.reload = this.getFreq();
      this.aimFunc = aimFuncs.first;

      this.shotSpr = new PIXI.Sprite(this.type.shotTex);
      this.shotSpr.anchor.set(0, 0.5);
      this.shotSpr.x = this.x + game.cellCenter;
      this.shotSpr.y = this.y + game.cellCenter;
      this.game.shotCon.addChild(this.shotSpr);
    },
    destroy: function () {
      Tower.prototype.destroy.call(this);
      this.game.shotCon.removeChild(this.shotSpr);
      this.shotSpr.destroy();
    },
    update: function () {
      var y = this.shotSpr.scale.y;
      y -= 0.03;
      if (y < 0) y = 0;
      this.shotSpr.scale.y = y;
    },
    beforeCollide: function () {
      this.reload--;
      this.focus = null;
      this.dist = 0;
    },
    collide: function (mob, dist) {
      if (this.reload > 0) return;

      if (this.isInRadius(dist) && this.aimFunc(mob, dist)) {
        this.focus = mob;
        this.dist = dist;
      }
    },
    afterCollide: function () {
      if (this.reload <= 0) {
        this.reload = this.getFreq();
      }
      if (this.focus !== null) {
        this.focus.hit(this.getPower(), this);
        this.spr.rotation = this.shotSpr.rotation = this.angleToMob(this.focus);
        this.shotSpr.scale.x = this.dist;
        this.shotSpr.scale.y = 1;
      }
    }
  }
};

towerTypes[5] = {
  name: "Slime",
  desc: "Kann auf den Pfad gelegt werden. Schaden bei Berührung",
  level: 0,
  isBlocking: false,
  radius: 0.4,
  power: 6,
  price: 400,
  sellPrice: 100,
  tex: null,
  extend: {
    collide: function (mob, dist) {
      mob.hit(this.getPower(), this);
    }
  }
};

towerTypes[6] = {
  name: "Gift Slime",
  desc: "Besonders giftiger Slime",
  level: 1,
  isBlocking: false,
  radius: 0.4,
  power: 15,
  price: 2000,
  sellPrice: 300,
  tex: null,
  extend: {
    collide: function (mob, dist) {
      mob.hit(this.getPower(), this);
    }
  }
};

towerTypes[7] = {
  name: "AoE Tower",
  desc: "Macht gewaltigen Flächenschaden",
  level: 0,
  isBlocking: true,
  radius: 1.5,
  freq: 25,
  power: 65,
  price: 500,
  sellPrice: 200,
  tex: null,
  extend: {
    init: function () {
      this.focus = null;
      this.dist = 0;
      this.reload = this.getFreq();
      this.shooting = false;

      this.shotSpr = new PIXI.Sprite(this.type.shotTex);
      this.shotSpr.anchor.set(0.5);
      this.shotSpr.x = this.x + game.cellCenter;
      this.shotSpr.y = this.y + game.cellCenter;
      this.shotSpr.scale.set(0);

      this.game.shotCon.addChild(this.shotSpr);
    },
    destroy: function () {
      Tower.prototype.destroy.call(this);
      this.game.shotCon.removeChild(this.shotSpr);
      this.shotSpr.destroy();
    },
    update: function () {
      if (this.shooting) {
        this.shotSpr.scale.x += 0.05;
        this.shotSpr.scale.y += 0.05;
        if (this.shotSpr.scale.x > 1) {
          this.shotSpr.scale.set(0);
          this.shooting = false;
          this.spr.texture = this.type.tex;
        }
      }
    },
    beforeCollide: function () {
      this.reload--;
    },
    collide: function (mob, dist) {
      if (this.reload > 0) return;

      if (this.isInRadius(dist)) {
        this.shooting = true;
        this.spr.texture = this.type.tex2;
        mob.hit(this.getPower(), this);
      }
    },
    afterCollide: function () {
      if (this.reload <= 0) {
        this.reload = this.getFreq();
      }
    }
  }
};

towerTypes[8] = {
  name: "AoE Tower 2",
  desc: "Deutlich mehr Reichweite",
  level: 1,
  isBlocking: true,
  radius: 3,
  freq: 20,
  power: 130,
  price: 2222,
  sellPrice: 950,
  tex: null,
  extend: {
    init: function () {
      this.focus = null;
      this.dist = 0;
      this.reload = this.getFreq();
      this.shooting = false;

      this.shotSpr = new PIXI.Sprite(this.type.shotTex);
      this.shotSpr.anchor.set(0.5);
      this.shotSpr.x = this.x + game.cellCenter;
      this.shotSpr.y = this.y + game.cellCenter;
      this.shotSpr.scale.set(0.1);

      this.game.shotCon.addChild(this.shotSpr);
    },
    destroy: function () {
      Tower.prototype.destroy.call(this);
      this.game.shotCon.removeChild(this.shotSpr);
      this.shotSpr.destroy();
    },
    update: function () {
      if (this.shooting) {
        this.shotSpr.scale.x += 0.05;
        this.shotSpr.scale.y += 0.05;
        if (this.shotSpr.scale.x > 2) {
          this.shotSpr.scale.set(0);
          this.shooting = false;
          this.spr.texture = this.type.tex;
        }
      }
    },
    beforeCollide: function () {
      this.reload--;
    },
    collide: function (mob, dist) {
      if (this.reload > 0) return;

      if (this.isInRadius(dist)) {
        this.shooting = true;
        this.spr.texture = this.type.tex2;
        mob.hit(this.getPower(), this);
      }
    },
    afterCollide: function () {
      if (this.reload <= 0) {
        this.reload = this.getFreq();
      }
    }
  }
};

towerTypes[9] = {
  name: "Ufo",
  desc: "Schießt Blitze",
  level: 0,
  isBlocking: true,
  radius: 4,
  freq: 15,
  power: 30,
  price: 700,
  sellPrice: 200,
  tex: null,
  shotTex: null,
  extend: {
    init: function () {
      this.focus = null;
      this.dist = 0;
      this.texCounter = 0;
      this.reload = this.getFreq();
      this.aimFunc = aimFuncs.first;

      this.shotSpr = new PIXI.Sprite(this.type.shotTex[0]);
      this.shotSpr.anchor.set(0, 0.5);
      this.shotSpr.x = this.x + game.cellCenter;
      this.shotSpr.y = this.y + game.cellCenter;
      this.shotSpr.scale.set(0);
      this.game.shotCon.addChild(this.shotSpr);
    },
    destroy: function () {
      Tower.prototype.destroy.call(this);
      this.game.shotCon.removeChild(this.shotSpr);
      this.shotSpr.destroy();
    },
    update: function () {
      var y = this.shotSpr.scale.y;
      y -= 0.02;
      if (y < 0) y = 0;
      this.shotSpr.scale.y = y;
    },
    beforeCollide: function () {
      this.reload--;
      this.focus = null;
      this.dist = 0;
    },
    collide: function (mob, dist) {
      if (this.reload > 0) return;

      if (this.isInRadius(dist) && this.aimFunc(mob, dist)) {
        this.focus = mob;
        this.dist = dist;
      }
    },
    afterCollide: function () {
      if (this.reload <= 0) {
        this.reload = this.getFreq();
      }
      if (this.focus !== null) {
        this.focus.hit(this.getPower(), this);
        this.spr.rotation = this.shotSpr.rotation = this.angleToMob(this.focus);
        this.shotSpr.width = this.dist;
        this.shotSpr.scale.y = 1;
        this.texCounter = (this.texCounter + 1) % 3;
        this.shotSpr.texture = this.type.shotTex[this.texCounter];
      }
    }
  }
};

towerTypes[10] = {
  name: "Ufo 2",
  desc: "Schießt Blitze",
  level: 1,
  isBlocking: true,
  radius: 6,
  freq: 10,
  power: 60,
  price: 1700,
  sellPrice: 300,
  tex: null,
  shotTex: null,
  extend: {
    init: function () {
      this.focus = null;
      this.dist = 0;
      this.texCounter = 0;
      this.reload = this.getFreq();
      this.aimFunc = aimFuncs.first;

      this.shotSpr = new PIXI.Sprite(this.type.shotTex[0]);
      this.shotSpr.anchor.set(0, 0.5);
      this.shotSpr.x = this.x + game.cellCenter;
      this.shotSpr.y = this.y + game.cellCenter;
      this.shotSpr.scale.set(0);
      this.game.shotCon.addChild(this.shotSpr);
    },
    destroy: function () {
      Tower.prototype.destroy.call(this);
      this.game.shotCon.removeChild(this.shotSpr);
      this.shotSpr.destroy();
    },
    update: function () {
      var y = this.shotSpr.scale.y;
      y -= 0.02;
      if (y < 0) y = 0;
      this.shotSpr.scale.y = y;
    },
    beforeCollide: function () {
      this.reload--;
      this.focus = null;
      this.dist = 0;
    },
    collide: function (mob, dist) {
      if (this.reload > 0) return;

      if (this.isInRadius(dist) && this.aimFunc(mob, dist)) {
        this.focus = mob;
        this.dist = dist;
      }
    },
    afterCollide: function () {
      if (this.reload <= 0) {
        this.reload = this.getFreq();
      }
      if (this.focus !== null) {
        this.focus.hit(this.getPower(), this);
        this.spr.rotation = this.shotSpr.rotation = this.angleToMob(this.focus);
        this.shotSpr.width = this.dist;
        this.shotSpr.scale.y = 1;
        this.texCounter = (this.texCounter + 1) % 3;
        this.shotSpr.texture = this.type.shotTex[this.texCounter];
      }
    }
  }
};

towerTypes[11] = {
  name: "Aura Tower",
  desc: "Verstärkt Schaden und Geschwindigkeit der umliegenden Türme",
  level: 0,
  isBlocking: true,
  radius: 1.5,
  price: 500,
  sellPrice: 100,
  tex: null,
  texAnim: null,
  powerAdd: 0.1,
  freqAdd: 0.1,
  extend: {
    init: function () {
      this.texCounter = 0;
      this.animUp = true;
      this.animCounter = 0;
    },
    destroy: function () {
      Tower.prototype.destroy.call(this);
    },
    update: function () {
      if ((this.animCounter = (this.animCounter + 1) % 15) === 0) {
        this.animCounter = 0;

        if (this.animUp) {
          this.texCounter++;
          if (this.texCounter > 3)
            this.animUp = false;
        } else {
          this.texCounter--;
          if (this.texCounter < 1)
            this.animUp = true;
        }
        this.spr.texture = this.type.texAnim[this.texCounter];
      }
    }
  }
};

towerTypes[12] = {
  name: "Aura Tower 2",
  desc: "Verstärkt Schaden und Geschwindigkeit der umliegenden Türme",
  level: 1,
  isBlocking: true,
  radius: 2,
  price: 1500,
  sellPrice: 300,
  tex: null,
  texAnim: null,
  powerAdd: 0.3,
  freqAdd: 0.3,
  extend: {
    init: function () {
      this.texCounter = 0;
      this.animUp = true;
      this.animCounter = 0;
    },
    destroy: function () {
      Tower.prototype.destroy.call(this);
    },
    update: function () {
      if ((this.animCounter = (this.animCounter + 1) % 15) === 0) {
        this.animCounter = 0;

        if (this.animUp) {
          this.texCounter++;
          if (this.texCounter > 3)
            this.animUp = false;
        } else {
          this.texCounter--;
          if (this.texCounter < 1)
            this.animUp = true;
        }
        this.spr.texture = this.type.texAnim[this.texCounter];
      }
    }
  }
};

towerTypes[1].next = 2;
towerTypes[3].next = 4;
towerTypes[5].next = 6;
towerTypes[7].next = 8;
towerTypes[9].next = 10;
towerTypes[11].next = 12;