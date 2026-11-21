// Question generators: GEN[skill][stage](easy). Ported verbatim from v1; randomness from ./rng.
import { pick, ri, shuffle, random } from './rng';
import { ITEMS, NAMES } from './content';
import type { Option, Question, Stage } from './types';
import { eq, fr, plural, rangeFor, skip, tensLabels, vArray, vBarModel, vBlocks, vFracBar, vFracCircle, vFrames, vItems, vLine, vPlace, vPlates, vSum, vTri, OPICON, OPWORD, OPDO, type Jump } from './visuals';

type QInput = Partial<Question> & Pick<Question, 'prompt' | 'kind'>;
export type Gen = (easy: boolean) => Question;

function Q(o: QInput): Question { return Object.assign({ visual: null, hint: null, explain: { text: '' }, say: null, skill: '', stage: 0 as Stage }, o) as Question; }
export function numOpts(correct: number, ds: ({ v: number; mis?: string } | null | undefined)[] = [], { min = 0, n = 4 }: { min?: number; n?: number } = {}): { options: Option[]; answer: number } {
  const out: Option[] = [{ value: correct, label: String(correct), mis: null }], seen = new Set([correct]);
  for (const d of ds) { if (!d) continue; const v = d.v; if (!Number.isInteger(v) || v < min || seen.has(v)) continue; seen.add(v); out.push({ value: v, label: String(v), mis: d.mis || null }); if (out.length >= n) break; }
  let step = 1; while (out.length < 3 && step < 60) { for (const v of [correct + step, correct - step]) { if (out.length < 3 && v >= min && !seen.has(v)) { seen.add(v); out.push({ value: v, label: String(v), mis: step === 1 ? 'off-by-one' : null }); } } step++; }
  return { options: shuffle(out), answer: correct };
}
/** Typed-answer pattern map: wrong value -> pattern id. First listed pattern wins. */
export function pm(pairs: [number, string][], ans: number): Record<number, string> { const m: Record<number, string> = {}; for (const [v, mis] of pairs) { if (Number.isInteger(v) && v >= 0 && v !== ans && !(v in m)) m[v] = mis; } return m; }
function jumpList(a: number, b: number, useTens: boolean, dir = 1): Jump[] { const js: Jump[] = []; let p = a; const t = useTens ? Math.floor(b / 10) : 0, o = useTens ? b % 10 : b; for (let i = 0; i < t; i++) { js.push({ from: p, to: p + 10 * dir, label: (dir > 0 ? '+' : '−') + '10' }); p += 10 * dir; } for (let i = 0; i < o; i++) { js.push({ from: p, to: p + dir, label: (dir > 0 ? '+' : '−') + '1' }); p += dir; } return js; }

// ---------- multiplication strategies ----------
const STRAT: Record<number, { name: string; tip: (n: number) => string; how: (n: number) => string; arr: (n: number) => { rows: number; parts: number[]; removed?: number } }> = {
 2:{name:'Double it',tip:n=>`Double ${n}: ${n} + ${n}.`,how:n=>`2 × ${n} is double ${n}: ${n} + ${n} = ${2*n}.`,arr:n=>({rows:2,parts:[1,1]})},
 5:{name:'Half of 10 groups',tip:n=>`Find 10 × ${n}, then take half.`,how:n=>`10 × ${n} = ${10*n}. Half of that is ${5*n}.`,arr:n=>({rows:5,parts:[5]})},
 10:{name:'Add a zero',tip:n=>`Put a zero on the end of ${n}.`,how:n=>`10 × ${n}: put a zero on the end of ${n} to get ${10*n}.`,arr:n=>({rows:10,parts:[10]})},
 3:{name:'2 groups + 1 more group',tip:n=>`Find 2 × ${n}, then add one more ${n}.`,how:n=>`2 × ${n} = ${2*n}. One more ${n} makes ${3*n}.`,arr:n=>({rows:3,parts:[2,1]})},
 4:{name:'Double, then double again',tip:n=>`Find 2 × ${n}, then double it.`,how:n=>`2 × ${n} = ${2*n}. Double that: ${4*n}.`,arr:n=>({rows:4,parts:[2,2]})},
 6:{name:'5 groups + 1 more group',tip:n=>`Find 5 × ${n}, then add one more ${n}.`,how:n=>`5 × ${n} = ${5*n}. One more ${n} makes ${6*n}.`,arr:n=>({rows:6,parts:[5,1]})},
 7:{name:'5 groups + 2 more groups',tip:n=>`Find 5 × ${n}, then add 2 × ${n}.`,how:n=>`5 × ${n} = ${5*n} and 2 × ${n} = ${2*n}. Together that's ${7*n}.`,arr:n=>({rows:7,parts:[5,2]})},
 8:{name:'Double 4 groups',tip:n=>`Find 4 × ${n}, then double it.`,how:n=>`4 × ${n} = ${4*n}. Double that: ${8*n}.`,arr:n=>({rows:8,parts:[4,4]})},
 9:{name:'10 groups − 1 group',tip:n=>`Find 10 × ${n}, then take away one ${n}.`,how:n=>`10 × ${n} = ${10*n}. Take away one ${n}: ${9*n}.`,arr:n=>({rows:10,parts:[9],removed:1})},
};
function stratArray(k: number, n: number) {const p=STRAT[k].arr(n);return vArray(p.rows,n,{parts:p.parts,removed:p.removed||0});}
function factGen(ks: number[]): Gen[] {return [
 e=>{const k=pick(ks),n=ri(2,e?5:9);return Q({prompt:`Build <b>${k} × ${n}</b>. Make <b>${k}</b> rows with <b>${n}</b> in each row.`,say:`Build ${k} times ${n}. Make ${k} rows with ${n} in each row.`,kind:'build',build:{type:'rows',target:k,each:n},
   followup:{prompt:`So what is ${k} × ${n}?`,say:`So what is ${k} times ${n}?`,...numOpts(k*n,[{v:k+n,mis:'op-add-for-mult'},{v:k*n-n,mis:'fact-neighbor'},{v:k*n+n,mis:'fact-neighbor'}])},
   hint:{text:`Add rows until you have ${k}. The numbers at the end count by ${n}s.`},explain:{text:`${k} rows of ${n}: ${skip(n,k)}. So ${k} × ${n} = ${k*n}.`,visual:vArray(k,n)}});},
 e=>{const k=pick(ks),n=ri(2,e?5:9);return Q({prompt:`What is <b>${k} × ${n}</b>?`,say:`What is ${k} times ${n}?`,kind:'mc',visual:`${stratArray(k,n)}<p class="cap">${STRAT[k].name}</p>`,
   ...numOpts(k*n,[{v:k*n-n,mis:'fact-neighbor'},{v:k*n+n,mis:'fact-neighbor'},{v:k+n,mis:'op-add-for-mult'}]),hint:{text:STRAT[k].tip(n)},explain:{text:STRAT[k].how(n),visual:stratArray(k,n)},chart:true});},
 e=>{const k=pick(ks),n=ri(2,e?6:10);const [x,y]=random()<.5?[k,n]:[n,k];return Q({prompt:eq(`${x} × ${y}`),say:`What is ${x} times ${y}?`,kind:'pad',answer:k*n,
   padMis:pm([[k+n,'op-add-for-mult'],[k*n-n,'fact-neighbor'],[k*n+n,'fact-neighbor'],[k*n-k,'fact-neighbor'],[k*n+k,'fact-neighbor'],[k*n-1,'off-by-one'],[k*n+1,'off-by-one']],k*n),
   hint:{text:STRAT[k].tip(n)},explain:{text:STRAT[k].how(n),visual:stratArray(k,n)},chart:true});},
];}

