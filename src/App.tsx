import { useEffect, useMemo, useState } from 'react'
import countriesData from 'world-countries'
import { ArrowLeft, ArrowRight, Award, Check, ChevronDown, Compass, Globe2, Heart, Languages, Lightbulb, Play, RotateCcw, Settings2, Sparkles, Trophy, Volume2, X, Zap } from 'lucide-react'

type Country = { cca2: string; name: { common: string }; capital?: string[]; region: string; subregion?: string }
type Mode = 'flag' | 'country' | 'capital' | 'continent' | 'survival'
type Lang = 'en' | 'fr'
const countries = (countriesData as Country[]).filter(c => c.cca2 && c.name?.common && c.region !== 'Antarctic')
const modes: { id: Mode; icon: typeof Globe2; title: Record<Lang,string>; description: Record<Lang,string> }[] = [
  { id:'flag', icon:Globe2, title:{en:'Name the flag',fr:'Reconnaître le drapeau'}, description:{en:'Look at the flag and find its country.',fr:'Observe le drapeau et trouve son pays.'} },
  { id:'country', icon:Compass, title:{en:'Find the flag',fr:'Trouver le drapeau'}, description:{en:'A country name, four flags. Pick the right one.',fr:'Un pays, quatre drapeaux. Trouve le bon.'} },
  { id:'capital', icon:Award, title:{en:'Capital cities',fr:'Capitales'}, description:{en:'Match each country with its capital.',fr:'Associe chaque pays à sa capitale.'} },
  { id:'continent', icon:Globe2, title:{en:'Continents',fr:'Continents'}, description:{en:'Discover where countries belong.',fr:'Découvre sur quel continent se trouve chaque pays.'} },
  { id:'survival', icon:Zap, title:{en:'Survival run',fr:'Mode survie'}, description:{en:'How long can you keep your streak alive?',fr:'Combien de bonnes réponses peux-tu enchaîner ?'} },
]
const continentNames: Record<string,Record<Lang,string>> = {
  Africa:{en:'Africa',fr:'Afrique'}, Americas:{en:'Americas',fr:'Amériques'}, Asia:{en:'Asia',fr:'Asie'},
  Europe:{en:'Europe',fr:'Europe'}, Oceania:{en:'Oceania',fr:'Océanie'}
}
const words = {
  en:{subtitle:'A little geography. A lot of discovery.',play:'Start playing',explore:'Explore the world',daily:'YOUR DAILY DOSE OF GEOGRAPHY',best:'PERSONAL BEST',played:'ROUNDS PLAYED',accuracy:'ACCURACY',choose:'Choose your challenge',all:'All countries',easy:'Easy',medium:'Medium',hard:'Hard',question:'QUESTION',of:'OF',score:'SCORE',streak:'STREAK',hint:'Hint',next:'Next question',correct:'Brilliant! That’s correct.',wrong:'Not quite! The answer is',finish:'Round complete!',again:'Play again',home:'Back to home',settings:'Game settings',language:'Language',difficulty:'Difficulty',roundLength:'Questions per round',continents:'Continents',capital:'Capital',loading:'Loading the world…',skip:'Skip',hintText:'Need a clue?',you:'You',newBest:'New personal best!',mode:'GAME MODE',progress:'YOUR PROGRESS',countries:'COUNTRIES',close:'Close',sound:'Sound effects',welcome:'Ready to explore?',startDesc:'Test your knowledge of flags, countries and capitals from around the world.',select:'Select a mode to begin',correctAnswer:'Correct answer',time:'TIME',gameOver:'Game over',survivalDesc:'One mistake ends the run. Make it count.'},
  fr:{subtitle:'Un peu de géographie. Beaucoup de découvertes.',play:'Commencer',explore:'Explore le monde',daily:'TA DOSE QUOTIDIENNE DE GÉOGRAPHIE',best:'MEILLEUR SCORE',played:'PARTIES JOUÉES',accuracy:'PRÉCISION',choose:'Choisis ton défi',all:'Tous les pays',easy:'Facile',medium:'Moyen',hard:'Difficile',question:'QUESTION',of:'SUR',score:'SCORE',streak:'SÉRIE',hint:'Indice',next:'Question suivante',correct:'Bravo ! Bonne réponse.',wrong:'Pas tout à fait ! La réponse est',finish:'Partie terminée !',again:'Rejouer',home:'Retour à l’accueil',settings:'Paramètres du jeu',language:'Langue',difficulty:'Difficulté',roundLength:'Questions par partie',continents:'Continents',capital:'Capitale',loading:'Chargement du monde…',skip:'Passer',hintText:'Besoin d’un indice ?',you:'Toi',newBest:'Nouveau record !',mode:'MODE DE JEU',progress:'TA PROGRESSION',countries:'PAYS',close:'Fermer',sound:'Effets sonores',welcome:'Prêt(e) à explorer ?',startDesc:'Teste tes connaissances des drapeaux, pays et capitales du monde entier.',select:'Choisis un mode pour commencer',correctAnswer:'Bonne réponse',time:'TEMPS',gameOver:'Partie terminée',survivalDesc:'Une erreur et la partie s’arrête. À toi de jouer.'}
}
const flagUrl = (code:string) => 'https://flagcdn.com/w320/'+code.toLowerCase()+'.png'
const countryLabel = (c:Country, lang:Lang) => {
  try { return new Intl.DisplayNames([lang === 'fr' ? 'fr' : 'en'], {type:'region'}).of(c.cca2) || c.name.common } catch { return c.name.common }
}
const shuffle = <T,>(items:T[]) => [...items].sort(() => Math.random() - .5)
const statsKey = 'wfc-stats-v1'
type Stats = { played:number; correct:number; answered:number; best:number }
const initialStats:Stats = {played:0,correct:0,answered:0,best:0}

