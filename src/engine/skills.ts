// Skill map (spec F-2, F-23, section 12). All skills, lines and prerequisites live here.
// Québec French (D-21). Ids are unchanged from v1 so saves and tests stay stable.
import type { Skill } from './types';

/** Level names (F-3): hands-on, pictures, numbers. */
export const STAGES = ['Matériel', 'Images', 'Nombres'] as const;
/** "… with …" phrasing for messages. */
export const STAGE_WITH = ['avec le matériel', 'avec des images', 'seulement avec des nombres'] as const;

export const SKILLS: Skill[] = [
  { id: 'quantity', name: 'Voir les quantités', group: 'Sens du nombre', pre: [], about: 'Reconnaître des quantités dans des cadres de dix et comparer des nombres à 2 chiffres.', kid: 'Voir combien il y en a sans tout compter un par un, et comparer des nombres.' },
  { id: 'numberline', name: 'La droite numérique', group: 'Sens du nombre', pre: ['quantity'], about: 'Placer et lire des nombres sur une droite numérique; 1 de plus ou de moins, 10 de plus ou de moins.', kid: 'Trouver des nombres sur une droite numérique.' },
  { id: 'placevalue', name: 'Dizaines et unités', group: 'Sens du nombre', pre: ['quantity'], about: 'Valeur de position : former des nombres avec des centaines, des dizaines et des unités.', kid: 'Former des nombres avec des centaines, des dizaines et des unités.' },
  { id: 'makes10', name: 'Faire 10', group: 'Sens du nombre', pre: ['quantity'], about: 'Compléments à 10, à 20 et à 100.', kid: 'Trouver ce qui manque pour faire 10, 20 et 100.' },
  { id: 'addition', name: 'Additionner', group: 'Additionner et soustraire', pre: ['numberline', 'placevalue', 'makes10'], about: 'L’addition comme réunion, avec des bonds sur la droite numérique et les dizaines et unités.', kid: 'Mettre des groupes ensemble et trouver le total.' },
  { id: 'subtraction', name: 'Soustraire', group: 'Additionner et soustraire', pre: ['addition'], about: 'La soustraction comme retrait et comme partie manquante, avec emprunt.', kid: 'Enlever et trouver ce qui reste.' },
  { id: 'multmeaning', name: 'Groupes égaux', group: 'Multiplier', pre: ['addition'], about: 'Le sens de la multiplication : des groupes égaux et des rangées.', kid: 'Multiplier, c’est faire des groupes égaux. Apprends à les voir.' },
  { id: 'multeasy', name: '× 2, 5, 10', group: 'Multiplier', pre: ['multmeaning'], about: 'Les tables de 2, 5 et 10 : le double, la moitié de 10 fois, ajouter un zéro.', kid: 'Les tables de 2, 5 et 10 avec des trucs.' },
  { id: 'multmid', name: '× 3 et 4', group: 'Multiplier', pre: ['multeasy'], about: 'Les tables de 3 et 4, construites à partir de × 2.', kid: 'Les tables de 3 et 4, à partir de × 2.' },
  { id: 'multhard', name: '× 6 à 9', group: 'Multiplier', pre: ['multmid'], about: 'Les tables de 6 à 9, construites à partir de × 5 et × 10.', kid: 'Les tables de 6 à 9, à partir de × 5 et × 10.' },
  { id: 'divmeaning', name: 'Partager également', group: 'Diviser', pre: ['multmeaning', 'subtraction'], about: 'Le sens de la division : partager en groupes égaux (et la différence avec enlever).', kid: 'Diviser, c’est partager en groupes égaux.' },
  { id: 'divfacts', name: 'Faits de division', group: 'Diviser', pre: ['divmeaning', 'multeasy'], about: 'La division comme l’inverse de la multiplication (familles de faits).', kid: 'Utiliser les tables pour diviser.' },
  { id: 'whichop', name: 'Quelle opération?', group: 'Résoudre des problèmes', pre: ['divmeaning', 'subtraction'], about: 'Lire un problème et choisir +, −, × ou ÷ selon ce qui se passe dans l’histoire.', kid: 'Lire un problème et choisir +, −, × ou ÷.' },
  { id: 'fractions', name: 'Fractions', group: 'Résoudre des problèmes', pre: ['divmeaning'], about: 'Les fractions comme parties égales d’un tout, les fractions unitaires et la fraction d’un nombre.', kid: 'Des parties égales d’un tout.' },
  // ----- F-23: 6e année (D-23) -----
  { id: 'grandsnombres', name: 'Grands nombres', group: 'Grands nombres et décimaux', pre: ['placevalue'], about: 'Nombres naturels jusqu’à 999 999 : valeur d’un chiffre, unités de mille et dizaines de mille, composer et comparer.', kid: 'Lire et former des nombres jusqu’à 999 999.', pda: 'Nombres naturels inférieurs à 1 000 000 : lire, écrire, représenter, décomposer, comparer (6e année).' },
  { id: 'puissances', name: '× et ÷ par 10, 100, 1000', group: 'Grands nombres et décimaux', pre: ['grandsnombres', 'multeasy'], about: 'Multiplier et diviser par 10, 100 et 1000; les puissances de 10, de 10⁰ à 10³.', kid: 'Faire glisser les chiffres dans le tableau quand on multiplie ou divise par 10, 100 ou 1000.', pda: 'Multiplier et diviser par 10, 100, 1000; exposants (puissances de 10) (6e année).' },
  { id: 'decimaux', name: 'Dixièmes, centièmes, millièmes', group: 'Grands nombres et décimaux', pre: ['puissances', 'fractions'], about: 'Valeur de position des nombres décimaux jusqu’aux millièmes, 1/10 = 0,1, décomposer de deux façons, regrouper (825 dixièmes), comparer.', kid: 'Comprendre les chiffres après la virgule.', pda: 'Nombres décimaux jusqu’à la position des millièmes : lire, écrire, représenter, décomposer, comparer (6e année).' },
  { id: 'arrondir', name: 'Arrondir et estimer', group: 'Grands nombres et décimaux', pre: ['decimaux'], about: 'Arrondir des nombres naturels et décimaux; faire une approximation d’un produit pour valider un résultat.', kid: 'Trouver un nombre rond proche pour vérifier une réponse.', pda: 'Arrondir des nombres naturels et décimaux; approximer le résultat d’une opération (6e année).' },
  { id: 'addcol', name: 'Additionner en colonnes', group: 'Calcul écrit', pre: ['addition', 'grandsnombres'], about: 'L’addition en colonnes avec retenues, jusqu’à 6 chiffres.', kid: 'Additionner de grands nombres en colonnes, avec les retenues.', pda: 'Additionner des nombres naturels (processus personnels et conventionnels) (6e année).' },
  { id: 'multcol', name: 'Multiplier en colonnes', group: 'Calcul écrit', pre: ['multhard', 'addcol'], about: 'La multiplication en colonnes : 2 ou 3 chiffres × 1 chiffre, puis × 2 chiffres avec le zéro du deuxième produit.', kid: 'Multiplier de grands nombres en colonnes.', pda: 'Multiplier un nombre à 3 chiffres par un nombre à 2 chiffres (processus conventionnel) (6e année).' },
  { id: 'multdec', name: 'Multiplier des décimaux', group: 'Calcul écrit', pre: ['multcol', 'decimaux', 'arrondir'], about: 'Décimal × naturel et décimal × décimal : multiplier comme des naturels, compter les chiffres après la virgule, vérifier avec une approximation.', kid: 'Multiplier des nombres à virgule et placer la virgule au bon endroit.', pda: 'Multiplier des nombres décimaux dont le produit ne dépasse pas les millièmes (6e année).' },
  { id: 'probdec', name: 'Problèmes avec décimaux', group: 'Calcul écrit', pre: ['multdec', 'whichop'], about: 'Problèmes avec des décimaux : « fois plus », « fois moins », argent, longueurs, heures en décimaux, deux étapes.', kid: 'Résoudre des problèmes avec des nombres à virgule.', pda: 'Résoudre des situations-problèmes avec des nombres décimaux (6e année).' },
];
export const SK: Record<string, Skill> = Object.fromEntries(SKILLS.map(s => [s.id, s]));
export const GROUPS = ['Sens du nombre', 'Additionner et soustraire', 'Multiplier', 'Diviser', 'Résoudre des problèmes', 'Grands nombres et décimaux', 'Calcul écrit'];
/** Teaching order, also the v1 placement ladder (first 14) extended with F-23. */
export const LADDER = ['quantity', 'numberline', 'placevalue', 'makes10', 'addition', 'subtraction', 'multmeaning', 'multeasy', 'divmeaning', 'multmid', 'whichop', 'divfacts', 'fractions', 'multhard',
  'grandsnombres', 'addcol', 'puissances', 'multcol', 'decimaux', 'arrondir', 'multdec', 'probdec'];
/** The 14 v1 skills (placement ladder for v1 saves). */
export const V1_LADDER = LADDER.slice(0, 14);
/** F-8.AC-4: the warm-up aims at these and steps back (her workbook themes). */
export const GRADE_TARGETS = ['decimaux', 'multdec', 'probdec'];
