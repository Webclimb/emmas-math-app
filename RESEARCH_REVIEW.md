# Number Sky: research review and gameplay decisions

Date: 2026-11-20. Scope: does the v1 build match what the evidence says works for dyscalculia, and what should change?

## Verdict

The foundation is sound and stays. The gameplay loop needs to change in seven places before more content is added. The biggest gap is that v1 is a practice-and-feedback app, while the strongest evidence is for explicit, systematic instruction: it tests and corrects, but it never teaches first.

One limit applies to everything below. Most trials are with children in about grades 2 to 5. The German clinical guideline says suitable programs for older adolescents are still missing [1]. For a 12-year-old we are extrapolating from younger children, so the build includes its own progress checks (D-11) to show whether it is working for her.

## What the evidence says

| # | Finding | Source | Confidence |
|---|---|---|---|
| E1 | Practising the actual maths content beats training general skills such as working memory. Pooled effect about g = 0.52 across intervention trials; smaller for number processing (0.30), larger for arithmetic (0.44) and word problems (0.47). | Haberstroh & Schulte-Körne 2019 [1] | High (guideline meta-analysis) |
| E2 | Help should target the individual child's problem areas, ideally delivered one-to-one by a trained specialist. Reading difficulties, attention difficulties and anxiety often co-occur and affect results. | [1] | High |
| E3 | Six practices for struggling learners: systematic instruction, precise mathematical language, well-chosen concrete and semi-concrete representations tied to notation, number lines, word problems taught by problem type, and regular timed activities for fluency. Evidence for systematic instruction and timed activities is rated strong. | IES / What Works Clearinghouse practice guide 2021 [2] | High. I confirmed the "strong" rating for recommendations 1 and 6 only. |
| E4 | Timed activities belong on already-learned content, after the child has an efficient strategy, with immediate feedback. | [2] | High |
| E5 | Word problems: teach one problem type at a time. Start with a complete story (no unknown), then the same story with a missing quantity. | [2] | High |
| E6 | Number lines should carry through to fractions and decimals in the upper elementary grades. | [2] | High |
| E7 | Fact fluency: teach strategies explicitly, use well-structured retrieval practice, and bring in time-limited practice only once answers are accurate. Low-stakes timed practice is different from high-stakes timed tests. Starting with 2×, 5× and 10× supports derived strategies; grouping dissimilar facts reduces interference. | McNeil, Jordan, Viegut & Ansari 2025 [3] | High (major research synthesis) |
| E8 | A small 2024 study found timing itself did not raise reported anxiety; task difficulty did. The NCTM position still opposes timed tests. Contested. | Maki et al. 2024, via [4] [5] | Low to medium (one study, 113 students) |
| E9 | The best-tested adaptive program for dyscalculia (Calcularis 2.0) used 20-minute sessions, 4 to 5 times a week for 12 weeks. Arithmetic and number-line skills improved and held at 3 months. Children with high maths anxiety or a reading/spelling disorder gained less. The longer 12-week version gave sturdier effects than the earlier 6-week one. | Kohn et al. 2020 [6] | Medium (one RCT, 67 children, grades 2 to 5) |
| E10 | Calcularis models about 100 skills as a prerequisite graph in a dynamic Bayesian network, so evidence on one skill updates related skills. It also keeps a library of typical error patterns with matched remediation. | Käser et al. 2013 [7] | Design reference, not an outcome finding |
| E11 | Across interventions for children with maths difficulties, direct or assisted instruction, basic arithmetic content and one-to-one settings worked. Computer versus face-to-face delivery did not change the effect. | Chodura, Kuhn & Holling 2015 [8] | Medium to high |
| E12 | For students with learning disabilities, explicit instruction (g about 1.22) and having students verbalise their reasoning (g about 1.04) were the strongest instructional components; visual representations and careful sequencing of examples also helped. | Gersten et al. 2009 [9] | High, but effects vary widely between studies |
| E13 | Serious games for dyscalculia mostly report gains, but the studies are weak: only about half use pre/post designs with effect sizes, few are adaptive, and few examine usability. Sessions of 20 minutes or less are recommended. | Systematic review, 2025 [10] | Medium |
| E14 | Virtual manipulatives work. A meta-analysis found a moderate effect, and app-based base-ten blocks were effective for middle-school students with disabilities, for whom physical blocks can feel too young. | [11] [12] | Medium |
| E15 | Symbolic number training improved arithmetic more than non-symbolic (dot-comparison) training, and a prominent claim that approximate-number training transfers to arithmetic failed to replicate. | Honoré & Noël 2016 [13]; replication failure [14] | Medium |
| E16 | Mixing problem types in practice (interleaving) nearly doubled delayed test scores in a grade 7 classroom trial (61% versus 38%). It forces the student to choose the operation, and it spaces practice. | Rohrer et al. 2020 [15] | High for typical learners; not tested specifically in dyscalculia |
| E17 | Gamification raises motivation in K-12 (g about 0.65), more for extrinsic than intrinsic motivation. Designs that support autonomy and a sense of competence last longer than points alone. | Kurnaz 2025 [16] | Medium |
| E18 | Children with dyscalculia show more maths anxiety, and the two feed each other. | Rubinsten & Tannock 2010 [17] | Medium |
| E19 | Ontario Grade 7 expects fraction/decimal/percent conversion, rational numbers on number lines, and integer addition and subtraction. | Ontario curriculum 2020 [18] | High |

