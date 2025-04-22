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
    document.cookie = cName + '=' + encodeURI(value) +
        ((expiredays == null)? '' : ';expires=' + exdate.toGMTString());
}

function cookieGet(cName) {
    if (document.cookie.length > 0) {
        var cStart = document.cookie.indexOf(cName + '=');
        if (cStart != -1) {
            cStart = cStart + cName.length + 1;
            var cEnd = document.cookie.indexOf(';', cStart);
            if (cEnd == -1)
                cEnd = document.cookie.length;
            return decodeURI(document.cookie.substring(cStart, cEnd));
        }
    }
    return '';
}

function cmp(a, b) {
    return (a < b)? -1: (a > b)? 1: 0;
}

const CARD_WIDTH = 78;
const CARD_HEIGHT = 97;
const BOARD_SPACING = 10;
const BLINK_TIMES = 12;
const BLINK_DELAY = 100;
const HAND_SIZE = 5;
const SUITE_SIZE = 13;
const DECK_SIZE = 52;
const BOARD_SIZE = HAND_SIZE * HAND_SIZE;
const FLY_SPEED = 10;

const HANDS = [
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

const HAND_KEYS = {
    royal:     0,
    strfl:     1,
    fourofak:  2,
    str:       3,
    full:      4,
    threeofak: 5,
    flush:     6,
    twopair:   7,
    onepair:   8
};

class PowerPoker {
    constructor() {
        this.deck = [];
        this.board_click;
        this.card_next;
        this.card_fly;
        this.info_chip;
        this.hand_chip;

        this.board;
        this.curr;
        this.card_count;
        this.score;
        this.high = 0;

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
            this.board_click = this.slotClick.bind(this); // Bind 'this'
        } else {
            document.getElementById('game').classList.add('hands-display-no');
            this.board_click = undefined;
        }
    }

    blinkSet(status) {
        if (status)
            document.getElementById('game').classList.remove('card-blink-display-no');
        else
            document.getElementById('game').classList.add('card-blink-display-no');
    }

    handCheck(hand) {
        const same = [];
        let flush = true;
        let straight = true;
        let suit, osuit;
        let kind, okind;
        let lastSame = 0;

        hand.sort((a, b) => cmp(a.card, b.card))

        for (let i = 0; i < HAND_SIZE; i++) {
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
            for (let i = 0; i < HAND_SIZE; i++)
                hand[i].flag = true;
        } else {
            if (lastSame > 0)
                same.push(lastSame);
            same.sort(cmp);
        }

        let key;
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
                key = 'fourofak';
            else if (same[0] == 2)
                key = 'threeofak';
            else {
                if (same[1] == 2)
                    key = 'full';
                else if (same[1] == 1)
                    key = 'twopair';
                else
                    key = 'onepair';
            }
        }

        if (key) {
            const points = HANDS[HAND_KEYS[key]];
            this.score += points.score;
            this.handSet(points.str);
            return true;
        }
        return false;
    }

    nextSet() {
        const k = Math.floor(Math.random() * this.curr);
        this.curr--;
        const tmp = this.deck[this.curr];
        this.deck[this.curr] = this.deck[k];
        this.deck[k] = tmp;

        this.cardSet(this.card_next, this.deck[this.curr]);
        this.card_next.onclick = () => {};
        this.slotHandsDisplay(true);
        this.handSet('');
    }

    gameInit() {
        this.board = [];
        this.curr = DECK_SIZE;

        this.scoreSet(this.score = 0);
        this.handSet('');

        this.slotHandsDisplay(false);
        this.blinkSet(false);

        if (this.card_count) {
            this.card_next.onclick = () => {};
            this.card_next.className = 'card reverse';
            this.boardTurn('card reverse', () => this.boardTurn('card slot', () => this.nextSet()));
        } else {
            this.card_next.onclick = () => this.nextSet();
            this.boardTurn('card slot');
        }

        this.card_count = 0;
    }

    gameOver() {
        if (this.score > this.high) {
            this.high = this.score;
            cookieSet('this.high', this.high, 99999);
            this.highSet(this.high);
        }
        this.handSet('<span class="gameover">Game Over</span>');
        this.card_next.className = 'card reverse hand';
        this.card_next.onclick = () => this.gameInit();
    }

    nextCheck() {
        this.card_count++;
        if (this.card_count == BOARD_SIZE)
            this.gameOver();
        else {
            window.setTimeout(() => this.nextSet(), 200);
        }
    }

    handBlink(hand, i, func) {
        if (i == BLINK_TIMES || i == 0)
            for (let j = 0; j < hand.length; j++) {
                const card = hand[j];
                if (card.flag) {
                    const slot = document.getElementById('slot' + card.pos);
                    if (i)
                        slot.className += ' blink';
                    else {
                        let c = slot.className;
                        slot.className = c.substring(0, c.indexOf(' blink'));
                    }
                }
            }

        this.blinkSet((i % 2)? true: false);
        if (i) {
            window.setTimeout(() => this.handBlink(hand, --i, func), BLINK_DELAY);
        } else {
            this.scoreSet(this.score);
            func();
        }
    }

    boardTurnCard(start, className, xtra) {
        let first = start;
        if (first >= HAND_SIZE)
            first += (first - HAND_SIZE + 1) * (HAND_SIZE - 1);
        let i = first;
        do {
            document.getElementById('slot' + i).className = className;
            i += HAND_SIZE - 1;
        } while (Math.floor(i / HAND_SIZE) < HAND_SIZE && i % HAND_SIZE < HAND_SIZE - 1);

        if (first <  HAND_SIZE * HAND_SIZE - 1) {
            window.setTimeout(() => this.boardTurnCard(start + 1, className, xtra), 100);
        } else if (xtra)
            window.setTimeout(xtra, 100);
    }

    boardTurn(className, xtra) {
        window.setTimeout(() => this.boardTurnCard(0, className, xtra), 100);
    }

    boardCheckCol(col) {
        const hand = [];
        for (let y = 0; y < HAND_SIZE; y++) {
            const pos = y * HAND_SIZE + col;
            if (this.board[pos])
                hand.push({card: this.board[pos], pos: pos});
        }
        if (hand.length == HAND_SIZE &&
            this.handCheck(hand)) {
            this.handBlink(hand, BLINK_TIMES, () => this.nextCheck());
            return true;
        }
        return false;
    }

    boardCheckRow(row, col) {
        const hand = [];
        for (let x = 0; x < HAND_SIZE; x++) {
            const pos = row * HAND_SIZE + x;
            if (this.board[pos])
                hand.push({card: this.board[pos], pos: pos});
        }
        if (hand.length == HAND_SIZE &&
            this.handCheck(hand)) {
            this.handBlink(hand, BLINK_TIMES,
                () => {
                    if (!this.boardCheckCol(col))
                        this.nextCheck();
                });
            return true;
        }
        return false;
    }

    boardCheck(slot) {
        const col = slot % HAND_SIZE;
        const row = Math.floor(slot / HAND_SIZE);

        return this.boardCheckRow(row, col) || this.boardCheckCol(col);
    }

    slotFly(origx, origy, destx, cos, sin, func) {
        if (origx - destx < cos * FLY_SPEED * -1) {
            this.card_fly.style.display = 'none';
            func();
        } else {
            this.card_fly.style.left = origx + 'px';
            this.card_fly.style.top = origy + 'px';
            origx += cos * FLY_SPEED;
            origy += sin * FLY_SPEED;

            window.setTimeout(() => this.slotFly(origx, origy, destx, cos, sin, func), 5);
        }
    }

    slotClick(slot) {
        if (this.board[slot])
            return;

        this.board[slot] = this.deck[this.curr];
        this.slotHandsDisplay(false);

        this.card_fly = document.getElementById('fly');
        this.card_fly.className = this.card_next.className;
        this.card_fly.style.left = '458px';
        this.card_fly.style.top = '150px';
        this.card_fly.style.display = 'inline';
        this.card_next.className = 'card reverse';

        const destx = (slot % HAND_SIZE) * (CARD_WIDTH + BOARD_SPACING);
        const desty = Math.floor(slot / HAND_SIZE) * (CARD_HEIGHT + BOARD_SPACING);
        const dx = destx - 458;
        const dy = desty - 150;
        const h = Math.sqrt(dx * dx + dy * dy);
        const sin = dy / h;
        const cos = dx / h;

        this.slotFly(458, 150, destx, cos, sin, () => this.slotSet(slot));
    }

    slotSet(slot) {
        this.cardSet(document.getElementById('slot' + slot), this.deck[this.curr]);
        if (!this.boardCheck(slot))
            this.nextCheck();
    }

    boardClick(slot) {
        if (this.board_click)
            this.board_click(slot);
    }

    handEnable() {
        this.hand_chip.onclick = () => this.handDisable();
        this.hand_chip.style.backgroundImage = 'url(img/hand_chip.png)';
        document.getElementById('game').classList.remove('hands-off');
    }

    handDisable() {
        this.hand_chip.onclick = () => this.handEnable();
        this.hand_chip.style.backgroundImage = 'url(img/hand_chip_yes.png)';
        document.getElementById('game').classList.add('hands-off');
    }

    infoClose() {
        document.getElementById('infowindow').style.display = 'none';
        document.getElementById('handchip').style.display = 'inline';
        document.getElementById('board').style.display = 'block';
        this.info_chip.firstChild.style.display = 'none';
        this.info_chip.onclick = () => this.info();
    }

    info() {
        document.getElementById('board').style.display = 'none';
        document.getElementById('handchip').style.display = 'none';
        document.getElementById('infowindow').style.display = 'block';
        this.info_chip.firstChild.style.display = 'inline';
        this.info_chip.onclick = () => this.infoClose();
    }

    init() {
        const suits = ['c', 'd', 'h', 's'];
        for (const i in suits)
            for (let j = 0; j < SUITE_SIZE; j++)
                this.deck[i * SUITE_SIZE + j] = i02d(j) + suits[i];

        const pp = this;
        const slots = document.getElementById('slots');
        for (let i = 0; i < BOARD_SIZE; i++) {
            const x = i % HAND_SIZE;
            const y = Math.floor(i / HAND_SIZE);
            const xx = x * (CARD_WIDTH + BOARD_SPACING);
            const yy = y * (CARD_HEIGHT + BOARD_SPACING);
            const slot = document.createElement('span');
            slot.appendChild(document.createElement('span'));
            slot.slot = i;
            slot.id = 'slot' + i;
            slot.className = 'card trans';
            slot.onclick = function() { pp.boardClick(this.slot); }; //Still a normal function
            slot.style.top = yy + 'px';
            slot.style.left = xx + 'px';
            slots.appendChild(slot);
        }
        const fly = document.createElement('span');
        fly.appendChild(document.createElement('span'));
        fly.id = 'fly';
        fly.className = 'card trans';
        slots.appendChild(fly);

        this.card_next = document.getElementById('next');
        this.card_next.style.top = '150px';
        this.card_next.style.left = (HAND_SIZE *
            (CARD_WIDTH + BOARD_SPACING) + 112) + 'px';

        this.info_chip = document.getElementById('infochip');
        this.info_chip.firstChild.style.display = 'none';
        this.info_chip.onclick = () => this.info();

        this.hand_chip = document.getElementById('handchip');
        this.hand_chip.onclick = () => this.handDisable();

        let html = '<table><caption>Poker Hand Point Values</caption>';
        for (let i = 0; HANDS[i]; i++)
            html += '<tr><th>' + HANDS[i].str + '</th><td>' + HANDS[i].score + '</td></tr>';
        html += '</table>';
        document.getElementById('scoretable').innerHTML = html;

        const links = document.getElementsByTagName('a');
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            if (link.target == '') {
                if (link.className.indexOf('new-win') != -1) {
                    link.target = '_blank';
                }
            }
        }

        this.high = cookieGet('this.high');
        if (!this.high)
            this.high = 0;
        this.highSet(this.high);
        this.gameInit();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    new PowerPoker();
});
