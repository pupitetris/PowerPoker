/*
   This game is inspired on COMPUTE!'s Gazette 1985/11 (Issue 29)
   Power Poker game, coded in C64 Basic. This implementation is
   Copyright (C) 2008-2025, Arturo Espinosa Aldama and is released
   under the GNU GPL v2. You can get a copy of the license at:

   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
*/

function i02d(n) {
    return (n < 10)? '0' + n: n.toString();
}

function cookieSet(cName, value, expiredays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + expiredays);
    document.cookie = cName + "=" + encodeURI(value) +
        ((expiredays == null)? "" : ";expires=" + exdate.toGMTString());
}

function cookieGet(cName) {
    if (document.cookie.length > 0) {
        var cStart = document.cookie.indexOf(cName + "=");
        if (cStart != -1) {
            cStart = cStart + cName.length + 1;
            var cEnd = document.cookie.indexOf(";", cStart);
            if (cEnd == -1)
                cEnd = document.cookie.length;
            return decodeURI(document.cookie.substring(cStart, cEnd));
        }
    }
    return "";
}

function cmp(a, b) {
    return (a < b)? -1: (a > b)? 1: 0;
}

class PowerPoker {
    constructor() {
        this.CARD_WIDTH = 78;
        this.CARD_HEIGHT = 97;
        this.BOARD_SPACING = 10;
        this.BLINK_TIMES = 12;
        this.BLINK_DELAY = 100;
        this.HAND_SIZE = 5;
        this.SUITE_SIZE = 13;
        this.DECK_SIZE = 52;
        this.BOARD_SIZE = this.HAND_SIZE * this.HAND_SIZE;
        this.FLY_SPEED = 10;

        this.DECK = [];
        this.BOARD_CLICK;
        this.CARD_NEXT;
        this.CARD_FLY;
        this.INFO_CHIP;
        this.HAND_CHIP;

        this.BOARD;
        this.CURR;
        this.CARD_COUNT;
        this.SCORE;
        this.HIGH = 0;

        this.HANDS = [
            { score: 400, str: 'Royal Flush' },
            { score: 300, str: 'Straight Flush' },
            { score: 160, str: 'Four of a Kind' },
            { score: 120, str: 'Straight' },
            { score: 100, str: 'Full House'},
            { score:  60, str: 'Three of a Kind' },
            { score:  50, str: 'Flush' },
            { score:  30, str: 'Two Pair' },
            { score:  10, str: 'One Pair' }
        ];

        this.HAND_KEYS = {
            _royal: 0,
            _strfl: 1,
            _4ofak: 2,
            _str:   3,
            _full:  4,
            _3ofak: 5,
            _flush: 6,
            _2pair: 7,
            _1pair: 8
        };

        this.init();
    }

    cardSet(node, card) {
        node.className = 'card c' + card;
    }

    scoreSet(score) {
        document.getElementById('score').innerHTML = score;
    }

    highSet(score) {
        document.getElementById('high').innerHTML = score;
    }

    handSet(str) {
        document.getElementById('hand').innerHTML = str;
    }

    slotHandsDisplay(status) {
        if (status) {
            document.getElementById('game').classList.remove('hands-display-no');
            this.BOARD_CLICK = this.slotClick.bind(this); // Bind 'this'
        } else {
            document.getElementById('game').classList.add('hands-display-no');
            this.BOARD_CLICK = undefined;
        }
    }

    blinkSet(status) {
        if (status)
            document.getElementById('game').classList.remove('card-blink-display-no');
        else
            document.getElementById('game').classList.add('card-blink-display-no');
    }

