// Question generators: GEN[skill][stage](easy). The 14 v1 skills keep v1's numbers, random draws and
// answers exactly; their wording is Québec French (D-21). The F-23 skills are in ./grade6.ts.
import { pick, ri, shuffle, random } from './rng';
import { ITEMS, NAMES } from './content';
import type { Option, Question, Stage } from './types';
import { Q, numOpts, pm, type Gen } from './qkit';
import { GEN6 } from './grade6';
export { numOpts, pm };
export type { Gen };
import { eq, fr, plural, rangeFor, skip, tensLabels, vArray, vBarModel, vBlocks, vFracBar, vFracCircle, vFrames, vItems, vLine, vPlace, vPlates, vSum, vTri, OPICON, OPWORD, OPDO, type Jump } from './visuals';

function jumpList(a: number, b: number, useTens: boolean, dir = 1): Jump[] { const js: Jump[] = []; let p = a; const t = useTens ? Math.floor(b / 10) : 0, o = useTens ? b % 10 : b; for (let i = 0; i < t; i++) { js.push({ from: p, to: p + 10 * dir, label: (dir > 0 ? '+' : '−') + '10' }); p += 10 * dir; } for (let i = 0; i < o; i++) { js.push({ from: p, to: p + dir, label: (dir > 0 ? '+' : '−') + '1' }); p += dir; } return js; }

// ---------- multiplication strategies ----------
const STRAT: Record<number, { name: string; tip: (n: number) => string; how: (n: number) => string; arr: (n: number) => { rows: number; parts: number[]; removed?: number } }> = {
 2:{name:'Le double',tip:n=>`Le double de ${n} : ${n} + ${n}.`,how:n=>`2 × ${n}, c’est le double de ${n} : ${n} + ${n} = ${2*n}.`,arr:n=>({rows:2,parts:[1,1]})},
 5:{name:'La moitié de 10 groupes',tip:n=>`Trouve 10 × ${n}, puis prends la moitié.`,how:n=>`10 × ${n} = ${10*n}. La moitié, c’est ${5*n}.`,arr:n=>({rows:5,parts:[5]})},
 10:{name:'Ajouter un zéro',tip:n=>`Ajoute un zéro à la fin de ${n}.`,how:n=>`10 × ${n} : on ajoute un zéro à la fin de ${n} et on obtient ${10*n}.`,arr:n=>({rows:10,parts:[10]})},
 3:{name:'2 groupes + 1 groupe de plus',tip:n=>`Trouve 2 × ${n}, puis ajoute encore ${n}.`,how:n=>`2 × ${n} = ${2*n}. Encore ${n}, ça fait ${3*n}.`,arr:n=>({rows:3,parts:[2,1]})},
 4:{name:'Le double du double',tip:n=>`Trouve 2 × ${n}, puis double-le.`,how:n=>`2 × ${n} = ${2*n}. Le double : ${4*n}.`,arr:n=>({rows:4,parts:[2,2]})},
 6:{name:'5 groupes + 1 groupe de plus',tip:n=>`Trouve 5 × ${n}, puis ajoute encore ${n}.`,how:n=>`5 × ${n} = ${5*n}. Encore ${n}, ça fait ${6*n}.`,arr:n=>({rows:6,parts:[5,1]})},
 7:{name:'5 groupes + 2 groupes de plus',tip:n=>`Trouve 5 × ${n}, puis ajoute 2 × ${n}.`,how:n=>`5 × ${n} = ${5*n} et 2 × ${n} = ${2*n}. Ensemble, ça fait ${7*n}.`,arr:n=>({rows:7,parts:[5,2]})},
 8:{name:'Le double de 4 groupes',tip:n=>`Trouve 4 × ${n}, puis double-le.`,how:n=>`4 × ${n} = ${4*n}. Le double : ${8*n}.`,arr:n=>({rows:8,parts:[4,4]})},
 9:{name:'10 groupes − 1 groupe',tip:n=>`Trouve 10 × ${n}, puis enlève un groupe de ${n}.`,how:n=>`10 × ${n} = ${10*n}. On enlève ${n} : ${9*n}.`,arr:n=>({rows:10,parts:[9],removed:1})},
};
function stratArray(k: number, n: number) {const p=STRAT[k].arr(n);return vArray(p.rows,n,{parts:p.parts,removed:p.removed||0});}
function factGen(ks: number[]): Gen[] {return [
 e=>{const k=pick(ks),n=ri(2,e?5:9);return Q({prompt:`Construis <b>${k} × ${n}</b>. Fais <b>${k}</b> rangées de <b>${n}</b>.`,say:`Construis ${k} fois ${n}. Fais ${k} rangées de ${n}.`,kind:'build',build:{type:'rows',target:k,each:n},
   followup:{prompt:`Alors, combien font ${k} × ${n}?`,say:`Alors, combien font ${k} fois ${n}?`,...numOpts(k*n,[{v:k+n,mis:'op-add-for-mult'},{v:k*n-n,mis:'fact-neighbor'},{v:k*n+n,mis:'fact-neighbor'}])},
   hint:{text:`Ajoute des rangées jusqu’à en avoir ${k}. Les nombres au bout comptent par ${n}.`},explain:{text:`${k} rangées de ${n} : ${skip(n,k)}. Donc ${k} × ${n} = ${k*n}.`,visual:vArray(k,n)}});},
 e=>{const k=pick(ks),n=ri(2,e?5:9);return Q({prompt:`Combien font <b>${k} × ${n}</b>?`,say:`Combien font ${k} fois ${n}?`,kind:'mc',visual:`${stratArray(k,n)}<p class="cap">${STRAT[k].name}</p>`,
   ...numOpts(k*n,[{v:k*n-n,mis:'fact-neighbor'},{v:k*n+n,mis:'fact-neighbor'},{v:k+n,mis:'op-add-for-mult'}]),hint:{text:STRAT[k].tip(n)},explain:{text:STRAT[k].how(n),visual:stratArray(k,n)},chart:true});},
 e=>{const k=pick(ks),n=ri(2,e?6:10);const [x,y]=random()<.5?[k,n]:[n,k];return Q({prompt:eq(`${x} × ${y}`),say:`Combien font ${x} fois ${y}?`,kind:'pad',answer:k*n,
   padMis:pm([[k+n,'op-add-for-mult'],[k*n-n,'fact-neighbor'],[k*n+n,'fact-neighbor'],[k*n-k,'fact-neighbor'],[k*n+k,'fact-neighbor'],[k*n-1,'off-by-one'],[k*n+1,'off-by-one']],k*n),
   hint:{text:STRAT[k].tip(n)},explain:{text:STRAT[k].how(n),visual:stratArray(k,n)},chart:true});},
];}