// ---------- word problems ----------
interface Story { type: string; N: string; it: { one: string; many: string; e: string }; a: number; b: number; ans: number; op: string; text: string }
function story(type: string, small: boolean): Story {
  const N=pick(NAMES),it=pick(ITEMS);let a: number,b: number,ans: number,op: string,text: string;
  if(type==='join'){a=ri(small?3:14,small?9:48);b=ri(small?2:6,small?6:27);ans=a+b;op='+';text=`${N} has ${a} ${it.many}. ${N} gets ${b} more. How many ${it.many} does ${N} have now?`;}
  else if(type==='separate'){a=ri(small?7:24,small?14:65);b=ri(2,small?Math.min(6,a-2):a-8);ans=a-b;op='−';text=`${N} had ${a} ${it.many} and gave ${b} away. How many ${it.many} are left?`;}
  else if(type==='groups'){a=ri(2,small?4:9);b=ri(2,small?4:9);ans=a*b;op='×';text=`There are ${a} bags. Each bag has ${b} ${it.many}. How many ${it.many} are there altogether?`;}
  else if(type==='share'){b=ri(2,small?3:6);ans=ri(2,small?4:9);a=b*ans;op='÷';text=`${N} shares ${a} ${it.many} equally between ${b} friends. How many ${it.many} does each friend get?`;}
  else {b=ri(2,small?4:6);ans=ri(2,small?4:8);a=b*ans;op='÷';text=`${a} ${it.many} are packed into boxes, with ${b} in each box. How many boxes are filled?`;}
  return {type,N,it,a,b,ans,op,text};
}
function storyVisual(s: Story): string {
  const e=s.it.e;
  if(s.type==='join')return `<div class="story">${vItems(s.a,e)}<span class="story-then">then ${s.b} more</span>${vItems(s.b,e,0,'new')}</div>`;
  if(s.type==='separate')return vItems(s.a,e,s.b);
  if(s.type==='groups')return vPlates(s.a,s.b,e,{label:'Bag',box:true});
  if(s.type==='share')return vPlates(s.b,s.ans,e,{label:'Friend'});
  return vPlates(s.ans,s.b,e,{label:'Box',box:true});
}
export function opMis(correct: string, chosen: string): string {
  const m: Record<string, string> = {'÷−':'op-sub-for-div','÷+':'op-add-for-div','÷×':'op-mult-for-div','×+':'op-add-for-mult','−+':'op-add-for-sub','+−':'op-sub-for-add'};
  return m[correct+chosen]||'story-op';
}
function storyOps(s: Story): Option[] {
  const {a,b}=s;const list: Option[]=[{value:'+',label:`${a} + ${b}`},{value:'×',label:`${a} × ${b}`}];
  if(a>b)list.push({value:'−',label:`${a} − ${b}`});
  if(a%b===0)list.push({value:'÷',label:`${a} ÷ ${b}`});
  return shuffle(list.map(o=>Object.assign(o,{mis:o.value===s.op?null:opMis(s.op,String(o.value))})));
}
const STORY_TYPES = ['join','separate','groups','share','groupsOf','share'];

