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

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
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
const FLY_SPEED = 5;

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

const FLOAT_TRANSLATE_RE = /(^| +)translateY\([^)]+\)/;
const FLOAT_ROTATE_RE = /(^| +)rotate\(([^)]+)\)/;

class PowerPoker {
    constructor(ele_base) {
        this.deck = this.initDeck();
        this.board_click = undefined;

        this.board = [];
        this.curr = DECK_SIZE;
        this.card_count = 0;
        this.score = 0;
        this.high = 0;

        this.ele_base = ele_base;
        this.ele_game = this.elementGet('.pp-game');
        this.ele_score = this.elementGet('.pp-score');
        this.ele_high_score = this.elementGet('.pp-high');
        this.ele_hand = this.elementGet('.pp-hand');
        this.ele_card_next = this.elementGet('.pp-next');
        this.ele_infochip = this.elementGet('.pp-infochip');
        this.ele_handchip = this.elementGet('.pp-handchip');
        this.ele_infowindow = this.elementGet('.pp-infowindow');
        this.ele_board = this.elementGet('.pp-board');
        this.ele_slots = this.elementGet('.pp-slots');
        this.ele_scoretable = this.elementGet('.pp-scoretable');

        this.init();
    }

    elementGet(selector) {
        return this.ele_base.querySelector(selector);
    }

    linkElementsGet() {
        return this.ele_base.querySelectorAll('a');
    }

    slotElementGet(slot_pos) {
        return this.elementGet(`[slot="${slot_pos}"]`);
    }

    cardSet(node, card) {
        node.className = 'pp-card c' + card;
    }

    scoreSet(score) {
        this.ele_score.innerHTML = score;
    }

    highSet(score) {
        this.ele_high_score.innerHTML = score;
    }

    handSet(str) {
        this.ele_hand.innerHTML = str;
    }

    slotHandsDisplay(status) {
        if (status) {
            this.ele_game.classList.remove('hands-display-no');
            this.board_click = this.slotClick;
        } else {
            this.ele_game.classList.add('hands-display-no');
            this.board_click = undefined;
        }
    }

    blinkSet(status) {
        if (status)
            this.ele_game.classList.remove('pp-card-blink-display-no');
        else
            this.ele_game.classList.add('pp-card-blink-display-no');
    }

    handCheck(hand) {
        if (hand.length < HAND_SIZE)
            return undefined;

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
            hand[i].blink = false;

            if (i == 0) continue;
            if (suit != osuit) flush = false;
            if (kind != okind + 1 &&
                !(i == 1 && kind == 9 && okind == 0))
                straight = false;
            if (kind == okind) {
                lastSame++;
                hand[i].blink = true;
                hand[i - 1].blink = true;
            } else if (lastSame > 0) {
                same.push(lastSame);
                lastSame = 0;
            }
        }

        if (straight || flush) {
            for (const item of hand)
                item.blink = true;
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

        return key;
    }

    nextSet() {
        const k = Math.floor(Math.random() * this.curr);
        this.curr--;
        const tmp = this.deck[this.curr];
        this.deck[this.curr] = this.deck[k];
        this.deck[k] = tmp;

        this.cardSet(this.ele_card_next, this.deck[this.curr]);
        this.ele_card_next.onclick = () => {};
        this.slotHandsDisplay(true);
        this.handSet('');
    }

    async gameInit() {
        this.board = [];
        this.curr = DECK_SIZE;

        this.scoreSet(this.score = 0);
        this.handSet('');

        this.slotHandsDisplay(false);
        this.blinkSet(false);

        if (this.card_count) {
            this.ele_card_next.onclick = () => {};
            this.ele_card_next.className = 'pp-card reverse';
            await this.boardTurn('pp-card reverse');
            await this.boardTurn('pp-card slot');
            this.nextSet();
        } else {
            this.ele_card_next.onclick = () => this.nextSet();
            await this.boardTurn('pp-card slot');
        }

        this.card_count = 0;
    }

    gameOver() {
        if (this.score > this.high) {
            this.high = this.score;
            cookieSet('this.high', this.high, 99999);
            this.highSet(this.high);
        }
        this.handSet('<span class="pp-gameover">Play Again</span>');
        this.ele_card_next.className = 'pp-card reverse hand';
        this.ele_card_next.onclick = () => this.gameInit();
    }