// ---------- word problems ----------
interface Story { type: string; N: string; it: { one: string; many: string; e: string }; a: number; b: number; ans: number; op: string; text: string }
const box = (n: number) => plural(n, 'boîte');
function story(type: string, small: boolean): Story {
  const P=pick(NAMES),N=P.n,it=pick(ITEMS);let a: number,b: number,ans: number,op: string,text: string;
  if(type==='join'){a=ri(small?3:14,small?9:48);b=ri(small?2:6,small?6:27);ans=a+b;op='+';text=`${N} a ${a} ${it.many}. On lui en donne ${b} de plus. Combien de ${it.many} ${N} a-t-${P.p} maintenant?`;}
  else if(type==='separate'){a=ri(small?7:24,small?14:65);b=ri(2,small?Math.min(6,a-2):a-8);ans=a-b;op='−';text=`${N} avait ${a} ${it.many} et en a donné ${b}. Combien de ${it.many} lui reste-t-il?`;}
  else if(type==='groups'){a=ri(2,small?4:9);b=ri(2,small?4:9);ans=a*b;op='×';text=`Il y a ${a} sacs. Chaque sac contient ${b} ${it.many}. Combien de ${it.many} y a-t-il en tout?`;}
  else if(type==='share'){b=ri(2,small?3:6);ans=ri(2,small?4:9);a=b*ans;op='÷';text=`${N} partage ${a} ${it.many} également entre ${b} amis. Combien de ${it.many} chaque ami reçoit-il?`;}
  else {b=ri(2,small?4:6);ans=ri(2,small?4:8);a=b*ans;op='÷';text=`On range ${a} ${it.many} dans des boîtes, ${b} par boîte. Combien de boîtes sont remplies?`;}
  void box;
  return {type,N,it,a,b,ans,op,text};
}
function storyVisual(s: Story): string {
  const e=s.it.e;
  if(s.type==='join')return `<div class="story">${vItems(s.a,e)}<span class="story-then">puis ${s.b} de plus</span>${vItems(s.b,e,0,'new')}</div>`;
  if(s.type==='separate')return vItems(s.a,e,s.b);
  if(s.type==='groups')return vPlates(s.a,s.b,e,{label:'Sac',box:true});
  if(s.type==='share')return vPlates(s.b,s.ans,e,{label:'Ami'});
  return vPlates(s.ans,s.b,e,{label:'Boîte',box:true});
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
 e=>{const n=e?ri(3,10):ri(11,19);return Q({prompt:`Montre <b>${n}</b> dans ${n>10?'les cadres':'le cadre'} de dix. Clique sur les cases pour les remplir.`,kind:'build',build:{type:'tenframe',frames:n>10?2:1,preset:0,target:n},
   hint:{text:n>10?`Un cadre de dix plein, c’est 10. Remplis un cadre, puis ajoutes-en ${n-10}.`:`Remplis d’abord la rangée du haut. Ça fait 5.`},
   explain:{text:n>10?`Un cadre plein, c’est 10. Puis ${n-10} de plus, ça fait ${n}.`:n>5?`La rangée du haut, c’est 5, et ${n-5} de plus, ça fait ${n}.`:`Voici ${n}.`,visual:vFrames(n,n>10?2:1)}});},
 e=>{const n=e?ri(4,10):ri(11,20),f=n>10?2:1;return Q({prompt:'Combien y a-t-il de jetons?',kind:'mc',visual:vFrames(n,f),...numOpts(n,[{v:n-1,mis:'off-by-one'},{v:n+1,mis:'off-by-one'},{v:n+2}]),
   hint:{text:'Un cadre de dix plein, c’est 10. Une rangée pleine, c’est 5.'},
   explain:{text:n>10?`Un cadre plein, c’est 10, et ${n-10} de plus, ça fait ${n}.`:n===10?'Le cadre est plein : c’est 10.':`Il y a ${10-n} ${plural(10-n,'case vide','cases vides')}, et 10 − ${10-n} = ${n}.`,visual:vFrames(n,f)}});},
 e=>{let t,o;do{t=ri(e?1:2,e?4:9);o=ri(1,9);}while(t===o);const x=10*t+o,y=10*o+t;let z;do{z=ri(e?12:21,e?49:98);}while(z===x||z===y||z%10===Math.floor(z/10)||z%10===0);
   const max=Math.max(x,y,z),partner=max===x?y:max===y?x:-1;
   return Q({prompt:'Quel nombre est le plus grand?',kind:'mc',options:shuffle([x,y,z].map(v=>({value:v,label:String(v),mis:v===partner?'place-swap':null}))),answer:max,
     hint:{text:'Regarde le premier chiffre. Il dit combien de dizaines.'},explain:{text:`Compare d’abord les dizaines. Si elles sont pareilles, compare les unités. ${max} est le plus grand.`,visual:vBlocks(0,Math.floor(max/10),max%10)}});},
],
numberline:[
 e=>{const max=e?10:20;let t;do{t=ri(1,max-1);}while(t%5===0);const labels=e?[0,5,10]:[0,5,10,15,20],base=Math.floor(t/5)*5;
   return Q({prompt:`Clique sur la droite pour placer le point sur <b>${t}</b>.`,kind:'build',build:{type:'nlplace',min:0,max,labels,target:t},
     hint:{text:`Trouve d’abord ${base}, puis compte ${t-base} petite${t-base>1?'s':''} ${plural(t-base,'graduation')} vers la droite.`},explain:{text:`${t}, c’est ${t-base} ${plural(t-base,'graduation')} après ${base}.`,visual:vLine({min:0,max,labels,marker:t})}});},
 e=>{if(e){let v;do{v=ri(1,19);}while(v===10);return Q({prompt:'Quel nombre la flèche montre-t-elle?',kind:'mc',visual:vLine({min:0,max:20,labels:[0,10,20],arrow:v}),...numOpts(v,[{v:v-1,mis:'off-by-one'},{v:v+1,mis:'off-by-one'},{v:v+2}]),
     hint:{text:'Chaque petite graduation compte pour 1. Pars du nombre écrit le plus proche.'},explain:{text:`Chaque graduation vaut 1. La flèche est à ${v}.`,visual:vLine({min:0,max:20,labels:[0,5,10,15,20],arrow:v})}});}
   let v;do{v=ri(1,9)*10;}while(v===50);return Q({prompt:'Quel nombre la flèche montre-t-elle?',kind:'mc',visual:vLine({min:0,max:100,tick:10,labels:[0,50,100],arrow:v}),...numOpts(v,[{v:v/10,mis:'numberline-scale'},{v:v+10,mis:'numberline-scale'},{v:v-10,mis:'numberline-scale'}]),
     hint:{text:'Il y a 10 bonds de 0 à 100 : chaque graduation compte pour 10.'},explain:{text:`Chaque graduation compte pour 10. La flèche est à ${v}.`,visual:vLine({min:0,max:100,tick:10,labels:tensLabels(0,100),arrow:v})}});},
 e=>{const kind=pick(e?['1more','1less']:['10more','10less']);let a: number,ans: number,ds: { v: number; mis?: string }[],txt: string;
   if(kind==='1more'){a=random()<.5?ri(1,9)*10-1:ri(11,88);ans=a+1;ds=[{v:a-1},{v:a+10,mis:'tens-ones-mix'},{v:a+2,mis:'off-by-one'}];txt=`Combien fait 1 de plus que <b>${a}</b>?`;}
   else if(kind==='1less'){a=random()<.5?ri(2,9)*10:ri(12,89);ans=a-1;ds=[{v:a+1},{v:a-10,mis:'tens-ones-mix'},{v:a-2,mis:'off-by-one'}];txt=`Combien fait 1 de moins que <b>${a}</b>?`;}
   else if(kind==='10more'){a=ri(11,89);ans=a+10;ds=[{v:a+1,mis:'tens-ones-mix'},{v:a-10},{v:a+20}];txt=`Combien fait 10 de plus que <b>${a}</b>?`;}
   else{a=ri(21,99);ans=a-10;ds=[{v:a-1,mis:'tens-ones-mix'},{v:a+10},{v:a-20}];txt=`Combien fait 10 de moins que <b>${a}</b>?`;}
   const step=kind.startsWith('10')?10:1,sign=kind.includes('more')?'+':'−',[lo,hi]=rangeFor(a,ans);
   return Q({prompt:txt,kind:'mc',...numOpts(ans,ds),hint:{text:step===10?'10 de plus ou de moins change le chiffre des dizaines de un. Le chiffre des unités ne change pas.':'1 de plus ou de moins change le chiffre des unités. Attention quand on passe une dizaine.'},
     explain:{text:`${a} ${sign} ${step} = ${ans}.`,visual:vLine({min:lo,max:hi,labels:tensLabels(lo,hi),jumps:[{from:a,to:ans,label:sign+step}],marker:ans})}});},
],
placevalue:[
 e=>{const target=e?ri(11,49):ri(101,299),H=Math.floor(target/100),T=Math.floor(target/10)%10,O=target%10;
   return Q({prompt:`Forme <b>${target}</b> avec des blocs.`,kind:'build',build:{type:'blocks',target,hundreds:target>=100},
     hint:{text:target>=100?`Dans ${target}, le premier chiffre, ce sont les centaines, celui du milieu, les dizaines et le dernier, les unités.`:`Dans ${target}, le premier chiffre, ce sont les dizaines et le dernier, les unités.`},
     explain:{text:`${target}, c’est ${H?`${H} ${plural(H,'centaine')}, `:''}${T} ${plural(T,'dizaine')} et ${O} ${plural(O,'unité')}.`,visual:vBlocks(H,T,O)}});},
 e=>{const h=e?0:ri(1,2);let t,o;do{t=ri(1,9);o=ri(1,9);}while(t===o);const v=h*100+t*10+o,sw=h*100+o*10+t;
   return Q({prompt:'Quel nombre ces blocs montrent-ils?',kind:'mc',visual:vBlocks(h,t,o),...numOpts(v,[{v:sw,mis:'place-swap'},{v:h+t+o,mis:'place-face'},{v:v+10}]),
     hint:{text:h?'Chaque grand carré vaut 100. Chaque bâtonnet vaut 10. Chaque petit cube vaut 1.':'Compte les bâtonnets par dizaines : 10, 20, 30… Puis ajoute les petits cubes.'},
     explain:{text:`${h?`${h} ${plural(h,'centaine')}, `:''}${t} dizaines et ${o} ${plural(o,'unité')}, ça fait ${v}.`,visual:vPlace(String(v).split('').map(Number))}});},
 e=>{if(random()<.5){let d: number[];do{d=e?[ri(1,9),ri(1,9)]:[ri(1,9),ri(1,9),ri(1,9)];}while(new Set(d).size<d.length);
     const num=Number(d.join('')),pos=e?0:ri(0,1),pv=10**(d.length-1-pos),dg=d[pos],ans=dg*pv,pname=['centaines','dizaines','unités'][3-d.length+pos];
     return Q({prompt:`Combien vaut le <b>${dg}</b> dans <b>${num}</b>?`,kind:'mc',...numOpts(ans,[dg,dg*10,dg*100].filter(x=>x!==ans).map(v=>({v,mis:'place-face'}))),
       hint:{text:'Regarde à quelle position est le chiffre : centaines, dizaines ou unités.',visual:vPlace(d)},explain:{text:`Le ${dg} est à la position des ${pname} : il vaut ${ans}.`,visual:vPlace(d,pos)}});}
   const t=ri(e?1:2,9),o=ri(0,9),v=10*t+o;
   return Q({prompt:`<b>${t}</b> dizaines et <b>${o}</b> ${plural(o,'unité')}, ça fait quel nombre?`,kind:'mc',...numOpts(v,[{v:10*o+t,mis:'place-swap'},{v:t+o,mis:'place-face'},{v:v+10}]),
     hint:{text:'Chaque dizaine vaut 10. Compte par dizaines, puis ajoute les unités.'},explain:{text:`${t} dizaines, c’est ${t*10}. On ajoute ${o} ${plural(o,'unité')} : ${v}.`,visual:vBlocks(0,t,o)}});},
],
makes10:[
 e=>{const k=ri(2,8);return Q({prompt:`Ce cadre de dix contient <b>${k}</b>. Clique sur les cases vides pour le remplir jusqu’à 10.`,kind:'build',build:{type:'tenframe',frames:1,preset:k,target:10},
   followup:{prompt:'Combien en as-tu ajouté pour faire 10?',...numOpts(10-k,[{v:k,mis:'make10-same'},{v:11-k,mis:'off-by-one'},{v:9-k,mis:'off-by-one'}])},
   hint:{text:'Remplis toutes les cases vides. Puis compte seulement celles que tu as ajoutées.'},explain:{text:`${k} et ${10-k}, ça fait 10.`,visual:vFrames(10,1,k)}});},
 e=>{if(e){const k=ri(2,8);return Q({prompt:'Combien de jetons de plus faut-il pour faire 10?',kind:'mc',visual:vFrames(k,1),...numOpts(10-k,[{v:k,mis:'make10-same'},{v:11-k,mis:'off-by-one'},{v:9-k,mis:'off-by-one'}]),
     hint:{text:'Compte les cases vides.'},explain:{text:`Il y a ${10-k} ${plural(10-k,'case vide','cases vides')}. ${k} + ${10-k} = 10.`,visual:vFrames(10,1,k)}});}
   const k=ri(11,18);return Q({prompt:'Combien de jetons de plus faut-il pour faire 20?',kind:'mc',visual:vFrames(k,2),...numOpts(20-k,[{v:k-10,mis:'make10-same'},{v:21-k,mis:'off-by-one'},{v:19-k,mis:'off-by-one'}]),
     hint:{text:'Compte les cases vides dans les deux cadres.'},explain:{text:`Il y a ${20-k} cases vides. ${k} + ${20-k} = 20.`,visual:vFrames(20,2,k)}});},
 e=>{if(e){const k=ri(1,9);return Q({prompt:`<span class="eq">${k} + <span class="blank">?</span> = 10</span>`,say:`${k} plus combien font 10?`,kind:'pad',answer:10-k,padMis:pm([[k,'make10-same'],[11-k,'off-by-one'],[9-k,'off-by-one']],10-k),
     hint:{text:'Imagine un cadre de dix. Combien de cases seraient vides?',visual:vFrames(k,1)},explain:{text:`${k} + ${10-k} = 10.`,visual:vFrames(10,1,k)}});}
   if(random()<.5){const t=ri(1,9),ans=100-10*t;return Q({prompt:`<span class="eq">${10*t} + <span class="blank">?</span> = 100</span>`,say:`${10*t} plus combien font 100?`,kind:'pad',answer:ans,padMis:pm([[10-t,'place-face'],[ans+10,'regroup'],[ans-10,'regroup']],ans),
     hint:{text:`${10*t}, c’est ${t} ${plural(t,'dizaine')}. 100, c’est 10 dizaines. Combien de dizaines de plus?`},explain:{text:`${t} ${plural(t,'dizaine')} + ${10-t} ${plural(10-t,'dizaine')} = 10 dizaines. Donc ${10*t} + ${ans} = 100.`,visual:vBlocks(0,t,0)}});}
   let a;do{a=5*ri(3,19);}while(a%10===0);const ans=100-a;
   return Q({prompt:`<span class="eq">${a} + <span class="blank">?</span> = 100</span>`,say:`${a} plus combien font 100?`,kind:'pad',answer:ans,padMis:pm([[ans+10,'regroup'],[ans-10,'regroup'],[ans+1,'off-by-one'],[ans-1,'off-by-one']],ans),
     hint:{text:`Va d’abord à la dizaine suivante : ${a} + 5 = ${a+5}. Puis compte les dizaines jusqu’à 100.`},explain:{text:`${a} + 5 = ${a+5}, et ${a+5} + ${95-a} = 100. 5 + ${95-a} = ${ans}.`,visual:vLine({min:Math.floor(a/10)*10,max:100,labels:tensLabels(Math.floor(a/10)*10,100),jumps:[{from:a,to:a+5,label:'+5'},{from:a+5,to:100,label:'+'+(95-a)}]})}});},
],
addition:[
 e=>{let a,b;if(e){a=ri(2,9);b=ri(2,8);}else{a=ri(11,59);b=ri(11,29);if(a%10===0)a++;}const target=a+b,[lo,hi]=e?[0,20]:rangeFor(a,target);
   return Q({prompt:`Pars de <b>${a}</b>. Avance de <b>${b}</b>.`,kind:'build',build:{type:'jumps',start:a,target,tens:!e},
     hint:{text:e?`Clique ${b} fois sur +1. Compte chaque bond à voix haute.`:`${b}, c’est ${Math.floor(b/10)} ${plural(Math.floor(b/10),'dizaine')} et ${b%10} ${plural(b%10,'unité')}. Fais d’abord les bonds de +10.`},
     explain:{text:`${a} + ${b} = ${target}.`,visual:vLine({min:lo,max:hi,labels:e?[0,5,10,15,20]:tensLabels(lo,hi),jumps:jumpList(a,b,!e),marker:target})}});},
 e=>{let a,b;do{a=ri(11,39);b=ri(11,29);}while(e&&(a%10)+(b%10)>=10);const s=a+b,rg=(a%10)+(b%10)>=10;
   return Q({prompt:'Mets-les ensemble. Combien y en a-t-il en tout?',kind:'mc',visual:vSum(a,b),...numOpts(s,[{v:Math.abs(a-b),mis:'op-sub-for-add'},{v:rg?s-10:s+10,mis:'regroup'},{v:s+1,mis:'off-by-one'}]),
     hint:{text:'Compte d’abord tous les bâtonnets par dizaines. Puis compte les cubes. 10 cubes font une autre dizaine.'},
     explain:{text:`${Math.floor(a/10)+Math.floor(b/10)} dizaines et ${(a%10)+(b%10)} ${plural((a%10)+(b%10),'unité')}${rg?` (c’est une dizaine de plus et ${(a%10)+(b%10)-10} ${plural((a%10)+(b%10)-10,'unité')})`:''}, ça fait ${s}.`,visual:vSum(a,b)}});},
 e=>{let a,b;if(e){a=10*ri(1,7)+ri(0,7);b=ri(1,9-a%10);}else{a=ri(15,69);b=ri(12,29);}const s=a+b,at=Math.floor(a/10),ao=a%10,bt=Math.floor(b/10),bo=b%10;
   return Q({prompt:eq(`${a} + ${b}`),say:`Combien font ${a} plus ${b}?`,kind:'pad',answer:s,padMis:pm([[Math.abs(a-b),'op-sub-for-add'],[s-10,'regroup'],[s+10,'regroup'],[s-1,'off-by-one'],[s+1,'off-by-one']],s),
     hint:{text:'Additionne les dizaines, puis les unités.',visual:vSum(a,b)},
     explain:{text:bt?`Dizaines : ${at*10} + ${bt*10} = ${(at+bt)*10}. Unités : ${ao} + ${bo} = ${ao+bo}. Ensemble : ${s}.`:`Unités : ${ao} + ${bo} = ${ao+bo}. On ajoute ${at*10} : ${s}.`,visual:vSum(a,b)}});},
],
subtraction:[
 e=>{const it=pick(ITEMS),n=e?ri(5,10):ri(11,20),k=ri(2,n-2);return Q({prompt:`Il y a <b>${n}</b> ${it.many}. Clique sur <b>${k}</b> d’entre eux pour les enlever.`,kind:'build',build:{type:'crossout',n,k,e:it.e},
   followup:{prompt:`Combien de ${it.many} reste-t-il?`,...numOpts(n-k,[{v:n+k,mis:'op-add-for-sub'},{v:n-k+1,mis:'off-by-one'},{v:n-k-1,mis:'off-by-one'}])},
   hint:{text:'Clique un à la fois en comptant.'},explain:{text:`${n}, on en enlève ${k}, il en reste ${n-k}. C’est ${n} − ${k} = ${n-k}.`,visual:vItems(n,it.e,k)}});},
 e=>{let a,b;if(e){a=ri(8,20);b=ri(2,a-3);}else{a=ri(30,90);b=ri(11,a-11);}const d=a-b,rg=(a%10)<(b%10);
   return Q({prompt:`La barre entière vaut <b>${a}</b>. Une partie vaut <b>${b}</b>. Combien vaut l’autre partie?`,kind:'mc',visual:vBarModel(a,b),...numOpts(d,[{v:a+b,mis:'op-add-for-sub'},{v:rg?d+10:d-10,mis:'regroup'},{v:d+1,mis:'off-by-one'}]),
     hint:{text:`Les deux parties ensemble font ${a}. Enlève ${b} de ${a}.`},explain:{text:`${a} − ${b} = ${d}. Vérifie : ${b} + ${d} = ${a}.`,visual:vBarModel(a,b,d)}});},
 e=>{let a,b;if(e){a=10*ri(2,9)+ri(1,9);b=ri(1,a%10);}else{a=ri(31,99);const at=Math.floor(a/10),ao=a%10;const bt=ri(1,at-1);const bo=(ao<9&&random()<.6)?ri(ao+1,9):ri(0,ao);b=10*bt+bo;}
   const d=a-b,at=Math.floor(a/10),ao=a%10,bt=Math.floor(b/10),bo=b%10,rg=ao<bo,sfl=Math.abs(at-bt)*10+Math.abs(ao-bo),[lo,hi]=rangeFor(d,a);
   return Q({prompt:eq(`${a} − ${b}`),say:`Combien font ${a} moins ${b}?`,kind:'pad',answer:d,padMis:pm([[a+b,'op-add-for-sub'],[sfl,'sub-smaller-from-larger'],[d+10,'regroup'],[d-10,'regroup'],[d+1,'off-by-one'],[d-1,'off-by-one']],d),
     hint:{text:rg?`On ne peut pas enlever ${bo} de ${ao}. Défais d’abord une dizaine en 10 unités.`:'Enlève les dizaines, puis les unités.'},
     explain:{text:rg?`${a}, c’est ${at} dizaines et ${ao} ${plural(ao,'unité')}. On défait une dizaine : ${at-1} ${plural(at-1,'dizaine')} et ${ao+10} unités. ${ao+10} − ${bo} = ${ao+10-bo}. ${at-1} − ${bt} = ${at-1-bt} ${plural(at-1-bt,'dizaine')}. Réponse : ${d}.`:`Unités : ${ao} − ${bo} = ${ao-bo}. Dizaines : ${at} − ${bt} = ${at-bt}. Réponse : ${d}.`,
       visual:vLine({min:lo,max:hi,labels:tensLabels(lo,hi),jumps:jumpList(a,b,true,-1),marker:d})}});},
],
multmeaning:[
 e=>{const a=ri(2,e?4:5),b=ri(2,e?4:5),it=pick(ITEMS);return Q({prompt:`Fais <b>${a}</b> groupes de <b>${b}</b>.`,kind:'build',build:{type:'groups',a,b,e:it.e},
   followup:{prompt:`Ça fait combien de ${it.many} en tout?`,...numOpts(a*b,[{v:a+b,mis:'op-add-for-mult'},{v:a*b-b,mis:'skip-count'},{v:a*b+b,mis:'skip-count'}])},
   hint:{text:'Les premiers boutons choisissent le nombre de groupes. Les deuxièmes, combien il y en a dans chaque groupe.'},explain:{text:`${a} groupes de ${b}, c’est ${a} × ${b} = ${a*b}. Compte par ${b} : ${skip(b,a)}.`,visual:vPlates(a,b,it.e)}});},
 e=>{const it=pick(ITEMS);if(random()<.5){let a,b;do{a=ri(3,e?4:5);b=ri(2,e?4:5);}while(a===b);
     return Q({prompt:'Qu’est-ce qui va avec l’image?',kind:'mc',visual:vPlates(a,b,it.e),options:shuffle([{value:'m',label:`${a} × ${b}`},{value:'a',label:`${a} + ${b}`,mis:'op-add-for-mult'},{value:'d',label:`${b} + ${b}`,mis:'skip-count'}]),answer:'m',
       hint:{text:`Compte les groupes. Puis compte combien il y en a dans un groupe.`},explain:{text:`Il y a ${a} groupes de ${b} : ${a} × ${b}.`,visual:vPlates(a,b,it.e)}});}
   const a=ri(2,e?4:5),b=ri(2,e?4:5);return Q({prompt:`Combien de ${it.many} en tout?`,kind:'mc',visual:vPlates(a,b,it.e),...numOpts(a*b,[{v:a+b,mis:'op-add-for-mult'},{v:a*b-b,mis:'skip-count'},{v:a*b+1,mis:'off-by-one'}]),
     hint:{text:`Compte par ${b}, un groupe à la fois.`},explain:{text:`${a} groupes de ${b} : ${skip(b,a)}. C’est ${a} × ${b} = ${a*b}.`,visual:vPlates(a,b,it.e)}});},
 e=>{const a=ri(2,e?5:6),b=ri(2,e?5:6);if(random()<.5){const mx=Math.max(a,b),mn=Math.min(a,b);
     return Q({prompt:`Qu’est-ce qui veut dire la même chose que <b>${a} × ${b}</b>?`,say:`Qu’est-ce qui veut dire la même chose que ${a} fois ${b}?`,kind:'mc',options:shuffle([{value:'g',label:`${a} groupes de ${b}`},{value:'a',label:`${a} et ${b} mis ensemble`,mis:'op-add-for-mult'},{value:'s',label:`${mx}, on enlève ${mn}`},{value:'d',label:`${a} partagés en ${b} groupes`}]),answer:'g',
       hint:{text:'× veut dire « groupes de ».'},explain:{text:`${a} × ${b} veut dire ${a} groupes de ${b}.`,visual:vPlates(a,b,'●')}});}
   return Q({prompt:`Combien font <b>${a}</b> groupes de <b>${b}</b>?`,kind:'pad',answer:a*b,padMis:pm([[a+b,'op-add-for-mult'],[a*b-b,'skip-count'],[a*b+b,'skip-count'],[a*b-1,'off-by-one'],[a*b+1,'off-by-one']],a*b),
     hint:{text:`Compte par ${b}, ${a} fois.`},explain:{text:`${a} groupes de ${b} : ${skip(b,a)}. Donc ${a} × ${b} = ${a*b}.`,visual:vPlates(a,b,'●')}});},
],
multeasy:factGen([2,5,10]),
multmid:factGen([3,4]),
multhard:factGen([6,7,8,9]),
divmeaning:[
 e=>{let k,q;do{k=ri(2,e?3:4);q=ri(2,e?4:5);}while(k===2&&q===2);const n=k*q,it=pick(ITEMS);
   return Q({prompt:`Partage <b>${n}</b> ${it.many} également sur <b>${k}</b> assiettes. Clique sur une assiette pour y déposer ${it.un} ${it.one}.`,kind:'build',meta:{op:'÷',a:n,b:k},build:{type:'share',n,k,e:it.e},
     followup:{prompt:`Combien de ${it.many} y a-t-il sur chaque assiette?`,...numOpts(q,[{v:n-k,mis:'op-sub-for-div'},{v:n+k,mis:'op-add-for-div'},{v:q+1,mis:'off-by-one'}])},
     hint:{text:'Fais le tour des assiettes une à la fois, comme quand on distribue des cartes.'},explain:{text:`${n} partagés également sur ${k} assiettes, c’est ${q} chacune. C’est ${n} ÷ ${k} = ${q}.`,visual:vPlates(k,q,it.e)}});},
 e=>{let k,q;do{k=ri(2,e?3:4);q=ri(2,e?4:5);}while(k===2&&q===2);const n=k*q,it=pick(ITEMS);
   if(random()<.6)return Q({prompt:`On a partagé ${n} ${it.many} également sur ${k} assiettes. Quelle phrase mathématique va avec?`,kind:'mc',meta:{op:'÷',a:n,b:k},visual:vPlates(k,q,it.e),
     options:shuffle([{value:'div',label:`${n} ÷ ${k} = ${q}`},{value:'sub',label:`${n} − ${k} = ${n-k}`,mis:'op-sub-for-div'},{value:'add',label:`${n} + ${k} = ${n+k}`,mis:'op-add-for-div'},{value:'mul',label:`${n} × ${k} = ${n*k}`,mis:'op-mult-for-div'}]),answer:'div',
     hint:{text:'Partager également, c’est diviser. Cherche le ÷.'},explain:{text:`Partager ${n} sur ${k} assiettes donne ${q} sur chacune, donc ${n} ÷ ${k} = ${q}. Le signe ÷ veut dire « partagé également en ».`,visual:vPlates(k,q,it.e)}});
   return Q({prompt:`On a partagé ${n} ${it.many} également sur ${k} assiettes. Combien y en a-t-il sur chaque assiette?`,kind:'mc',meta:{op:'÷',a:n,b:k},visual:vPlates(k,q,it.e),...numOpts(q,[{v:n-k,mis:'op-sub-for-div'},{v:n+k,mis:'op-add-for-div'},{v:q+1,mis:'off-by-one'}]),
     hint:{text:'Compte les objets sur une seule assiette.'},explain:{text:`Chaque assiette en a ${q}. ${n} ÷ ${k} = ${q}.`,visual:vPlates(k,q,it.e)}});},
 e=>{let k,q;do{k=ri(2,e?3:5);q=ri(2,e?5:6);}while(k===2&&q===2);const n=k*q;
   if(random()<.5)return Q({prompt:`Que veut dire <b>${n} ÷ ${k}</b>?`,say:`Que veut dire ${n} divisé par ${k}?`,kind:'mc',meta:{op:'÷',a:n,b:k},
     options:shuffle([{value:'s',label:`Partager ${n} en ${k} groupes égaux`},{value:'t',label:`Enlever ${k} de ${n}`,mis:'op-sub-for-div'},{value:'p',label:`Mettre ${n} et ${k} ensemble`,mis:'op-add-for-div'},{value:'g',label:`${n} groupes de ${k}`,mis:'op-mult-for-div'}]),answer:'s',
     hint:{text:'÷ veut dire « partagé également en ».'},explain:{text:`${n} ÷ ${k} veut dire partager ${n} en ${k} groupes égaux. Chaque groupe en reçoit ${q}.`,visual:vPlates(k,q,'●')}});
   return Q({prompt:eq(`${n} ÷ ${k}`),say:`Combien font ${n} divisé par ${k}?`,kind:'mc',meta:{op:'÷',a:n,b:k},...numOpts(q,[{v:n-k,mis:'op-sub-for-div'},{v:n+k,mis:'op-add-for-div'},{v:n*k,mis:'op-mult-for-div'}]),
     hint:{text:`Imagine ${n} objets partagés sur ${k} assiettes.`},explain:{text:`On partage ${n} en ${k} groupes égaux : chacun en reçoit ${q}. Donc ${n} ÷ ${k} = ${q}.`,visual:vPlates(k,q,'●')}});},
],
divfacts:[
 e=>{const k=ri(2,e?3:5),q=ri(2,e?4:6),n=k*q,it=pick(ITEMS);return Q({prompt:`Mets <b>${n}</b> ${it.many} en groupes de <b>${k}</b>. Clique sur « Faire un groupe » jusqu’à ce qu’il n’en reste plus.`,kind:'build',meta:{op:'÷',a:n,b:k},build:{type:'makegroups',n,k,e:it.e},
   followup:{prompt:'Combien de groupes as-tu faits?',...numOpts(q,[{v:n-k,mis:'op-sub-for-div'},{v:n+k,mis:'op-add-for-div'},{v:q+1,mis:'off-by-one'}])},
   hint:{text:'Chaque clic enlève un groupe. Continue jusqu’à ce qu’il n’en reste plus.'},explain:{text:`Chaque groupe en a enlevé ${k}. Tu l’as fait ${q} fois, donc ${n} ÷ ${k} = ${q}.`,visual:vPlates(q,k,it.e,{box:true})}});},
 e=>{const k=ri(2,e?5:9),q=ri(2,e?5:9),n=k*q;return Q({prompt:`<b>${k} × ${q} = ${n}</b>. Alors, combien font <b>${n} ÷ ${k}</b>?`,say:`${k} fois ${q} égale ${n}. Alors, combien font ${n} divisé par ${k}?`,kind:'mc',meta:{op:'÷',a:n,b:k},visual:vTri(n,k,q,'r'),
   ...numOpts(q,[{v:n-k,mis:'op-sub-for-div'},{v:n*k,mis:'op-mult-for-div'},{v:q+1,mis:'fact-neighbor'}]),
   hint:{text:`La division défait la multiplication. ${k} fois combien font ${n}?`},explain:{text:`${k} × ${q} = ${n}, donc ${n} ÷ ${k} = ${q}. Ils sont dans la même famille de faits.`,visual:vTri(n,k,q,null)}});},
 e=>{const k=ri(2,e?5:10),q=ri(2,e?5:10),n=k*q;return Q({prompt:eq(`${n} ÷ ${k}`),say:`Combien font ${n} divisé par ${k}?`,kind:'pad',meta:{op:'÷',a:n,b:k},answer:q,padMis:pm([[n-k,'op-sub-for-div'],[n+k,'op-add-for-div'],[n*k,'op-mult-for-div'],[q-1,'fact-neighbor'],[q+1,'fact-neighbor']],q),
   hint:{text:`Pense : ${k} fois combien font ${n}?`},explain:{text:`${k} × ${q} = ${n}, donc ${n} ÷ ${k} = ${q}.`,visual:vTri(n,k,q,null)},chart:true});},
],
whichop:[
 e=>{const s=story(pick(STORY_TYPES),true);return Q({prompt:s.text,kind:'mc',lead:'Que se passe-t-il dans cette histoire?',
   options:shuffle(['+','−','×','÷'].map(op=>({value:op,label:`${OPICON[op]}<span>${OPWORD[op]}</span>`,mis:op===s.op?null:opMis(s.op,op)}))),answer:s.op,
   hint:{text:'Imagine la scène. Est-ce qu’on réunit, on enlève, on fait des groupes égaux ou on partage?'},explain:{text:`Dans cette histoire, on doit ${OPDO[s.op]} : ${s.a} ${s.op} ${s.b} = ${s.ans}.`,visual:storyVisual(s)}});},
 e=>{const s=story(pick(STORY_TYPES),true);return Q({prompt:s.text,kind:'mc',lead:'Quelle phrase mathématique va avec l’histoire?',visual:storyVisual(s),options:storyOps(s),answer:s.op,
   hint:{text:'Regarde l’image. Qu’est-ce qui arrive aux objets?'},explain:{text:`Dans cette histoire, on doit ${OPDO[s.op]} : ${s.a} ${s.op} ${s.b} = ${s.ans}.`,visual:storyVisual(s)}});},
 e=>{const s=story(pick(STORY_TYPES),e);return Q({prompt:s.text,kind:'mc',lead:'Quelle phrase mathématique le résout?',options:storyOps(s),answer:s.op,
   hint:{text:'Imagine d’abord l’histoire. Est-ce qu’on réunit, on enlève, on fait des groupes égaux ou on partage?'},explain:{text:`Dans cette histoire, on doit ${OPDO[s.op]} : ${s.a} ${s.op} ${s.b} = ${s.ans}.`,visual:OPICON[s.op]}});},
],
fractions:[
 e=>{const n=pick(e?[2,3,4]:[2,3,4,5,6,8]),k=ri(1,n-1);return Q({prompt:`Colorie ${fr(k,n)} de la bande.`,say:`Colorie ${k} parties sur ${n} de la bande.`,kind:'build',build:{type:'shade',n,k},
   hint:{text:`Le nombre du bas, ${n}, dit combien de parties égales. Colories-en ${k}.`},explain:{text:`${k}/${n} veut dire ${k} parties sur ${n} parties égales.`,visual:vFracBar(n,k)}});},
 e=>{const n=pick(e?[2,3,4]:[2,3,4,5,6,8]),k=ri(1,n-1),vis=random()<.5?vFracBar(n,k):vFracCircle(n,k);const seen=new Set([`${k}/${n}`]);
   const opts: Option[]=[{value:`${k}/${n}`,label:fr(k,n)}];
   ([[n,k,'frac-flip'],[k,n-k,'frac-part-part'],[n-k,n,'frac-unshaded']] as [number,number,string][]).forEach(([a,b,m])=>{const key=`${a}/${b}`;if(!seen.has(key)){seen.add(key);opts.push({value:key,label:fr(a,b),mis:m});}});
   if(opts.length<3){const key=`${k}/${n+1}`;opts.push({value:key,label:fr(k,n+1)});}
   return Q({prompt:'Quelle fraction est coloriée?',kind:'mc',visual:vis,options:shuffle(opts),answer:`${k}/${n}`,
     hint:{text:'Compte toutes les parties égales pour le nombre du bas. Compte les parties coloriées pour le nombre du haut.'},explain:{text:`Il y a ${n} parties égales et ${k} ${k===1?'est coloriée':'sont coloriées'} : c’est ${k}/${n}.`,visual:vis}});},
 e=>{if(random()<.5){let a,b;do{a=pick([2,3,4,5,6,8]);b=pick([2,3,4,5,6,8]);}while(a>=b);const first=random()<.5;
     return Q({prompt:`Lequel est le plus grand : ${first?fr(1,a):fr(1,b)} ou ${first?fr(1,b):fr(1,a)}?`,say:`Lequel est le plus grand : 1 sur ${first?a:b}, ou 1 sur ${first?b:a}?`,kind:'mc',
       options:[...shuffle([{value:'a',label:fr(1,a)},{value:'b',label:fr(1,b),mis:'frac-denominator'}]),{value:'same',label:'Ils sont pareils'}],answer:'a',
       hint:{text:'Imagine la même bande coupée en plus de morceaux. Les morceaux sont-ils plus grands ou plus petits?'},explain:{text:`${fr(1,a)} est plus grand. Couper en ${b} morceaux fait des morceaux plus petits que couper en ${a}.`,visual:vFracBar(a,1)+vFracBar(b,1)}});}
   const k=pick(e?[2,3,4]:[2,3,4,5]),q=ri(2,e?5:8),n=k*q;
   return Q({prompt:`Combien fait ${fr(1,k)} de <b>${n}</b>?`,say:`Combien fait 1 sur ${k} de ${n}?`,kind:'pad',meta:{op:'÷',a:n,b:k},answer:q,padMis:pm([[n-k,'op-sub-for-div'],[n*k,'op-mult-for-div'],[n+k,'op-add-for-div'],[q+1,'off-by-one'],[q-1,'off-by-one']],q),
     hint:{text:`${fr(1,k)} de ${n}, c’est partager ${n} en ${k} parties égales et en prendre une.`},explain:{text:`${n} ÷ ${k} = ${q}, donc ${fr(1,k)} de ${n}, c’est ${q}.`,visual:vPlates(k,q,'●')}});},
],
};
Object.assign(GEN, GEN6);
export function makeQuestion(skill: string, stage: Stage, easy: boolean): Question { const q = GEN[skill][stage](easy); q.skill = skill; q.stage = stage; return q; }