export const GEN: Record<string, Gen[]> = {
quantity:[
 e=>{const n=e?ri(3,10):ri(11,19);return Q({prompt:`Show <b>${n}</b> on the ten-frame${n>10?'s':''}. Tap the boxes to fill them.`,kind:'build',build:{type:'tenframe',frames:n>10?2:1,preset:0,target:n},
   hint:{text:n>10?`One full ten-frame is 10. Fill one frame, then add ${n-10} more.`:`Fill the top row first. That's 5.`},
   explain:{text:n>10?`A full frame is 10. Then ${n-10} more makes ${n}.`:n>5?`The top row is 5, and ${n-5} more makes ${n}.`:`Here is ${n}.`,visual:vFrames(n,n>10?2:1)}});},
 e=>{const n=e?ri(4,10):ri(11,20),f=n>10?2:1;return Q({prompt:'How many dots are there?',kind:'mc',visual:vFrames(n,f),...numOpts(n,[{v:n-1,mis:'off-by-one'},{v:n+1,mis:'off-by-one'},{v:n+2}]),
   hint:{text:'A full ten-frame is 10. A full row is 5.'},
   explain:{text:n>10?`One full frame is 10, and ${n-10} more makes ${n}.`:n===10?'The frame is full, so it is 10.':`There ${10-n===1?'is':'are'} ${10-n} empty ${plural(10-n,'box','boxes')}, and 10 − ${10-n} = ${n}.`,visual:vFrames(n,f)}});},
 e=>{let t,o;do{t=ri(e?1:2,e?4:9);o=ri(1,9);}while(t===o);const x=10*t+o,y=10*o+t;let z;do{z=ri(e?12:21,e?49:98);}while(z===x||z===y||z%10===Math.floor(z/10)||z%10===0);
   const max=Math.max(x,y,z),partner=max===x?y:max===y?x:-1;
   return Q({prompt:'Which number is the biggest?',kind:'mc',options:shuffle([x,y,z].map(v=>({value:v,label:String(v),mis:v===partner?'place-swap':null}))),answer:max,
     hint:{text:'Look at the first digit. It tells you how many tens.'},explain:{text:`Compare the tens digits first. If they're the same, compare the ones. ${max} is the biggest.`,visual:vBlocks(0,Math.floor(max/10),max%10)}});},
],
numberline:[
 e=>{const max=e?10:20;let t;do{t=ri(1,max-1);}while(t%5===0);const labels=e?[0,5,10]:[0,5,10,15,20],base=Math.floor(t/5)*5;
   return Q({prompt:`Tap the line to put the dot on <b>${t}</b>.`,kind:'build',build:{type:'nlplace',min:0,max,labels,target:t},
     hint:{text:`Find ${base} first, then count ${t-base} small ${plural(t-base,'tick')} to the right.`},explain:{text:`${t} is ${t-base} ${plural(t-base,'tick')} after ${base}.`,visual:vLine({min:0,max,labels,marker:t})}});},
 e=>{if(e){let v;do{v=ri(1,19);}while(v===10);return Q({prompt:'What number is the arrow pointing to?',kind:'mc',visual:vLine({min:0,max:20,labels:[0,10,20],arrow:v}),...numOpts(v,[{v:v-1,mis:'off-by-one'},{v:v+1,mis:'off-by-one'},{v:v+2}]),
     hint:{text:'Each small tick counts by 1. Start at the nearest labelled number.'},explain:{text:`Each tick is 1. The arrow is at ${v}.`,visual:vLine({min:0,max:20,labels:[0,5,10,15,20],arrow:v})}});}
   let v;do{v=ri(1,9)*10;}while(v===50);return Q({prompt:'What number is the arrow pointing to?',kind:'mc',visual:vLine({min:0,max:100,tick:10,labels:[0,50,100],arrow:v}),...numOpts(v,[{v:v/10,mis:'numberline-scale'},{v:v+10,mis:'numberline-scale'},{v:v-10,mis:'numberline-scale'}]),
     hint:{text:'There are 10 jumps from 0 to 100, so each tick counts by 10.'},explain:{text:`Each tick counts by 10. The arrow is at ${v}.`,visual:vLine({min:0,max:100,tick:10,labels:tensLabels(0,100),arrow:v})}});},
 e=>{const kind=pick(e?['1more','1less']:['10more','10less']);let a: number,ans: number,ds: { v: number; mis?: string }[],txt: string;
   if(kind==='1more'){a=random()<.5?ri(1,9)*10-1:ri(11,88);ans=a+1;ds=[{v:a-1},{v:a+10,mis:'tens-ones-mix'},{v:a+2,mis:'off-by-one'}];txt=`What is 1 more than <b>${a}</b>?`;}
   else if(kind==='1less'){a=random()<.5?ri(2,9)*10:ri(12,89);ans=a-1;ds=[{v:a+1},{v:a-10,mis:'tens-ones-mix'},{v:a-2,mis:'off-by-one'}];txt=`What is 1 less than <b>${a}</b>?`;}
   else if(kind==='10more'){a=ri(11,89);ans=a+10;ds=[{v:a+1,mis:'tens-ones-mix'},{v:a-10},{v:a+20}];txt=`What is 10 more than <b>${a}</b>?`;}
   else{a=ri(21,99);ans=a-10;ds=[{v:a-1,mis:'tens-ones-mix'},{v:a+10},{v:a-20}];txt=`What is 10 less than <b>${a}</b>?`;}
   const step=kind.startsWith('10')?10:1,sign=kind.includes('more')?'+':'−',[lo,hi]=rangeFor(a,ans);
   return Q({prompt:txt,kind:'mc',...numOpts(ans,ds),hint:{text:step===10?'10 more or less changes the tens digit by one. The ones digit stays the same.':'1 more or less changes the ones digit. Watch out when you cross a ten.'},
     explain:{text:`${a} ${sign} ${step} = ${ans}.`,visual:vLine({min:lo,max:hi,labels:tensLabels(lo,hi),jumps:[{from:a,to:ans,label:sign+step}],marker:ans})}});},
],
placevalue:[
 e=>{const target=e?ri(11,49):ri(101,299),H=Math.floor(target/100),T=Math.floor(target/10)%10,O=target%10;
   return Q({prompt:`Build <b>${target}</b> with blocks.`,kind:'build',build:{type:'blocks',target,hundreds:target>=100},
     hint:{text:target>=100?`In ${target}, the first digit is the hundreds, the middle digit is the tens and the last digit is the ones.`:`In ${target}, the first digit is the tens and the last digit is the ones.`},
     explain:{text:`${target} is ${H?`${H} ${plural(H,'hundred')}, `:''}${T} ${plural(T,'ten')} and ${O} ${plural(O,'one')}.`,visual:vBlocks(H,T,O)}});},
 e=>{const h=e?0:ri(1,2);let t,o;do{t=ri(1,9);o=ri(1,9);}while(t===o);const v=h*100+t*10+o,sw=h*100+o*10+t;
   return Q({prompt:'What number do these blocks show?',kind:'mc',visual:vBlocks(h,t,o),...numOpts(v,[{v:sw,mis:'place-swap'},{v:h+t+o,mis:'place-face'},{v:v+10}]),
     hint:{text:h?'Each big square is 100. Each rod is 10. Each small cube is 1.':'Count the rods by tens: 10, 20, 30… Then add the small cubes.'},
     explain:{text:`${h?`${h} ${plural(h,'hundred')}, `:''}${t} tens and ${o} ones make ${v}.`,visual:vPlace(String(v).split('').map(Number))}});},
 e=>{if(random()<.5){let d: number[];do{d=e?[ri(1,9),ri(1,9)]:[ri(1,9),ri(1,9),ri(1,9)];}while(new Set(d).size<d.length);
     const num=Number(d.join('')),pos=e?0:ri(0,1),pv=10**(d.length-1-pos),dg=d[pos],ans=dg*pv,pname=['hundreds','tens','ones'][3-d.length+pos];
     return Q({prompt:`What is the <b>${dg}</b> worth in <b>${num}</b>?`,kind:'mc',...numOpts(ans,[dg,dg*10,dg*100].filter(x=>x!==ans).map(v=>({v,mis:'place-face'}))),
       hint:{text:'Check which place the digit is in: hundreds, tens or ones.',visual:vPlace(d)},explain:{text:`The ${dg} is in the ${pname} place, so it is worth ${ans}.`,visual:vPlace(d,pos)}});}
   const t=ri(e?1:2,9),o=ri(0,9),v=10*t+o;
   return Q({prompt:`<b>${t}</b> tens and <b>${o}</b> ones make what number?`,kind:'mc',...numOpts(v,[{v:10*o+t,mis:'place-swap'},{v:t+o,mis:'place-face'},{v:v+10}]),
     hint:{text:'Each ten is worth 10. Count them by tens, then add the ones.'},explain:{text:`${t} tens is ${t*10}. Add ${o} ones: ${v}.`,visual:vBlocks(0,t,o)}});},
],
makes10:[
 e=>{const k=ri(2,8);return Q({prompt:`This ten-frame has <b>${k}</b>. Tap the empty boxes to fill it up to 10.`,kind:'build',build:{type:'tenframe',frames:1,preset:k,target:10},
   followup:{prompt:'How many did you add to make 10?',...numOpts(10-k,[{v:k,mis:'make10-same'},{v:11-k,mis:'off-by-one'},{v:9-k,mis:'off-by-one'}])},
   hint:{text:'Fill every empty box. Then count only the ones you added.'},explain:{text:`${k} and ${10-k} make 10.`,visual:vFrames(10,1,k)}});},
 e=>{if(e){const k=ri(2,8);return Q({prompt:'How many more dots would make 10?',kind:'mc',visual:vFrames(k,1),...numOpts(10-k,[{v:k,mis:'make10-same'},{v:11-k,mis:'off-by-one'},{v:9-k,mis:'off-by-one'}]),
     hint:{text:'Count the empty boxes.'},explain:{text:`There ${10-k===1?'is':'are'} ${10-k} empty ${plural(10-k,'box','boxes')}. ${k} + ${10-k} = 10.`,visual:vFrames(10,1,k)}});}
   const k=ri(11,18);return Q({prompt:'How many more dots would make 20?',kind:'mc',visual:vFrames(k,2),...numOpts(20-k,[{v:k-10,mis:'make10-same'},{v:21-k,mis:'off-by-one'},{v:19-k,mis:'off-by-one'}]),
     hint:{text:'Count the empty boxes in both frames.'},explain:{text:`There are ${20-k} empty boxes. ${k} + ${20-k} = 20.`,visual:vFrames(20,2,k)}});},
 e=>{if(e){const k=ri(1,9);return Q({prompt:`<span class="eq">${k} + <span class="blank">?</span> = 10</span>`,say:`${k} plus what makes 10?`,kind:'pad',answer:10-k,padMis:pm([[k,'make10-same'],[11-k,'off-by-one'],[9-k,'off-by-one']],10-k),
     hint:{text:'Picture a ten-frame. How many boxes would be empty?',visual:vFrames(k,1)},explain:{text:`${k} + ${10-k} = 10.`,visual:vFrames(10,1,k)}});}
   if(random()<.5){const t=ri(1,9),ans=100-10*t;return Q({prompt:`<span class="eq">${10*t} + <span class="blank">?</span> = 100</span>`,say:`${10*t} plus what makes 100?`,kind:'pad',answer:ans,padMis:pm([[10-t,'place-face'],[ans+10,'regroup'],[ans-10,'regroup']],ans),
     hint:{text:`${10*t} is ${t} tens. 100 is 10 tens. How many more tens?`},explain:{text:`${t} tens + ${10-t} tens = 10 tens. So ${10*t} + ${ans} = 100.`,visual:vBlocks(0,t,0)}});}
   let a;do{a=5*ri(3,19);}while(a%10===0);const ans=100-a;
   return Q({prompt:`<span class="eq">${a} + <span class="blank">?</span> = 100</span>`,say:`${a} plus what makes 100?`,kind:'pad',answer:ans,padMis:pm([[ans+10,'regroup'],[ans-10,'regroup'],[ans+1,'off-by-one'],[ans-1,'off-by-one']],ans),
     hint:{text:`First get to the next ten: ${a} + 5 = ${a+5}. Then count the tens to 100.`},explain:{text:`${a} + 5 = ${a+5}, and ${a+5} + ${95-a} = 100. 5 + ${95-a} = ${ans}.`,visual:vLine({min:Math.floor(a/10)*10,max:100,labels:tensLabels(Math.floor(a/10)*10,100),jumps:[{from:a,to:a+5,label:'+5'},{from:a+5,to:100,label:'+'+(95-a)}]})}});},
],
addition:[
 e=>{let a,b;if(e){a=ri(2,9);b=ri(2,8);}else{a=ri(11,59);b=ri(11,29);if(a%10===0)a++;}const target=a+b,[lo,hi]=e?[0,20]:rangeFor(a,target);
   return Q({prompt:`Start at <b>${a}</b>. Jump forward <b>${b}</b>.`,kind:'build',build:{type:'jumps',start:a,target,tens:!e},
     hint:{text:e?`Tap +1 ${b} times. Count each jump out loud.`:`${b} is ${Math.floor(b/10)} ${plural(Math.floor(b/10),'ten')} and ${b%10} ${plural(b%10,'one')}. Do the +10 jumps first.`},
     explain:{text:`${a} + ${b} = ${target}.`,visual:vLine({min:lo,max:hi,labels:e?[0,5,10,15,20]:tensLabels(lo,hi),jumps:jumpList(a,b,!e),marker:target})}});},
 e=>{let a,b;do{a=ri(11,39);b=ri(11,29);}while(e&&(a%10)+(b%10)>=10);const s=a+b,rg=(a%10)+(b%10)>=10;
   return Q({prompt:'Put these together. How many altogether?',kind:'mc',visual:vSum(a,b),...numOpts(s,[{v:Math.abs(a-b),mis:'op-sub-for-add'},{v:rg?s-10:s+10,mis:'regroup'},{v:s+1,mis:'off-by-one'}]),
     hint:{text:'Count all the rods by tens first. Then count the cubes. 10 cubes make another ten.'},
     explain:{text:`${Math.floor(a/10)+Math.floor(b/10)} tens and ${(a%10)+(b%10)} ones${rg?` (that's one more ten and ${(a%10)+(b%10)-10} ones)`:''} make ${s}.`,visual:vSum(a,b)}});},
 e=>{let a,b;if(e){a=10*ri(1,7)+ri(0,7);b=ri(1,9-a%10);}else{a=ri(15,69);b=ri(12,29);}const s=a+b,at=Math.floor(a/10),ao=a%10,bt=Math.floor(b/10),bo=b%10;
   return Q({prompt:eq(`${a} + ${b}`),say:`What is ${a} plus ${b}?`,kind:'pad',answer:s,padMis:pm([[Math.abs(a-b),'op-sub-for-add'],[s-10,'regroup'],[s+10,'regroup'],[s-1,'off-by-one'],[s+1,'off-by-one']],s),
     hint:{text:'Add the tens, then add the ones.',visual:vSum(a,b)},
     explain:{text:bt?`Tens: ${at*10} + ${bt*10} = ${(at+bt)*10}. Ones: ${ao} + ${bo} = ${ao+bo}. Together: ${s}.`:`Ones: ${ao} + ${bo} = ${ao+bo}. Add the ${at*10}: ${s}.`,visual:vSum(a,b)}});},
],
subtraction:[
 e=>{const it=pick(ITEMS),n=e?ri(5,10):ri(11,20),k=ri(2,n-2);return Q({prompt:`There are <b>${n}</b> ${it.many}. Tap <b>${k}</b> of them to take them away.`,kind:'build',build:{type:'crossout',n,k,e:it.e},
   followup:{prompt:`How many ${it.many} are left?`,...numOpts(n-k,[{v:n+k,mis:'op-add-for-sub'},{v:n-k+1,mis:'off-by-one'},{v:n-k-1,mis:'off-by-one'}])},
   hint:{text:'Tap one at a time and count as you go.'},explain:{text:`${n} take away ${k} leaves ${n-k}. That's ${n} − ${k} = ${n-k}.`,visual:vItems(n,it.e,k)}});},
 e=>{let a,b;if(e){a=ri(8,20);b=ri(2,a-3);}else{a=ri(30,90);b=ri(11,a-11);}const d=a-b,rg=(a%10)<(b%10);
   return Q({prompt:`The whole bar is <b>${a}</b>. One part is <b>${b}</b>. What is the other part?`,kind:'mc',visual:vBarModel(a,b),...numOpts(d,[{v:a+b,mis:'op-add-for-sub'},{v:rg?d+10:d-10,mis:'regroup'},{v:d+1,mis:'off-by-one'}]),
     hint:{text:`The two parts together make ${a}. Take ${b} away from ${a}.`},explain:{text:`${a} − ${b} = ${d}. Check: ${b} + ${d} = ${a}.`,visual:vBarModel(a,b,d)}});},
 e=>{let a,b;if(e){a=10*ri(2,9)+ri(1,9);b=ri(1,a%10);}else{a=ri(31,99);const at=Math.floor(a/10),ao=a%10;const bt=ri(1,at-1);const bo=(ao<9&&random()<.6)?ri(ao+1,9):ri(0,ao);b=10*bt+bo;}
   const d=a-b,at=Math.floor(a/10),ao=a%10,bt=Math.floor(b/10),bo=b%10,rg=ao<bo,sfl=Math.abs(at-bt)*10+Math.abs(ao-bo),[lo,hi]=rangeFor(d,a);
   return Q({prompt:eq(`${a} − ${b}`),say:`What is ${a} minus ${b}?`,kind:'pad',answer:d,padMis:pm([[a+b,'op-add-for-sub'],[sfl,'sub-smaller-from-larger'],[d+10,'regroup'],[d-10,'regroup'],[d+1,'off-by-one'],[d-1,'off-by-one']],d),
     hint:{text:rg?`You can't take ${bo} from ${ao}. Break one ten into 10 ones first.`:'Take away the tens, then take away the ones.'},
     explain:{text:rg?`${a} is ${at} tens and ${ao} ones. Break a ten: ${at-1} tens and ${ao+10} ones. ${ao+10} − ${bo} = ${ao+10-bo}. ${at-1} − ${bt} = ${at-1-bt} ${plural(at-1-bt,'ten')}. Answer: ${d}.`:`Ones: ${ao} − ${bo} = ${ao-bo}. Tens: ${at} − ${bt} = ${at-bt}. Answer: ${d}.`,
       visual:vLine({min:lo,max:hi,labels:tensLabels(lo,hi),jumps:jumpList(a,b,true,-1),marker:d})}});},
],
multmeaning:[
 e=>{const a=ri(2,e?4:5),b=ri(2,e?4:5),it=pick(ITEMS);return Q({prompt:`Make <b>${a}</b> groups with <b>${b}</b> in each group.`,kind:'build',build:{type:'groups',a,b,e:it.e},
   followup:{prompt:`How many ${it.many} is that altogether?`,...numOpts(a*b,[{v:a+b,mis:'op-add-for-mult'},{v:a*b-b,mis:'skip-count'},{v:a*b+b,mis:'skip-count'}])},
   hint:{text:'The first buttons set how many groups. The second buttons set how many go in each group.'},explain:{text:`${a} groups of ${b} is ${a} × ${b} = ${a*b}. Count by ${b}s: ${skip(b,a)}.`,visual:vPlates(a,b,it.e)}});},
 e=>{const it=pick(ITEMS);if(random()<.5){let a,b;do{a=ri(3,e?4:5);b=ri(2,e?4:5);}while(a===b);
     return Q({prompt:'Which matches the picture?',kind:'mc',visual:vPlates(a,b,it.e),options:shuffle([{value:'m',label:`${a} × ${b}`},{value:'a',label:`${a} + ${b}`,mis:'op-add-for-mult'},{value:'d',label:`${b} + ${b}`,mis:'skip-count'}]),answer:'m',
       hint:{text:`Count the groups. Then count how many are in one group.`},explain:{text:`There are ${a} groups with ${b} in each: ${a} × ${b}.`,visual:vPlates(a,b,it.e)}});}
   const a=ri(2,e?4:5),b=ri(2,e?4:5);return Q({prompt:`How many ${it.many} altogether?`,kind:'mc',visual:vPlates(a,b,it.e),...numOpts(a*b,[{v:a+b,mis:'op-add-for-mult'},{v:a*b-b,mis:'skip-count'},{v:a*b+1,mis:'off-by-one'}]),
     hint:{text:`Count by ${b}s, one group at a time.`},explain:{text:`${a} groups of ${b}: ${skip(b,a)}. That's ${a} × ${b} = ${a*b}.`,visual:vPlates(a,b,it.e)}});},
 e=>{const a=ri(2,e?5:6),b=ri(2,e?5:6);if(random()<.5){const mx=Math.max(a,b),mn=Math.min(a,b);
     return Q({prompt:`Which means the same as <b>${a} × ${b}</b>?`,say:`Which means the same as ${a} times ${b}?`,kind:'mc',options:shuffle([{value:'g',label:`${a} groups of ${b}`},{value:'a',label:`${a} and ${b} put together`,mis:'op-add-for-mult'},{value:'s',label:`${mx} take away ${mn}`},{value:'d',label:`${a} shared into ${b} groups`}]),answer:'g',
       hint:{text:'× means "groups of".'},explain:{text:`${a} × ${b} means ${a} groups of ${b}.`,visual:vPlates(a,b,'●')}});}
   return Q({prompt:`What is <b>${a}</b> groups of <b>${b}</b>?`,kind:'pad',answer:a*b,padMis:pm([[a+b,'op-add-for-mult'],[a*b-b,'skip-count'],[a*b+b,'skip-count'],[a*b-1,'off-by-one'],[a*b+1,'off-by-one']],a*b),
     hint:{text:`Count by ${b}s, ${a} times.`},explain:{text:`${a} groups of ${b}: ${skip(b,a)}. So ${a} × ${b} = ${a*b}.`,visual:vPlates(a,b,'●')}});},
],
multeasy:factGen([2,5,10]),
multmid:factGen([3,4]),
multhard:factGen([6,7,8,9]),
divmeaning:[
 e=>{let k,q;do{k=ri(2,e?3:4);q=ri(2,e?4:5);}while(k===2&&q===2);const n=k*q,it=pick(ITEMS);
   return Q({prompt:`Share <b>${n}</b> ${it.many} equally onto <b>${k}</b> plates. Tap a plate to put one ${it.one} on it.`,kind:'build',meta:{op:'÷',a:n,b:k},build:{type:'share',n,k,e:it.e},
     followup:{prompt:`How many ${it.many} are on each plate?`,...numOpts(q,[{v:n-k,mis:'op-sub-for-div'},{v:n+k,mis:'op-add-for-div'},{v:q+1,mis:'off-by-one'}])},
     hint:{text:'Go around the plates one at a time, like dealing cards.'},explain:{text:`${n} shared equally onto ${k} plates is ${q} each. That's ${n} ÷ ${k} = ${q}.`,visual:vPlates(k,q,it.e)}});},
 e=>{let k,q;do{k=ri(2,e?3:4);q=ri(2,e?4:5);}while(k===2&&q===2);const n=k*q,it=pick(ITEMS);
   if(random()<.6)return Q({prompt:`${n} ${it.many} were shared equally onto ${k} plates. Which number sentence matches?`,kind:'mc',meta:{op:'÷',a:n,b:k},visual:vPlates(k,q,it.e),
     options:shuffle([{value:'div',label:`${n} ÷ ${k} = ${q}`},{value:'sub',label:`${n} − ${k} = ${n-k}`,mis:'op-sub-for-div'},{value:'add',label:`${n} + ${k} = ${n+k}`,mis:'op-add-for-div'},{value:'mul',label:`${n} × ${k} = ${n*k}`,mis:'op-mult-for-div'}]),answer:'div',
     hint:{text:'Sharing equally means dividing. Look for ÷.'},explain:{text:`Sharing ${n} onto ${k} plates gives ${q} on each, so ${n} ÷ ${k} = ${q}. The ÷ sign means "shared equally into".`,visual:vPlates(k,q,it.e)}});
   return Q({prompt:`${n} ${it.many} were shared equally onto ${k} plates. How many are on each plate?`,kind:'mc',meta:{op:'÷',a:n,b:k},visual:vPlates(k,q,it.e),...numOpts(q,[{v:n-k,mis:'op-sub-for-div'},{v:n+k,mis:'op-add-for-div'},{v:q+1,mis:'off-by-one'}]),
     hint:{text:'Count the items on just one plate.'},explain:{text:`Each plate has ${q}. ${n} ÷ ${k} = ${q}.`,visual:vPlates(k,q,it.e)}});},
 e=>{let k,q;do{k=ri(2,e?3:5);q=ri(2,e?5:6);}while(k===2&&q===2);const n=k*q;
   if(random()<.5)return Q({prompt:`What does <b>${n} ÷ ${k}</b> mean?`,say:`What does ${n} divided by ${k} mean?`,kind:'mc',meta:{op:'÷',a:n,b:k},
     options:shuffle([{value:'s',label:`Share ${n} into ${k} equal groups`},{value:'t',label:`Take ${k} away from ${n}`,mis:'op-sub-for-div'},{value:'p',label:`Put ${n} and ${k} together`,mis:'op-add-for-div'},{value:'g',label:`${n} groups of ${k}`,mis:'op-mult-for-div'}]),answer:'s',
     hint:{text:'÷ means "shared equally into".'},explain:{text:`${n} ÷ ${k} means share ${n} into ${k} equal groups. Each group gets ${q}.`,visual:vPlates(k,q,'●')}});
   return Q({prompt:eq(`${n} ÷ ${k}`),say:`What is ${n} divided by ${k}?`,kind:'mc',meta:{op:'÷',a:n,b:k},...numOpts(q,[{v:n-k,mis:'op-sub-for-div'},{v:n+k,mis:'op-add-for-div'},{v:n*k,mis:'op-mult-for-div'}]),
     hint:{text:`Picture ${n} things shared onto ${k} plates.`},explain:{text:`Share ${n} into ${k} equal groups: each gets ${q}. So ${n} ÷ ${k} = ${q}.`,visual:vPlates(k,q,'●')}});},
],
divfacts:[
 e=>{const k=ri(2,e?3:5),q=ri(2,e?4:6),n=k*q,it=pick(ITEMS);return Q({prompt:`Put <b>${n}</b> ${it.many} into groups of <b>${k}</b>. Tap "Make a group" until none are left.`,kind:'build',meta:{op:'÷',a:n,b:k},build:{type:'makegroups',n,k,e:it.e},
   followup:{prompt:'How many groups did you make?',...numOpts(q,[{v:n-k,mis:'op-sub-for-div'},{v:n+k,mis:'op-add-for-div'},{v:q+1,mis:'off-by-one'}])},
   hint:{text:'Each tap takes away one group. Keep going until there are none left.'},explain:{text:`Each group took away ${k}. You did that ${q} times, so ${n} ÷ ${k} = ${q}.`,visual:vPlates(q,k,it.e,{box:true})}});},
 e=>{const k=ri(2,e?5:9),q=ri(2,e?5:9),n=k*q;return Q({prompt:`<b>${k} × ${q} = ${n}</b>. So what is <b>${n} ÷ ${k}</b>?`,say:`${k} times ${q} is ${n}. So what is ${n} divided by ${k}?`,kind:'mc',meta:{op:'÷',a:n,b:k},visual:vTri(n,k,q,'r'),
   ...numOpts(q,[{v:n-k,mis:'op-sub-for-div'},{v:n*k,mis:'op-mult-for-div'},{v:q+1,mis:'fact-neighbor'}]),
   hint:{text:`Division undoes multiplication. ${k} times what makes ${n}?`},explain:{text:`${k} × ${q} = ${n}, so ${n} ÷ ${k} = ${q}. They're in the same fact family.`,visual:vTri(n,k,q,null)}});},
 e=>{const k=ri(2,e?5:10),q=ri(2,e?5:10),n=k*q;return Q({prompt:eq(`${n} ÷ ${k}`),say:`What is ${n} divided by ${k}?`,kind:'pad',meta:{op:'÷',a:n,b:k},answer:q,padMis:pm([[n-k,'op-sub-for-div'],[n+k,'op-add-for-div'],[n*k,'op-mult-for-div'],[q-1,'fact-neighbor'],[q+1,'fact-neighbor']],q),
   hint:{text:`Think: ${k} times what makes ${n}?`},explain:{text:`${k} × ${q} = ${n}, so ${n} ÷ ${k} = ${q}.`,visual:vTri(n,k,q,null)},chart:true});},
],
whichop:[
 e=>{const s=story(pick(STORY_TYPES),true);return Q({prompt:s.text,kind:'mc',lead:'What is happening in this story?',
   options:shuffle(['+','−','×','÷'].map(op=>({value:op,label:`${OPICON[op]}<span>${OPWORD[op]}</span>`,mis:op===s.op?null:opMis(s.op,op)}))),answer:s.op,
   hint:{text:'Picture it happening. Do things get joined, taken away, put in equal groups, or shared out?'},explain:{text:`This story is about ${OPDO[s.op]}: ${s.a} ${s.op} ${s.b} = ${s.ans}.`,visual:storyVisual(s)}});},
 e=>{const s=story(pick(STORY_TYPES),true);return Q({prompt:s.text,kind:'mc',lead:'Which number sentence matches the story?',visual:storyVisual(s),options:storyOps(s),answer:s.op,
   hint:{text:'Look at the picture. What is happening to the things?'},explain:{text:`This story is about ${OPDO[s.op]}: ${s.a} ${s.op} ${s.b} = ${s.ans}.`,visual:storyVisual(s)}});},
 e=>{const s=story(pick(STORY_TYPES),e);return Q({prompt:s.text,kind:'mc',lead:'Which number sentence solves it?',options:storyOps(s),answer:s.op,
   hint:{text:'Picture the story first. Are things joined, taken away, put in equal groups, or shared?'},explain:{text:`This story is about ${OPDO[s.op]}: ${s.a} ${s.op} ${s.b} = ${s.ans}.`,visual:OPICON[s.op]}});},
],
fractions:[
 e=>{const n=pick(e?[2,3,4]:[2,3,4,5,6,8]),k=ri(1,n-1);return Q({prompt:`Shade ${fr(k,n)} of the bar.`,say:`Shade ${k} out of ${n} parts of the bar.`,kind:'build',build:{type:'shade',n,k},
   hint:{text:`The bottom number, ${n}, is how many equal parts. Shade ${k} of them.`},explain:{text:`${k}/${n} means ${k} out of ${n} equal parts.`,visual:vFracBar(n,k)}});},
 e=>{const n=pick(e?[2,3,4]:[2,3,4,5,6,8]),k=ri(1,n-1),vis=random()<.5?vFracBar(n,k):vFracCircle(n,k);const seen=new Set([`${k}/${n}`]);
   const opts: Option[]=[{value:`${k}/${n}`,label:fr(k,n)}];
   ([[n,k,'frac-flip'],[k,n-k,'frac-part-part'],[n-k,n,'frac-unshaded']] as [number,number,string][]).forEach(([a,b,m])=>{const key=`${a}/${b}`;if(!seen.has(key)){seen.add(key);opts.push({value:key,label:fr(a,b),mis:m});}});
   if(opts.length<3){const key=`${k}/${n+1}`;opts.push({value:key,label:fr(k,n+1)});}
   return Q({prompt:'What fraction is shaded?',kind:'mc',visual:vis,options:shuffle(opts),answer:`${k}/${n}`,
     hint:{text:'Count all the equal parts for the bottom number. Count the shaded parts for the top number.'},explain:{text:`There are ${n} equal parts and ${k} ${k===1?'is':'are'} shaded, so it's ${k}/${n}.`,visual:vis}});},
 e=>{if(random()<.5){let a,b;do{a=pick([2,3,4,5,6,8]);b=pick([2,3,4,5,6,8]);}while(a>=b);const first=random()<.5;
     return Q({prompt:`Which is bigger: ${first?fr(1,a):fr(1,b)} or ${first?fr(1,b):fr(1,a)}?`,say:`Which is bigger: 1 out of ${first?a:b}, or 1 out of ${first?b:a}?`,kind:'mc',
       options:[...shuffle([{value:'a',label:fr(1,a)},{value:'b',label:fr(1,b),mis:'frac-denominator'}]),{value:'same',label:'They are the same'}],answer:'a',
       hint:{text:'Picture the same bar cut into more pieces. Are the pieces bigger or smaller?'},explain:{text:`${fr(1,a)} is bigger. Cutting into ${b} pieces makes smaller pieces than cutting into ${a}.`,visual:vFracBar(a,1)+vFracBar(b,1)}});}
   const k=pick(e?[2,3,4]:[2,3,4,5]),q=ri(2,e?5:8),n=k*q;
   return Q({prompt:`What is ${fr(1,k)} of <b>${n}</b>?`,say:`What is 1 out of ${k} of ${n}?`,kind:'pad',meta:{op:'÷',a:n,b:k},answer:q,padMis:pm([[n-k,'op-sub-for-div'],[n*k,'op-mult-for-div'],[n+k,'op-add-for-div'],[q+1,'off-by-one'],[q-1,'off-by-one']],q),
     hint:{text:`${fr(1,k)} of ${n} means share ${n} into ${k} equal parts and take one part.`},explain:{text:`${n} ÷ ${k} = ${q}, so ${fr(1,k)} of ${n} is ${q}.`,visual:vPlates(k,q,'●')}});},
],
};
export function makeQuestion(skill: string, stage: Stage, easy: boolean): Question { const q = GEN[skill][stage](easy); q.skill = skill; q.stage = stage; return q; }
