﻿(function ($, window) {
    var MAP_WIDTH = 15,
     MAP_HEIGHT = 13,
     TILE_SIZE = 40,
     keyState = {},
     prevKeyState = {},
     inputId = 0,
     lastSentInputId = 0,
     lastProcessed = 0,
     inputs = [];

    function empty(state) {
        for (var key in window.Game.Keys) {
            if (state[window.Game.Keys[key]] === true) {
                return false;
            }
        }
        return true;
    }
    window.Game.Engine = function (assetManager) {
        this.assetManager = assetManager;
        this.players = {};
        this.ticks = 0;
        this.map = new window.Game.Map(MAP_WIDTH, MAP_HEIGHT, TILE_SIZE);
        this.sprites = [];
        this.inputManager = {
            isKeyDown: function (key) {
                return keyState[key] === true;
            },
            isKeyUp: function (key) {
                return keyState[key] === false;
            },
            isHoldingKey: function (key) {
                return prevKeyState[key] === true &&
                       keyState[key] === true;
            },
            isKeyPress: function (key) {
                return prevKeyState[key] === false &&
                       keyState[key] === true;
            },
            isKeyRelease: function (key) {
                return prevKeyState[key] === true &&
                       keyState[key] === false;
            }
        };
        for (var key in window.Game.Keys) {
            keyState[window.Game.Keys[key]] = false;
            prevKeyState[window.Game.Keys[key]] = false;
        }

        this.types = {
            GRASS: 0,
            WALL: 2,
            BRICK: 3,
        };
    }
    window.Game.Engine.prototype = {
       
        onKeydown: function (e) {
            keyState[e.keyCode] = true;
        },
        onKeyup: function (e) {
            keyState[e.keyCode] = false;
        },
        onExplosionEnd: function (x, y) {
            var randomPower = Math.floor(Math.random() * window.Game.Powerups.EXPLOSION) + window.Game.Powerups.SPEED;

            if (this.map.get(x, y) === this.types.BRICK) {
                this.map.set(x, y, this.types.GRASS);

                this.addSprite(new window.Game.Powerup(x, y, 1, randomPower));
            }
        },
        onExplosion: function (x, y) {
            for (var i = 0; i < this.sprites.length; ++i) {
                var sprite = this.sprites[i];
                if (sprite.explode && sprite.x === x && sprite.y === y) {
                    sprite.explode(this);
                }
            }
        },
        getSpritesAt: function (x, y) {
            var sprites = [];
            for (var i = 0; i < this.sprites.length; ++i) {
                var sprite = this.sprites[i];
                if (sprite.x === x && sprite.y === y) {
                    sprites.push(sprite);
                }
            }
            return sprites;
        },
        canDestroy: function (x, y) {
            var tile = this.map.get(x, y);
            return tile === this.types.BRICK || tile === this.types.GRASS;
        },
        addSprite: function (sprite) {
            this.sprites.push(sprite);
            this.sprites.sort(function (a, b) {
                return a.order - b.order;
            });
        },
        removeSprite: function (sprite) {
            var index = window.Game.Utils.indexOf(this.sprites, sprite);
            if (index !== -1) {
                this.sprites.splice(index, 1);
                this.sprites.sort(function (a, b) {
                    return a.order - b.order;
                });
            }
        },
        sendKeyState: function () {
           
            var player = this.players[0];

            if (!(empty(prevKeyState) && empty(keyState))) {
                inputs.push({ keyState: $.extend({}, keyState), id: inputId++ });
            }

            if ($.connection.hub.state === $.signalR.connectionState.connected) {
                var game = $.connection.gameHub,
                    updateTick = $.connection.hub.transport.name !== 'webSockets' ?
                            Math.max(1, Math.floor(window.Game.TicksPerSecond / 5)) :
                            1;

                if (this.ticks % updateTick === 0) {
                    var buffer = inputs.splice(0, inputs.length);
                    if (buffer.length > 0 && player.hasMoved) {
                        player.hasMoved = false;
                        player.placedBomb = false;
                        // send state to server
                        game.server.sendKeys(buffer);
                        lastSentInputId = buffer[buffer.length - 1].id;
                    }
                }
            }
        },
        initialize: function () {
            var that = this, game = $.connection.gameHub;

            game.client.initializeMap = function (data) {
                that.map.fill(data);
            };

            game.client.initializePlayer = function (player) {
                var bomber = new window.Game.Bomber(true);
                that.playerIndex = player.Index;
                that.players[player.Index] = bomber;
                bomber.moveTo(player.X, player.Y);
                that.addSprite(bomber);
            };

            game.client.playerLeft = function (player) {
                var bomber = that.players[player.Index];
                if (bomber) {
                    that.removeSprite(bomber);
                    that.players[player.Index] = null;
                }
            };

            game.client.initializeEnemies = function (enemies) {
                for (var i = 0; i < enemies.length; ++i) {
                    var enemy = enemies[i].Enemy;

                    var bomber = new window.Game.Bomber(false);
                    that.players[enemy.Index] = bomber;
                    bomber.moveTo(enemy.X, enemy.Y);
                    that.addSprite(bomber);

                }
            };

            game.client.updatePlayerState = function (player) {
                // recive last processed input on server
                lastProcessed = player.LastProcessed;
            };
            game.client.updateEnemyStates = function (enemies) {
                var sprite = null;
                for (var i = 0; i < enemies.length; i++) {
                    sprite = that.players[enemies[i].Enemy.Index];
                    
                    if (sprite) {
                        // Brute force
                        sprite.x = enemies[i].Enemy.X;
                        sprite.y = enemies[i].Enemy.Y;
                        sprite.exactX = enemies[i].Enemy.ExactX;
                        sprite.exactY = enemies[i].Enemy.ExactY;
                        sprite.direction = enemies[i].Enemy.Direction;
                        sprite.directionX = enemies[i].Enemy.DirectionX;
                        sprite.directionY = enemies[i].Enemy.DirectionY;
                        if (enemies[i].Enemy.BombSet) {
                            sprite.createBomb(that);
                        }
                        sprite.updateAnimation(that);
                    }
                    
                }
            }
            $.connection.hub.logging = false;
            $.connection.hub.url = 'http://localhost:61536/signalr';
            $.connection.hub.start();
        },
        update: function () {
            this.ticks++;
            this.sendKeyState();

            for (var i = 0; i < this.sprites.length; ++i) {
                var sprite = this.sprites[i];
                if (sprite.update) {
                    sprite.update(this);
                }
            }

            for (var key in keyState) {
                prevKeyState[key] = keyState[key];
            }
            window.Game.Logger.log('last sent input = ' + lastSentInputId);
            window.Game.Logger.log('last server processed input = ' + lastProcessed);
          
        },
        movable: function (x, y) {
            if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                if (this.map.get(x, y) === this.types.GRASS) {
                    for (var i = 0; i < this.sprites.length; ++i) {
                        var sprite = this.sprites[i];
                        if (sprite.x === x && sprite.y === y) {
                            return false;
                        }
                    }

                    return true;
                }
            }

            return false;
        }

    };
})(jQuery, window)