    handCheck(hand) {
        var same = [];
        var flush = true;
        var straight = true;
        var suit, osuit;
        var kind, okind;
        var lastSame = 0;

        hand.sort(function(a, b) { return cmp(a.card, b.card); });

        for (var i = 0; i < this.HAND_SIZE; i++) {
            osuit = suit;
            okind = kind;
            suit = hand[i].card.substring(2);
            kind = parseInt(hand[i].card.substring(0, 2), 10);
            hand[i].flag = false;

            if (i == 0) continue;
            if (suit != osuit) flush = false;
            if (kind != okind + 1 &&
                !(i == 1 && kind == 9 && okind == 0))
                straight = false;
            if (kind == okind) {
                lastSame++;
                hand[i].flag = true;
                hand[i - 1].flag = true;
            } else if (lastSame > 0) {
                same.push(lastSame);
                lastSame = 0;
            }
        }

        if (straight || flush) {
            for (var i = 0; i < this.HAND_SIZE; i++)
                hand[i].flag = true;
        } else {
            if (lastSame > 0)
                same.push(lastSame);
            same.sort(this.cmp);
        }

        var key;
        if (straight) {
            if (flush) {
                if (parseInt(hand[0].card.substring(0, 2)) == 0)
                    key = 'royal';
                else
                    key = 'strfl';
            } else
                key = 'str';
        } else if (flush)
            key = 'flush';
        else if (same.length > 0) {
            if (same[0] == 3)
                key = '4ofak';
            else if (same[0] == 2)
                key = '3ofak';
            else {
                if (same[1] == 2)
                    key = 'full';
                else if (same[1] == 1)
                    key = '2pair';
                else
                    key = '1pair';
            }
        }

        if (key) {
            var points = this.HANDS[this.HAND_KEYS['_' + key]];
            this.SCORE += points.score;
            this.handSet(points.str);
            return true;
        }
        return false;
    }

    nextSet() {
        var k = Math.floor(Math.random() * this.CURR);
        this.CURR--;
        var tmp = this.DECK[this.CURR];
        this.DECK[this.CURR] = this.DECK[k];
        this.DECK[k] = tmp;

        this.cardSet(this.CARD_NEXT, this.DECK[this.CURR]);
        this.CARD_NEXT.onclick = () => {};
        this.slotHandsDisplay(true);
        this.handSet('');
    }

    gameInit() {
        this.BOARD = [];
        this.CURR = this.DECK_SIZE;

        this.scoreSet(this.SCORE = 0);
        this.handSet('');

        this.slotHandsDisplay(false);
        this.blinkSet(false);

        if (this.CARD_COUNT) {
            this.CARD_NEXT.onclick = () => {};
            this.CARD_NEXT.className = "card reverse";
            this.boardTurn('card reverse', () => { this.boardTurn('card slot', () => { this.nextSet(); }); });
        } else {
            this.CARD_NEXT.onclick = () => { this.nextSet(); };
            this.boardTurn('card slot');
        }

        this.CARD_COUNT = 0;
    }

    gameOver() {
        if (this.SCORE > this.HIGH) {
            this.HIGH = this.SCORE;
            cookieSet('this.high', this.HIGH, 99999);
            this.highSet(this.HIGH);
        }
        this.handSet('<span class="gameover">Game Over</span>');
        this.CARD_NEXT.className = "card reverse hand";
        this.CARD_NEXT.onclick = () => { this.gameInit(); };
    }

    nextCheck() {
        this.CARD_COUNT++;
        if (this.CARD_COUNT == this.BOARD_SIZE)
            this.gameOver();
        else {
            window.setTimeout(() => { this.nextSet(); }, 200);
        }
    }

    handBlink(hand, i, func) {
        if (i == this.BLINK_TIMES || i == 0)
            for (var j = 0; j < hand.length; j++) {
                var card = hand[j];
                if (card.flag) {
                    var slot = document.getElementById('slot' + card.pos);
                    if (i)
                        slot.className += ' blink';
                    else {
                        var c = slot.className;
                        slot.className = c.substring(0, c.indexOf(' blink'));
                    }
                }
            }

        this.blinkSet((i % 2)? true: false);
        if (i) {
            window.setTimeout(() => { this.handBlink(hand, --i, func); }, this.BLINK_DELAY);
        } else {
            this.scoreSet(this.SCORE);
            func();
        }
    }

