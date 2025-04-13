# Power Poker

Place the cards on the 5x5 board and make as many points as you can
from the resulting [Poker
hands](http://en.wikipedia.org/wiki/List_of_poker_hands), both
top-down and across. That's it!

![Screenshot][screenshot]
*In the above game, the player has filled up one row and one column,
scoring 90 points: 30 for a hand of two pairs (10s and 9s), and 60
for a three of a kind hand.*

| Hand           | Points | Hand            | Points |
|----------------|--------|-----------------|--------|
| Royal Flush    | 400    | Three of a Kind | 60     |
| Straight Flush | 300    | Flush           | 50     |
| Four of a Kind | 160    | Two Pair        | 30     |
| Straight       | 120    | One Pair        | 10     |
| Full House     | 100    |                 |        |

## Credits

This game is inspired on COMPUTE!'s Gazette 1985/11 (Issue 29) Power
Poker game, coded in C64 BASIC by [Jud
Bleser](https://bleser.com/jud/jud.html). This implementation is
Copyright &copy; 2008-2025, Arturo Espinosa Aldama and is released
under the [GNU GPL
v2](http://www.gnu.org/licenses/old-licenses/gpl-2.0.html).

Many thanks to [Colin M.L. Burnett](http://en.wikipedia.org/wiki/User:Cburnett)
for the Free [SVG playing cards](http://commons.wikimedia.org/wiki/Category:SVG_playing_cards_2).

## COMPUTE!'s Gazette article

Here is the description of the game verbatim from the paper
publication:

### *Power* Poker

Poker is a game that's just as popular today as it was a century
ago. Even though there's always a random element at play, it usually
requires careful thought and a knowledge of probability. The
variations created by the cards you're dealt and how you arrange them
makes poker unpredictable. "Power Poker," written for the Commodore
64, adds a new twist to the game - rather, another dimension.

### A Double Purpose

Think of this game as two-dimensional poker. You play on a
five-by-five grid and try to make the hands that gain the most
points. Each card serves two hands, so placement must be done
carefully. (If you're new to poker, see "Poker Hands.")

After entering the program, save a copy and type RUN. (If you're using
a black-and-white TV, change the value of variable TV from 1 to 0 in
line 100). You'll see a table of the number of points awarded for each
kind of hand. After a pause of a few seconds, you're ready to begin. A
five-by-five grid is displayed, each position identified by a letter
A-Y.

![Screenshots of the C64 Version][screenshot-c64]
*Starting with an empty five-by-five grid, you're dealt a card selected
randomly by the computer. As the game progresses, you build poker
hands both horizontally and vertically. In the second photo, note the
top row, where a 10 of diamonds will complete a straight flush. The
third photo shows several additional hands: the straight flush on top,
two pair in the second row, a straight across the bottom row, two pair
in the first column, one pair in the second column, three of a kind in
the third column and in the fourth, and four of a kind in the fifth.*

The computer randomly selects a card and displays it. Place it in the
grid by pressing the appropriate letter. After the card is placed, a
new one is chosen and displayed, and so on, until all 25 cards have
been placed. Choose your moves carefully, and remember: There are 52
cards in the deck, but you'll only have 25 to play with. The goal is
to make the most points possible. Scoring is based on the hands you
build. After a column or row is completed, points are totaled and
added immediately to your score. (High score is displayed at all times
on the screen also.)

| Hand            | Points |
|-----------------|--------|
| Royal flush     | 400    |
| Straight flush  | 300    |
| Four of a kind  | 160    |
| Straight        | 120    |
| Full house      | 100    |
| Three of a kind | 60     |
| Flush           | 50     |
| Two pair        | 30     |
| One pair        | 10     |

> ### Poker Hands
>
> If you've never played poker, it's very easy to learn. There are 52
> cards, divided into four sets (or suits) of 13. The suits are hearts,
> clubs, spades, and diamonds, and each suit consists of cards numbered
> 2-10 with a jack, queen, king, and ace. The object is to make one of
> the folloWing hands (examples are in parentheses):
> 
> **Royal flush**: 10,j,K,Q,A-all of the same suit
> **Straight flush**: a sequence of five of the same suit (9,lO,J,Q,K-all diamonds)
> **Four of a kind**: four of the same value (2,2,2,2)
> **Straight**: five in sequence (4,5,6,7,8)
> **Full house**: three of a kind plus a pair (10, 10,10,4,4)
> **Three of a kind**: three of the same value (9,9,9)
> **Flush**: five of the same suit (2,K,8,A,5-all dubs)
> **Two pair**: two groups of two, each of the same value (A,A,6,6)
> **One pair**: two of the same value (10,10) 

To remember the value of each hand, you can press F1 at any time
during the game to see the table of values. Press it again to resume
play. Poker players may notice that some of the hands are out of
order. Normally, a flush would be much higher on the list. But
remember that you're drawing 25 cards and the odds for getting two or
three flushes are very high. Higher point values have been given to
hands that are less likely to occur. Hands do not need to be in
sequential order. For example, "5,6,4,7,8" is a valid
straight. However, "roll-over" or "round the corner" straights such as
"3,2,A,K,Q" are not allowed. Straights using an ace as low (A,2,3,4,5)
or high (10,J,Q,K,A) are acceptable.

[screenshot]: doc/PowerPoker_Screenshot_v0801-01.png
[screenshot-c64]: doc/gazette-screenshots.png