## How v1 compares

| v1 design choice | Evidence | Assessment |
|---|---|---|
| Three levels per skill: hands-on, pictures, numbers | E3, E12, E14 | Keep. Virtual manipulatives are supported, including for older students. |
| Practises real maths content, not brain training | E1, E15 | Keep. No dot-comparison or memory games. |
| Prerequisite map, steps back to an earlier skill | E2, E10 | Keep, but the model treats each skill separately (see D-8). |
| Error-pattern detection with targeted explanation | E10 | Keep and extend. |
| Immediate feedback that shows the maths | E3, E4 | Keep. |
| Times tables taught by strategy (double, ×10 − 1 group) | E7 | Keep. Add the retrieval and fluency stages that should follow. |
| "No timers, ever" | E3, E4, E7, E8, E18 | Change. Evidence supports brief timed practice after accuracy. Evidence on anxiety is mixed, so it must be optional and low-stakes. |
| Practice starts with a question, not a lesson | E3, E12 | Gap. No explicit instruction or worked examples. This is the largest gap. |
| Hands-on and picture levels rarely show the number sentence | E3 | Gap. Representations must be tied to notation at every level. |
| "Which operation?" asks only which operation fits | E5 | Gap. No problem types, no complete-story step, no missing-start or missing-change problems, no comparison problems. |
| Number line used for whole numbers only; fractions shown as bars and circles | E6 | Gap. |
| One review question in four, picked by least recently seen | E16 | Partial. No spacing schedule; little mixing of operations. |
| 10 questions per session, about 6 to 9 minutes, no weekly target | E9, E13 | Under-dosed. Tested programs use 15 to 20 minutes, 4 to 5 days a week. |
| Multiple choice at the "numbers" level for several skills | E7 | Weak. Guessing inflates the mastery estimate; retrieval needs a typed answer. |
| A star lights after three correct answers in one sitting | E7, E9 | Weak. Mastery should survive a delay. |
| No verbalising, no vocabulary teaching | E3, E12 | Gap. |
| Gems, shop, cartoon buddies, cookie emoji | E14, E17 | Partial. Rewards are fine if they stay cosmetic and choice-driven. The look is too young for a 12-year-old. |
| No measure of whether she is actually improving | E13 | Gap. |
| Whole numbers and simple fractions only | E19 | Gap versus grade level. Lower priority than fixing the loop. |

## Decisions

Each decision is implemented by features in `SPEC.md`. D-1 to D-7 change the gameplay loop. D-8 to D-13 follow.

| ID | Decision | Why | Spec |
|---|---|---|---|
| D-1 | Teach before practice. Each skill level opens with a short worked example: watch, do one together, then practise. It replays after a step down and on request. | E3, E12 | F-4 |
| D-2 | Tie every representation to its number sentence. A live number-sentence strip sits beside each manipulative and picture. | E3 | F-3 |
| D-3 | Add a facts track with three stages per fact: strategy, untimed recall, then optional short timed rounds. Timed rounds unlock only after accuracy, compare her only with her own best, and can be skipped or switched off. Track each fact, not each table. | E4, E7, E8, E18 | F-10, F-16 |
| D-4 | Rebuild word problems around problem types, starting from complete stories, with diagrams, then missing quantities in every position. | E5 | F-11 |
| D-5 | Make the number line a through-line: estimation on bare lines, then fractions and decimals. | E6 | F-12 |
| D-6 | Schedule review on expanding intervals and mix operations once two are known. Mixed practice directly targets the subtract-instead-of-divide error. | E16 | F-9 |
| D-7 | Move to time-based sessions of 15 minutes (10 or 20 selectable) with a goal of 4 days a week, shown without streak penalties. | E9, E13 | F-14 |
| D-8 | Let evidence flow along the prerequisite map, place her by strand instead of one ladder, use typed answers at the numbers level, and require a next-day check before a star lights. | E2, E7, E10 | F-5, F-7, F-8 |
| D-9 | Add precise vocabulary and "say it" sentence prompts. | E3, E12 | F-13 |
| D-10 | Redesign for a 12-year-old. Keep rewards cosmetic, add choice, praise strategy and effort. | E14, E17 | F-15, design brief |
| D-11 | Add a 5-minute check-up every two weeks with comparable questions, charted for the grown-up. If three check-ups show no gain, say so and point to the teacher or a specialist. | E13, limit on age | F-18 |
| D-12 | Keep the adult in the loop: shareable report, real-object activities, clear statement that the app supplements instruction. | E2, E11 | F-17 |
| D-13 | Extend content toward grade level (decimals, percent, integers, ratio, money, time) after the loop is fixed. | E19 | F-21 |