    async nextCheck() {
        this.card_count++;
        if (this.card_count == BOARD_SIZE)
            this.gameOver();
        else {
            await wait(200);
            this.nextSet();
        }
    }

    async handBlink(hand) {
        const slots = [];
        for (const item of hand)
            if (item.blink) {
                const slot = this.slotElementGet(item.pos);
                slots.push(slot);
                slot.classList.add('blink');
            }

        for (let i = 0; i < BLINK_TIMES; i++) {
            this.blinkSet((i % 2)? true: false);
            await wait(BLINK_DELAY);
        }

        for (const slot of slots)
            slot.classList.remove('blink');
    }

    async boardTurn(className) {
        let start = 0;
        let first = 0;
        while (first < BOARD_SIZE - 1) {
            first = start;
            if (first >= HAND_SIZE)
                first += (first - HAND_SIZE + 1) * (HAND_SIZE - 1);
            let i = first;
            do {
                this.slotElementGet(i).className = className;
                i += HAND_SIZE - 1;
            } while (Math.floor(i / HAND_SIZE) < HAND_SIZE && i % HAND_SIZE < HAND_SIZE - 1);
            start ++;
            await wait(100);
        }
    }

    handAdd(hand, x, y) {
        const pos = y * HAND_SIZE + x;
        if (this.board[pos])
            hand.push({ card: this.board[pos], pos: pos, blink: false });
    }

    async boardCheckHand(hand) {
        const key = this.handCheck(hand);
        if (key) {
            const points = HANDS[HAND_KEYS[key]];
            this.score += points.score;
            this.handSet(points.str);
            await this.handBlink(hand, BLINK_TIMES);
            this.scoreSet(this.score);
        }
    }

    async boardCheckCol(col) {
        const hand = [];
        for (let y = 0; y < HAND_SIZE; y++)
            this.handAdd(hand, col, y);
        await this.boardCheckHand(hand);
    }

    async boardCheckRow(row) {
        const hand = [];
        for (let x = 0; x < HAND_SIZE; x++)
            this.handAdd(hand, x, row);
        await this.boardCheckHand(hand);
    }

    async boardCheck(slot) {
        const row = Math.floor(slot / HAND_SIZE);
        const col = slot % HAND_SIZE;

        await this.boardCheckRow(row);
        await this.boardCheckCol(col);
        await this.nextCheck();
    }

    cardFloat(ele, z, angle) {
        let trans = ele.style.transform.replace(FLOAT_TRANSLATE_RE, '');
        if (z > 0) {
            z *= 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x = Math.floor(z * sin);
            const y = Math.floor(z * cos);
            ele.style.boxShadow = `${x}px ${y}px ${z}px rgba(0,0,0,0.5)`;
            trans += ` translateY(${z}px)`;
        } else {
            ele.style.boxShadow = '';
        }
        ele.style.transform = trans;
    }

    async slotFly(origx, origy, destx, cos, sin) {
        let steps = Math.floor((destx - origx) / (cos * FLY_SPEED));
        const dangle = (Math.PI * 2 / steps) * (random(0, 1)? -1: 1);
        let angle = 0;

        const card_fly = this.ele_card_fly;
        while (steps > 0) {
            card_fly.style.left = origx + 'px';
            card_fly.style.top = origy + 'px';
            card_fly.style.transform = `rotate(${angle}rad)`;
            this.cardFloat(card_fly, Math.floor(Math.abs(Math.sin(angle / 2)) * 10), angle);
            angle += dangle;
            origx += cos * FLY_SPEED;
            origy += sin * FLY_SPEED;
            steps --;
            await wait(10);
        }
        this.ele_card_fly.style.display = 'none';
    }