    boardTurnCard(start, className, xtra) {
        var first = start;
        if (first >= this.HAND_SIZE)
            first += (first - this.HAND_SIZE + 1) * (this.HAND_SIZE - 1);
        var i = first;
        do {
            document.getElementById('slot' + i).className = className;
            i += this.HAND_SIZE - 1;
        } while (Math.floor(i / this.HAND_SIZE) < this.HAND_SIZE && i % this.HAND_SIZE < this.HAND_SIZE - 1);

        if (first <  this.HAND_SIZE * this.HAND_SIZE - 1) {
            window.setTimeout(() => { this.boardTurnCard(start + 1, className, xtra); }, 100);
        } else if (xtra)
            window.setTimeout(xtra, 100);
    }

    boardTurn(className, xtra) {
        window.setTimeout(() => { this.boardTurnCard(0, className, xtra); }, 100);
    }

    boardCheckCol(col) {
        var hand = [];
        for (var y = 0; y < this.HAND_SIZE; y++) {
            var pos = y * this.HAND_SIZE + col;
            if (this.BOARD[pos])
                hand.push({card: this.BOARD[pos], pos: pos});
        }

        if (hand.length != this.HAND_SIZE || !this.handCheck(hand))
            return false;
        this.handBlink(hand, this.BLINK_TIMES, () => { this.nextCheck(); });
        return true;
    }

    boardCheckRow(row, col) {
        var hand = [];
        for (var x = 0; x < this.HAND_SIZE; x++) {
            var pos = row * this.HAND_SIZE + x;
            if (this.BOARD[pos])
                hand.push({card: this.BOARD[pos], pos: pos});
        }

        if (hand.length != this.HAND_SIZE || !this.handCheck(hand))
            return false;
        this.handBlink(hand,
                       this.BLINK_TIMES,
                       () => {
                           if (!this.boardCheckCol(col))
                               this.nextCheck();
                       });
        return true;
    }

    boardCheck(slot) {
        var col = slot % this.HAND_SIZE;
        var row = Math.floor(slot / this.HAND_SIZE);

        return this.boardCheckRow(row, col) || this.boardCheckCol(col);
    }

    slotFly(origx, origy, destx, cos, sin, func) {
        if (origx - destx < cos * this.FLY_SPEED * -1) {
            this.CARD_FLY.style.display = 'none';
            func();
        } else {
            this.CARD_FLY.style.left = origx + 'px';
            this.CARD_FLY.style.top = origy + 'px';
            origx += cos * this.FLY_SPEED;
            origy += sin * this.FLY_SPEED;

            window.setTimeout(() => { this.slotFly(origx, origy, destx, cos, sin, func); }, 5);
        }
    }

    slotClick(slot) {
        if (this.BOARD[slot])
            return;

        this.BOARD[slot] = this.DECK[this.CURR];
        this.slotHandsDisplay(false);

        this.CARD_FLY = document.getElementById("fly");
        this.CARD_FLY.className = this.CARD_NEXT.className;
        this.CARD_FLY.style.left = '458px';
        this.CARD_FLY.style.top = '150px';
        this.CARD_FLY.style.display = 'inline';
        this.CARD_NEXT.className = "card reverse";

        var destx = (slot % this.HAND_SIZE) * (this.CARD_WIDTH + this.BOARD_SPACING);
        var desty = Math.floor(slot / this.HAND_SIZE) * (this.CARD_HEIGHT + this.BOARD_SPACING);
        var dx = destx - 458;
        var dy = desty - 150;
        var h = Math.sqrt(dx * dx + dy * dy);
        var sin = dy / h;
        var cos = dx / h;

        this.slotFly(458, 150, destx, cos, sin, () => { this.slotSet(slot); });
    }