Rejected on evidence: dot-comparison "number sense" games (E15), working-memory or attention training (E1), leaderboards or competition against others (E17, E18), streak-loss mechanics (E18).

## What I could not confirm

- I read abstracts and extracted passages, not every full text. Effect sizes are as reported in those passages.
- The IES guide's evidence rating for recommendations 2 to 5. I confirmed "strong" for 1 and 6.
- A "2 to 10 minutes, several times a week" figure for fact practice. It was reported by a secondary source describing [3]; treat it as a starting point.
- No trial has tested Number Sky. Its question generators and adaptive rules were checked by automated tests and simulated learners only.

## Sources

1. Haberstroh S, Schulte-Körne G. The Diagnosis and Treatment of Dyscalculia. Dtsch Arztebl Int, 2019. https://pmc.ncbi.nlm.nih.gov/articles/PMC6440373
2. Fuchs LS et al. Assisting Students Struggling with Mathematics: Intervention in the Elementary Grades (WWC 2021006). IES, 2021. https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC2021006-Math-PG.pdf (summary: https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/WWC-PraxGuide-Elementary-Math-Summary-508c.pdf)
3. McNeil NM, Jordan NC, Viegut AA, Ansari D. What the Science of Learning Teaches Us About Arithmetic Fluency. Psychological Science in the Public Interest, 2025. https://journals.sagepub.com/doi/10.1177/15291006241287726
4. Education Week. Do Timed Tasks Really Worsen Math Anxiety? 2024. https://www.edweek.org/teaching-learning/do-timed-tasks-really-worsen-math-anxiety/2024/08
5. LD@School (Ontario). The Importance of Math Fact Fluency. https://www.ldatschool.ca/the-importance-of-math-fact-fluency-evidence-informed-classroom-practices
6. Kohn J et al. Efficacy of a Computer-Based Learning Program in Children With Developmental Dyscalculia. Frontiers in Psychology, 2020. https://pmc.ncbi.nlm.nih.gov/articles/PMC7373797
7. Käser T et al. Design and evaluation of the computer-based training program Calcularis. Frontiers in Psychology, 2013. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2013.00489/full
8. Chodura S, Kuhn JT, Holling H. Interventions for Children With Mathematical Difficulties: A Meta-Analysis. Zeitschrift für Psychologie, 2015. https://www.ovid.com/journals/zpjp/fulltext/10.1027/2151-2604/a000211~interventions-for-children-with-mathematical-difficulties-a
9. Gersten R et al. Mathematics Instruction for Students with Learning Disabilities: A Meta-Analysis of Instructional Components (technical report). 2009. https://files.eric.ed.gov/fulltext/ED521890.pdf
10. Early Detection and Intervention of Developmental Dyscalculia Using Serious Game-Based Digital Tools: A Systematic Review. Information (MDPI), 2025. https://www.mdpi.com/2078-2489/16/9/787
11. Meadows Center. Virtual Manipulatives: Tools for Teaching Mathematics to Students with Learning Disabilities. https://meadowscenter.org/wp-content/uploads/2022/04/VirtualManipulatives1.pdf
12. Bouck EC, Chamberlain C, Park J. Concrete and App-Based Manipulatives to Support Students with Disabilities with Subtraction. https://simvilledev.ku.edu/sites/default/files/researc/Bouck_Manipulatives.pdf
13. Honoré N, Noël MP. Improving Preschoolers' Arithmetic through Number Magnitude Training. PLOS One, 2016. https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0166685
14. Failure to replicate the benefit of approximate arithmetic training. Cognition, 2021. https://www.sciencedirect.com/science/article/pii/S0010027720303401
15. Rohrer D et al. A randomized controlled trial of interleaved mathematics practice (IES award summary). https://ies.ed.gov/use-work/awards/efficacy-study-interleaved-mathematics-practice
16. Kurnaz F. A Meta-Analysis of Gamification's Impact on Student Motivation in K-12 Education. Psychology in the Schools, 2025. https://onlinelibrary.wiley.com/doi/10.1002/pits.70056
17. Rubinsten O, Tannock R. Mathematics anxiety in children with developmental dyscalculia. 2010. https://pmc.ncbi.nlm.nih.gov/articles/PMC2913999
18. Ontario Mathematics Curriculum 2020, Grade 7, Strand B. https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-mathematics/grades/g7-math/strand-b/b1