export default function App() {
  const [lang,setLang] = useState<Lang>('en')
  const [mode,setMode] = useState<Mode>('flag')
  const [difficulty,setDifficulty] = useState<'easy'|'medium'|'hard'>('medium')
  const [roundSize,setRoundSize] = useState(10)
  const [stats,setStats] = useState<Stats>(() => { try { return {...initialStats,...JSON.parse(localStorage.getItem(statsKey)||'{}')} } catch { return initialStats } })
  const [screen,setScreen] = useState<'home'|'quiz'|'result'>('home')
  const [question,setQuestion] = useState<Country|null>(null)
  const [options,setOptions] = useState<Country[]>([])
  const [index,setIndex] = useState(0)
  const [score,setScore] = useState(0)
  const [streak,setStreak] = useState(0)
  const [bestStreak,setBestStreak] = useState(0)
  const [selected,setSelected] = useState<string|null>(null)
  const [hint,setHint] = useState(false)
  const [settings,setSettings] = useState(false)
  const [showAll,setShowAll] = useState(false)
  const [filter,setFilter] = useState('')
  const t = words[lang]
  const accuracy = stats.answered ? Math.round(stats.correct/stats.answered*100) : 0
  const pool = useMemo(() => {
    if (difficulty === 'easy') return countries.filter(c => ['Europe','Americas','Asia'].includes(c.region))
    if (difficulty === 'hard') return countries
    return countries.filter(c => c.region !== 'Antarctic')
  },[difficulty])
  const makeOptions = (target:Country, gameMode:Mode=mode) => {
    if (gameMode === 'continent') {
      const regions = shuffle([...new Set(countries.map(c=>c.region).filter(r=>r && r!=='Antarctic'))].filter(r=>r!==target.region)).slice(0,3)
      return shuffle([target,...regions.map(r=>countries.find(c=>c.region===r)!).filter(Boolean)])
    }
    return shuffle([target,...shuffle(pool.filter(c=>c.cca2!==target.cca2)).slice(0,3)])
  }
  useEffect(()=>{ localStorage.setItem(statsKey,JSON.stringify(stats)) },[stats])
  const startGame = (selectedMode:Mode) => {
    setMode(selectedMode); setIndex(0); setScore(0); setStreak(0); setBestStreak(0); setSelected(null); setHint(false)
    const first = shuffle(pool)[0]
    setQuestion(first); setOptions(makeOptions(first,selectedMode))
    setScreen('quiz')
  }
  const finish = (finalScore:number) => {
    setStats(s=>({...s,played:s.played+1,best:Math.max(s.best,finalScore)})); setScreen('result')
  }
  const answer = (code:string) => {
    if (selected || !question) return
    setSelected(code)
    const isCorrect = code === question.cca2
    const nextStreak = isCorrect ? streak+1 : 0
    if (isCorrect) { setScore(s=>s+1); setStreak(nextStreak); setBestStreak(s=>Math.max(s,nextStreak)) }
    else setStreak(0)
    const nextStats = {...stats,correct:stats.correct+(isCorrect?1:0),answered:stats.answered+1}
    setStats(nextStats); localStorage.setItem(statsKey,JSON.stringify(nextStats))
    if (mode==='survival' && !isCorrect) { setTimeout(()=>{setStats(s=>({...s,played:s.played+1,best:Math.max(s.best,score)}));setScreen('result')},950); return }
    if (mode!=='survival' && index+1>=roundSize) { setTimeout(()=>{ setStats(s=>({...s,played:s.played+1,best:Math.max(s.best,score+(isCorrect?1:0))})); setScreen('result') },950); return }
    setTimeout(()=>{
      const next = shuffle(pool.filter(c=>c.cca2!==question.cca2))[0]
      setQuestion(next); setOptions(makeOptions(next))
      setIndex(i=>i+1); setSelected(null); setHint(false)
    },850)
  }
  const nextQuestion = () => {
    if (selected) return
    if (mode==='survival') { finish(score); return }
    const next = shuffle(pool.filter(c=>c.cca2!==question?.cca2))[0]
    setQuestion(next); setOptions(makeOptions(next)); setIndex(i=>i+1); setHint(false)
  }
  const filteredCountries = useMemo(()=>countries.filter(c=>countryLabel(c,lang).toLowerCase().includes(filter.toLowerCase())),[filter,lang])
  useEffect(()=>{document.documentElement.lang=lang},[lang])
  const correct = question && selected===question.cca2
  const renderChoice = (c:Country) => {
    const isRight = c.cca2===question?.cca2, isSelected=selected===c.cca2
    const stateClass = selected ? (isRight?' right':isSelected?' wrong':' muted') : ''
    return <button key={c.cca2} className={'answer-card'+(mode==='country'?' flag-choice':'')+stateClass} onClick={()=>answer(c.cca2)} disabled={!!selected}>
      {mode==='country' ? <><img className="choice-flag" src={flagUrl(c.cca2)} alt={countryLabel(c,lang)}/><span>{countryLabel(c,lang)}</span></> : <><span className="choice-letter">{String.fromCharCode(65+options.indexOf(c))}</span><span>{mode==='capital'? (c.capital?.[0]||'—') : mode==='continent' ? (continentNames[c.region]?.[lang]||c.region) : countryLabel(c,lang)}</span></>}
      {selected && isRight && <Check size={19}/>}
      {selected && isSelected && !isRight && <X size={19}/>}
    </button>
  }
  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={()=>setScreen('home')}><span className="brand-mark"><Globe2 size={21}/></span><span>world<span className="brand-light">flags</span><i>.</i></span></button>
      <div className="top-actions"><span className="online-pill"><span/> {countries.length} {t.countries.toLowerCase()}</span><button className="icon-button" aria-label="Change language" onClick={()=>setLang(l=>l==='en'?'fr':'en')}><Languages size={18}/><small>{lang.toUpperCase()}</small></button><button className="icon-button" aria-label={t.settings} onClick={()=>setSettings(true)}><Settings2 size={19}/></button></div>
    </header>
    {screen==='home' && <main className="home">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> {t.daily}</div><h1>{t.explore}<br/><span>one flag at a time.</span></h1><p>{t.subtitle}</p><button className="primary-button" onClick={()=>startGame('flag')}><Play size={17} fill="currentColor"/>{t.play}<ArrowRight size={17}/></button><div className="hero-note"><span className="avatars">🌍 🧭 ✨</span><span>{countries.length} countries. Endless discoveries.</span></div></div>
        <div className="globe-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="globe"><div className="globe-shine"/><span className="continent-shape shape-one"/><span className="continent-shape shape-two"/><span className="continent-shape shape-three"/><span className="continent-shape shape-four"/></div><span className="float-flag flag-a">🇯🇵</span><span className="float-flag flag-b">🇧🇷</span><span className="float-flag flag-c">🇫🇷</span><span className="float-flag flag-d">🇿🇦</span><span className="sparkle s-one">✦</span><span className="sparkle s-two">✧</span></div>
      </section>
      <section className="stats-grid"><div className="stat-card"><span className="stat-icon purple"><Trophy size={18}/></span><div><strong>{stats.best}</strong><small>{t.best}</small></div></div><div className="stat-card"><span className="stat-icon orange"><Zap size={18}/></span><div><strong>{stats.played}</strong><small>{t.played}</small></div></div><div className="stat-card"><span className="stat-icon green"><Check size={18}/></span><div><strong>{accuracy}%</strong><small>{t.accuracy}</small></div></div></section>
      <section className="modes-section"><div className="section-heading"><div><span className="eyebrow">{t.mode}</span><h2>{t.choose}</h2></div><span className="section-count">05 challenges</span></div><div className="mode-grid">{modes.map((m,i)=>{const Icon=m.icon;return <button className={'mode-card mode-'+m.id} key={m.id} onClick={()=>startGame(m.id)}><div className="mode-top"><span className="mode-icon"><Icon size={20}/></span><span className="mode-number">0{i+1}</span></div><h3>{m.title[lang]}</h3><p>{m.description[lang]}</p><span className="mode-arrow"><ArrowUpRightIcon/></span></button>})}</div></section>
      <section className="discover"><div><span className="eyebrow">{t.progress}</span><h2>Curiosity has no borders.</h2><p>Browse countries, discover capitals and learn something new every day.</p></div><button className="secondary-button" onClick={()=>setShowAll(v=>!v)}>{t.all}<ArrowRight size={16}/></button></section>
      {showAll && <section className="country-browser"><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search a country…"/><div className="country-list">{filteredCountries.slice(0,60).map(c=><div key={c.cca2}><img src={flagUrl(c.cca2)} alt=""/><span>{countryLabel(c,lang)}</span><small>{c.capital?.[0]||c.region}</small></div>)}</div></section>}
    </main>}
    {screen==='quiz' && question && <main className="quiz-page">
      <div className="quiz-toolbar"><button className="back-link" onClick={()=>setScreen('home')}><ArrowLeft size={17}/>{t.home}</button><span className="quiz-mode-label">{modes.find(m=>m.id===mode)?.title[lang]}</span><span className="round-label">{mode==='survival'?'∞':String(index+1).padStart(2,'0')+' / '+roundSize}</span></div>
      <div className="quiz-progress"><span style={{width:mode==='survival'?'100%':((index+1)/roundSize*100)+'%'}}/></div>
      <div className="quiz-meta"><span>{t.question} <b>{String(index+1).padStart(2,'0')}</b> {mode!=='survival'&&<em>{t.of} {roundSize}</em>}</span><div><span className="score-chip"><Trophy size={14}/>{score} {t.score.toLowerCase()}</span><span className="streak-chip"><Zap size={14}/>{streak} {t.streak.toLowerCase()}</span></div></div>
      <section className="question-panel"><span className="eyebrow">{mode==='survival'?t.survivalDesc:mode==='capital'?t.capital:mode==='continent'?t.continents:'WHICH COUNTRY DOES THIS FLAG BELONG TO?'}</span>
        {mode==='country' ? <><h2>{countryLabel(question,lang)}</h2><p className="question-sub">Which flag belongs to this country?</p></> : mode==='capital' ? <><h2>{countryLabel(question,lang)}</h2><p className="question-sub">What is its capital city?</p></> : mode==='continent' ? <><h2>{countryLabel(question,lang)}</h2><p className="question-sub">Which continent is it in?</p></> : <><h2>Which country is this?</h2><div className="flag-stage"><img src={flagUrl(question.cca2)} alt="Mystery country flag"/></div></>}
        {hint && <div className="hint-box"><Lightbulb size={16}/>{mode==='flag'||mode==='country'? (lang==='fr'?'Première lettre : ':'First letter: ')+countryLabel(question,lang).charAt(0)+' · '+(lang==='fr'?'Région : ':'Region: ')+(continentNames[question.region]?.[lang]||question.region) : mode==='capital' ? (lang==='fr'?'Région : ':'Region: ')+(continentNames[question.region]?.[lang]||question.region) : 'Subregion: '+(question.subregion||'—')}</div>}
      </section>
      <div className="answers-heading"><span>CHOOSE YOUR ANSWER</span><button className="hint-button" onClick={()=>setHint(v=>!v)}><Lightbulb size={15}/>{t.hint}</button></div>
      <div className={'answers-grid'+(mode==='country'?' four-flags':'')}>{options.map(renderChoice)}</div>
      {selected && <div className={'feedback '+(correct?'feedback-correct':'feedback-wrong')}><span className="feedback-icon">{correct?<Check size={18}/>:<X size={18}/>}</span><div><strong>{correct?t.correct:t.wrong}</strong><small>{countryLabel(question,lang)}</small></div><span className="feedback-points">{correct?'+ 1 pt':'0 pt'}</span></div>}
      <div className="quiz-footer"><span>🌍 &nbsp; Take your time. Learn as you go.</span>{!selected&&<button className="skip-button" onClick={nextQuestion}>{t.skip}<ArrowRight size={15}/></button>}{selected&&<button className="primary-button next-button" onClick={()=>{if(mode==='survival'&&selected!==question.cca2){setScreen('result')}else if(mode!=='survival'&&index+1>=roundSize){setStats(s=>({...s,played:s.played+1,best:Math.max(s.best,score)}));setScreen('result')}else{const next=shuffle(pool.filter(c=>c.cca2!==question.cca2))[0];setQuestion(next);setOptions(makeOptions(next));setIndex(i=>i+1);setSelected(null);setHint(false)}}}>{t.next}<ArrowRight size={16}/></button>}</div>
    </main>}
    {screen==='result' && <main className="result-page"><div className="result-confetti">✦　✧　✦</div><span className="eyebrow">{t.finish}</span><div className="result-medal"><Trophy size={39}/></div><h1>{mode==='survival'?t.gameOver:t.finish}</h1><p>{mode==='survival'?t.survivalDesc:'Every flag is a new story. Keep exploring!'}</p><div className="result-score"><strong>{score}</strong><span>/ {mode==='survival'?index+1:roundSize} {t.score.toLowerCase()}</span></div><div className="result-stats"><div><strong>{Math.round(score/Math.max(1,mode==='survival'?index+1:roundSize)*100)}%</strong><small>{t.accuracy}</small></div><div><strong>{bestStreak}</strong><small>{t.streak}</small></div></div>{score>=stats.best&&score>0&&<div className="new-record"><Sparkles size={16}/>{t.newBest}</div>}<button className="primary-button result-play" onClick={()=>startGame(mode)}><RotateCcw size={17}/>{t.again}<ArrowRight size={17}/></button><button className="back-link result-home" onClick={()=>setScreen('home')}>{t.home}</button></main>}
    {settings&&<div className="modal-backdrop" onClick={()=>setSettings(false)}><div className="settings-modal" onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">PERSONALIZE</span><h2>{t.settings}</h2></div><button className="icon-button" onClick={()=>setSettings(false)}><X size={19}/></button></div><label>{t.language}<select value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="en">English</option><option value="fr">Français</option></select></label><label>{t.difficulty}<select value={difficulty} onChange={e=>setDifficulty(e.target.value as typeof difficulty)}><option value="easy">{t.easy}</option><option value="medium">{t.medium}</option><option value="hard">{t.hard}</option></select></label><label>{t.roundLength}<select value={roundSize} onChange={e=>setRoundSize(Number(e.target.value))}><option value={5}>5</option><option value={10}>10</option><option value={15}>15</option><option value={20}>20</option></select></label><button className="primary-button save-settings" onClick={()=>setSettings(false)}>{t.close}<Check size={17}/></button></div></div>}
    <footer className="footer"><span>Made for the curious <Heart size={12} fill="currentColor"/> minds.</span><span>WORLD FLAGS CHALLENGE · 2026</span></footer>
  </div>
}
function ArrowUpRightIcon(){return <ArrowRight size={18}/>}
