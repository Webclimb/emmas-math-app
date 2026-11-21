// Error-pattern library (spec F-6). Each pattern: learner sentence, grown-up description, at-home activity.
import type { Misconception } from './types';

export const MIS: Record<string, Misconception> = {
 'op-sub-for-div':{kid:'That answer comes from taking away. Dividing means sharing into equal groups.',parent:'Used subtraction on a division question',act:'Deal real objects (cards, coins, crackers) into equal piles and say it out loud: "12 shared into 3 piles is 4 each."'},
 'op-add-for-div':{kid:'That answer adds the numbers. Dividing splits a number into equal groups.',parent:'Added on a division question',act:'Share objects into equal piles, then count one pile.'},
 'op-mult-for-div':{kid:'That answer multiplies. Dividing goes the other way: it splits into equal groups.',parent:'Multiplied on a division question',act:'Use a fact triangle (12 at the top, 3 and 4 at the bottom). Cover one number and ask what is missing.'},
 'op-add-for-mult':{kid:'That answer adds the two numbers. Multiplying means equal groups: 3 × 4 is 3 groups of 4.',parent:'Added instead of multiplying',act:'Make equal groups with objects, like 3 cups with 4 beans in each, and count them.'},
 'op-add-for-sub':{kid:'That answer adds. Taking away makes the number smaller.',parent:'Added on a subtraction question',act:'Act out take-away stories with objects she can physically remove.'},
 'op-sub-for-add':{kid:'That answer takes away. Adding puts groups together, so the total gets bigger.',parent:'Subtracted on an addition question',act:'Push two piles of objects together and count all of them.'},
 'sub-smaller-from-larger':{kid:'Careful: in each column, take the bottom number away from the top one. If the top is smaller, break a ten into 10 ones first.',parent:'Took the smaller digit from the larger one in each column (regrouping error)',act:'Use bundled straws or base-ten blocks and physically trade one ten for ten ones.'},
 'regroup':{kid:'That answer is 10 away. Check whether a ten needs to move.',parent:'Off by exactly ten (carrying or borrowing slip)',act:'Add and subtract with base-ten blocks, making a new ten whenever there are 10 ones.'},
 'place-swap':{kid:'The digits are swapped. The first digit tells you the tens.',parent:'Reversed the digits (for example 47 and 74)',act:'Build numbers with blocks, or $10 bills and $1 coins, and say them as "4 tens and 7 ones".'},
 'place-face':{kid:'Look at where the digit sits. A 4 in the tens place is worth 40.',parent:'Gave the digit instead of its place value',act:'Use a hundreds | tens | ones chart, or money: $100, $10 and $1.'},
 'tens-ones-mix':{kid:'Check which digit changes: 1 more or less changes the ones, and 10 more or less changes the tens.',parent:'Mixed up 1 more/less with 10 more/less',act:'Use a hundred chart: 1 more is one step right, 10 more is one row down.'},
 'off-by-one':{kid:'So close! That is one away. Count again slowly and touch each one.',parent:'Off by one (counting slip)',act:'Count objects by touching and moving each one; group them in fives and tens.'},
 'fact-neighbor':{kid:'Close: that is one group too many or too few. Build it from a fact you know.',parent:'Gave a neighbouring times-table answer',act:'Practise one strategy at a time, for example ×9 is ×10 minus one group.'},
 'skip-count':{kid:'Count the groups again. Each group adds the same amount.',parent:'Skip-counting slip',act:'Skip-count out loud while pointing at each group.'},
 'make10-same':{kid:'That repeats the number you started with. Count the empty spaces instead.',parent:'Repeated the given number instead of finding the missing part',act:'Use an egg carton or ten-frame: how many empty spots are left?'},
 'numberline-scale':{kid:'Check what each tick counts by. Here each tick might be worth 10.',parent:'Misread the scale on a number line',act:'Tape a number line on the floor and walk it, counting by ones and then by tens.'},
 'frac-denominator':{kid:'More pieces means smaller pieces. 1/8 is smaller than 1/4.',parent:'Thought a bigger bottom number means a bigger fraction',act:'Fold paper strips into halves, quarters and eighths and compare the pieces.'},
 'frac-flip':{kid:'The bottom number is how many equal parts. The top number is how many are shaded.',parent:'Swapped the top and bottom numbers of a fraction',act:'Shade parts of paper strips and name them: "3 out of 4 parts".'},
 'frac-part-part':{kid:'The bottom number counts all the parts, shaded and not shaded.',parent:'Compared shaded parts to unshaded parts instead of to the whole',act:'Always count the whole first, then the shaded parts.'},
 'frac-unshaded':{kid:'That counts the parts that are not shaded. Count the shaded ones.',parent:'Counted the unshaded parts',act:'Point to and count only the coloured parts.'},
 'story-op':{kid:'Picture the story. Are things joined, taken away, put in equal groups, or shared?',parent:'Chose the wrong operation in a word problem',act:'Act out word problems with objects before writing any numbers.'},
};
