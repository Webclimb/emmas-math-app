// Skill map (spec F-2, section 12). All skills, groups and prerequisites live here.
import type { Skill } from './types';

export const STAGES = ['Hands-on', 'Pictures', 'Numbers'] as const;
export const STAGE_WITH = ['hands-on', 'pictures', 'just numbers'] as const;

export const SKILLS: Skill[] = [
 {id:'quantity',name:'Seeing amounts',group:'Number sense',pre:[],about:'Recognising amounts in ten-frames and comparing two-digit numbers.',kid:'Spot how many without counting one by one, and compare numbers.'},
 {id:'numberline',name:'Number line',group:'Number sense',pre:['quantity'],about:'Placing and reading numbers on a number line; 1 more/less and 10 more/less.',kid:'Find numbers on a number line.'},
 {id:'placevalue',name:'Tens and ones',group:'Number sense',pre:['quantity'],about:'Place value: building numbers from hundreds, tens and ones.',kid:'Build numbers out of hundreds, tens and ones.'},
 {id:'makes10',name:'Making 10',group:'Number sense',pre:['quantity'],about:'Number bonds to 10, 20 and 100.',kid:'Find the numbers that make 10, 20 and 100.'},
 {id:'addition',name:'Adding',group:'Add & subtract',pre:['numberline','placevalue','makes10'],about:'Addition as combining, using number-line jumps and tens and ones.',kid:'Put groups together and find the total.'},
 {id:'subtraction',name:'Taking away',group:'Add & subtract',pre:['addition'],about:'Subtraction as taking away and finding a missing part, including regrouping.',kid:'Take away and find what is left.'},
 {id:'multmeaning',name:'Equal groups',group:'Multiply',pre:['addition'],about:'What multiplication means: equal groups and arrays.',kid:'Multiplying means equal groups. Learn to see them.'},
 {id:'multeasy',name:'× 2, 5, 10',group:'Multiply',pre:['multmeaning'],about:'Facts for 2, 5 and 10 using doubling, half of ten and adding a zero.',kid:'Times 2, 5 and 10 with shortcuts.'},
 {id:'multmid',name:'× 3 and 4',group:'Multiply',pre:['multeasy'],about:'Facts for 3 and 4, built from ×2.',kid:'Times 3 and 4, built from times 2.'},
 {id:'multhard',name:'× 6 to 9',group:'Multiply',pre:['multmid'],about:'Facts for 6 to 9, built from ×5 and ×10.',kid:'Times 6 to 9, built from times 5 and 10.'},
 {id:'divmeaning',name:'Sharing equally',group:'Divide',pre:['multmeaning','subtraction'],about:'What division means: sharing into equal groups (and how it differs from taking away).',kid:'Dividing means sharing into equal groups.'},
 {id:'divfacts',name:'Division facts',group:'Divide',pre:['divmeaning','multeasy'],about:'Division as the reverse of multiplication (fact families).',kid:'Use times facts to divide.'},
 {id:'whichop',name:'Which operation?',group:'Problem solving',pre:['divmeaning','subtraction'],about:'Reading a word problem and choosing +, −, × or ÷ from what is happening in the story.',kid:'Read a story problem and pick +, −, × or ÷.'},
 {id:'fractions',name:'Fractions',group:'Problem solving',pre:['divmeaning'],about:'Fractions as equal parts of a whole, unit fractions, and a fraction of a number.',kid:'Equal parts of a whole.'},
];
export const SK: Record<string, Skill> = Object.fromEntries(SKILLS.map(s=>[s.id,s]));
export const GROUPS = ['Number sense','Add & subtract','Multiply','Divide','Problem solving'];
/** v1 teaching order, also the placement ladder. */
export const LADDER = ['quantity','numberline','placevalue','makes10','addition','subtraction','multmeaning','multeasy','divmeaning','multmid','whichop','divfacts','fractions','multhard'];