    slotSet(slot) {
        this.cardSet(document.getElementById('slot' + slot), this.DECK[this.CURR]);
        if (!this.boardCheck(slot))
            this.nextCheck();
    }

    boardClick(slot) {
        if (this.BOARD_CLICK)
            this.BOARD_CLICK(slot);
    }

    handEnable() {
        this.HAND_CHIP.onclick = () => { this.handDisable(); };
        this.HAND_CHIP.style.backgroundImage = 'url(img/hand_chip.png)';
        document.getElementById('game').classList.remove('hands-off');
    }

    handDisable() {
        this.HAND_CHIP.onclick = () => { this.handEnable(); };
        this.HAND_CHIP.style.backgroundImage = 'url(img/hand_chip_yes.png)';
        document.getElementById('game').classList.add('hands-off');
    }

    infoClose() {
        document.getElementById('infowindow').style.display = 'none';
        document.getElementById('handchip').style.display = 'inline';
        document.getElementById('board').style.display = 'block';
        this.INFO_CHIP.firstChild.style.display = 'none';
        this.INFO_CHIP.onclick = () => { this.info(); };
    }

    info() {
        document.getElementById('board').style.display = 'none';
        document.getElementById('handchip').style.display = 'none';
        document.getElementById('infowindow').style.display = 'block';
        this.INFO_CHIP.firstChild.style.display = 'inline';
        this.INFO_CHIP.onclick = () => { this.infoClose(); };
    }

    init() {
        var suits = ['c', 'd', 'h', 's'];
        for (var i in suits)
            for (var j = 0; j < this.SUITE_SIZE; j++)
                this.DECK[i * this.SUITE_SIZE + j] = i02d(j) + suits[i];

        const pp = this;
        var slots = document.getElementById('slots');
        for (var i = 0; i < this.BOARD_SIZE; i++) {
            var x = i % this.HAND_SIZE;
            var y = Math.floor(i / this.HAND_SIZE);
            var xx = x * (this.CARD_WIDTH + this.BOARD_SPACING);
            var yy = y * (this.CARD_HEIGHT + this.BOARD_SPACING);
            var slot = document.createElement('span');
            slot.appendChild(document.createElement('span'));
            slot.slot = i;
            slot.id = 'slot' + i;
            slot.className = 'card trans';
            slot.onclick = function() { pp.boardClick(this.slot); };
            slot.style.top = yy + 'px';
            slot.style.left = xx + 'px';
            slots.appendChild(slot);
        }
        var fly = document.createElement('span');
        fly.appendChild(document.createElement('span'));
        fly.id = 'fly';
        fly.className = 'card trans';
        slots.appendChild(fly);

        this.CARD_NEXT = document.getElementById('next');
        this.CARD_NEXT.style.top = '150px';
        this.CARD_NEXT.style.left = (this.HAND_SIZE *
            (this.CARD_WIDTH + this.BOARD_SPACING) + 112) + 'px';

        this.INFO_CHIP = document.getElementById('infochip');
        this.INFO_CHIP.firstChild.style.display = 'none';
        this.INFO_CHIP.onclick = () => { this.info(); };

        this.HAND_CHIP = document.getElementById('handchip');
        this.HAND_CHIP.onclick = () => { this.handDisable(); };

        var html = '<table><caption>Poker Hand Point Values</caption>';
        for (var i = 0; this.HANDS[i]; i++)
            html += '<tr><th>' + this.HANDS[i].str + '</th><td>' + this.HANDS[i].score + '</td></tr>';
        html += '</table>';
        document.getElementById('scoretable').innerHTML = html;

        var links = document.getElementsByTagName('a');
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            if (link.target == "") {
                if (link.className.indexOf('new-win') != -1) {
                    link.target = '_blank';
                }
            }
        }

        this.HIGH = cookieGet('this.high');
        if (!this.HIGH)
            this.HIGH = 0;
        this.highSet(this.HIGH);
        this.gameInit();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    new PowerPoker();
});