    async slotClick(slot) {
        if (this.board[slot])
            return;

        this.board[slot] = this.deck[this.curr];
        this.slotHandsDisplay(false);

        this.ele_card_fly.className = this.ele_card_next.className;
        this.ele_card_fly.style.left = '458px';
        this.ele_card_fly.style.top = '150px';
        this.ele_card_fly.style.display = 'inline';
        this.ele_card_next.className = 'pp-card reverse';

        const destx = (slot % HAND_SIZE) * (CARD_WIDTH + BOARD_SPACING);
        const desty = Math.floor(slot / HAND_SIZE) * (CARD_HEIGHT + BOARD_SPACING);
        const dx = destx - 458;
        const dy = desty - 150;
        const h = Math.sqrt(dx * dx + dy * dy);
        const sin = dy / h;
        const cos = dx / h;

        await this.slotFly(458, 150, destx, cos, sin);
        await this.slotSet(slot);
    }

    async slotSet(slot_pos) {
        this.cardSet(this.slotElementGet(slot_pos), this.deck[this.curr]);
        await this.boardCheck(slot_pos);
    }

    async boardClick(slot_pos) {
        if (this.board_click)
            await this.board_click(slot_pos);
    }

    handEnable() {
        this.ele_handchip.onclick = () => this.handDisable();
        this.ele_handchip.style.backgroundImage = 'var(--pp-handchip-image)';
        this.ele_game.classList.remove('hands-off');
    }

    handDisable() {
        this.ele_handchip.onclick = () => this.handEnable();
        this.ele_handchip.style.backgroundImage = 'var(--pp-handchip-yes-image)';
        this.ele_game.classList.add('hands-off');
    }

    infoClose() {
        this.ele_infowindow.style.display = 'none';
        this.ele_handchip.style.display = 'inline';
        this.ele_board.style.display = 'block';
        this.ele_infochip.firstChild.style.display = 'none';
        this.ele_infochip.onclick = () => this.info();
    }

    info() {
        this.ele_board.style.display = 'none';
        this.ele_handchip.style.display = 'none';
        this.ele_infowindow.style.display = 'block';
        this.ele_infochip.firstChild.style.display = 'inline';
        this.ele_infochip.onclick = () => this.infoClose();
    }

    initDeck() {
        const deck = [];
        const suits = ['c', 'd', 'h', 's'];
        for (const i in suits)
            for (let j = 0; j < SUITE_SIZE; j++)
                deck.push(i02d(j) + suits[i]);
        return deck;
    }

    initSlots() {
        const pp = this;
        const slots = this.ele_slots;
        for (let i = 0; i < BOARD_SIZE; i++) {
            const x = i % HAND_SIZE;
            const y = Math.floor(i / HAND_SIZE);
            const xx = x * (CARD_WIDTH + BOARD_SPACING);
            const yy = y * (CARD_HEIGHT + BOARD_SPACING);
            const slot = document.createElement('span');
            slot.appendChild(document.createElement('span'));
            slot.slot = i;
            slot.className = 'pp-card trans';
            slot.onclick = function() { return pp.boardClick(this.slot); };
            slot.style.top = yy + 'px';
            slot.style.left = xx + 'px';
            slots.appendChild(slot);
        }
        const fly = document.createElement('span');
        this.ele_card_fly = fly;
        fly.appendChild(document.createElement('span'));
        fly.className = 'pp-card trans pp-fly';
        slots.appendChild(fly);
    }

    async init() {
        this.initSlots();

        this.ele_card_next.style.top = '150px';
        this.ele_card_next.style.left = (HAND_SIZE *
            (CARD_WIDTH + BOARD_SPACING) + 112) + 'px';

        this.ele_infochip.firstChild.style.display = 'none';
        this.ele_infochip.onclick = () => this.info();
        this.ele_handchip.onclick = () => this.handDisable();

        let html = '<table><caption>Poker Hand Point Values</caption>';
        for (const hand of HANDS)
            html += '<tr><th>' + hand.str + '</th><td>' + hand.score + '</td></tr>';
        html += '</table>';
        this.ele_scoretable.innerHTML = html;

        for (const link of this.linkElementsGet())
            if (link.target == '' && link.classList.contains('new-win'))
                link.target = '_blank';

        this.high = cookieGet('this.high');
        if (!this.high)
            this.high = 0;
        this.highSet(this.high);
        await this.gameInit();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    new PowerPoker(document.querySelector('.pp'));
});
