import { useState, useEffect } from 'react'
import './App.css'

// OpenAI API key from environment variable
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''

const i18n = {
  ua: {
    title: 'AI-помічник для планування життя',
    intro: 'Введи свої ресурси, навички та вподобання — отримай креативний план розвитку, який надихає!'
    ,start: 'Почати',
    aboutYou: 'Розкажи про себе',
    resources: 'Ресурси',
    skills: 'Навички/таланти',
    preferences: 'Вподобання',
    restrictions: 'Обмеження',
    placeholderResources: 'Опиши свої ресурси...',
    placeholderSkills: 'Опиши свої навички...',
    placeholderPreferences: 'Що тобі подобається?',
    placeholderRestrictions: 'Що точно не твоє?',
    getPlan: 'Отримати план',
    yourPlan: 'Твій персоналізований план',
    otherVariant: 'Хочу новий план за 3€',
    threeIdeas: '3 ідеї на зараз, щоб почати рухатися:',
    useSkills: 'Як ти можеш застосувати свої навички:',
    bizPlanShort: 'Бізнес-план: коротко',
    lockedTitle: 'Повний план',
    lockedCta: 'Отримати доступ до плану — 1€',
    lang: 'UA',
  },
  en: {
    title: 'AI Life Planner',
    intro: 'Enter your resources, skills and preferences — get an inspiring growth plan!'
    ,start: 'Start',
    aboutYou: 'Tell about yourself',
    resources: 'Resources',
    skills: 'Skills/Talents',
    preferences: 'Preferences',
    restrictions: 'Restrictions',
    placeholderResources: 'Describe your resources...',
    placeholderSkills: 'Describe your skills...',
    placeholderPreferences: 'What do you enjoy?',
    placeholderRestrictions: 'What is definitely not yours?',
    getPlan: 'Get plan',
    yourPlan: 'Your personalized plan',
    otherVariant: 'New plan for 3€',
    threeIdeas: '3 ideas to start moving now:',
    useSkills: 'How to apply your skills:',
    bizPlanShort: 'Business plan: short',
    lockedTitle: 'Full plan',
    lockedCta: 'Unlock full plan — 1€',
    lang: 'EN',
  }
}

const resourceHints = [
  'Країна проживання',
  'Вільний час на тиждень',
  'Бюджет для навчання/стартапу',
  'Доступ до інтернету',
  'Підтримка друзів/родини',
]
const skillHints = [
  'Знання мов (наприклад, англійська А2)',
  'Вміння спілкуватися',
  'Організаторські здібності',
  'Творчі навички',
  'Вміння працювати з дітьми/тваринами',
]
const preferenceHints = [
  'Хочу працювати на природі',
  'Віддалено з будь-якої точки світу',
  'У команді',
  'Самостійно',
  'З дітьми',
  'З тваринами',
  'Не хочу працювати в офісі',
  'Не люблю ранній підйом',
]

function App() {
  const [lang, setLang] = useState('ua')
  const t = i18n[lang]

  const [step, setStep] = useState(0)
  const [resources, setResources] = useState('')
  const [skills, setSkills] = useState('')
  const [preferences, setPreferences] = useState('')
  const [restrictions, setRestrictions] = useState('')
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [freeText, setFreeText] = useState('')
  const [lockedText, setLockedText] = useState('')
  const [paidUnlocked, setPaidUnlocked] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [generatingAfterPay, setGeneratingAfterPay] = useState(false)
  const [headerText, setHeaderText] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [bestIdea, setBestIdea] = useState('')
  const [roleText, setRoleText] = useState('')

  useEffect(() => {
    const savedLang = localStorage.getItem('lang')
    if (savedLang) setLang(savedLang)
    const paid = sessionStorage.getItem('paidUnlocked') === '1'
    if (paid) setPaidUnlocked(true)
    const params = new URLSearchParams(window.location.search)
    if (params.get('paid') === '1') {
      setPaidUnlocked(true)
      sessionStorage.setItem('paidUnlocked', '1')
    }
  }, [])

  useEffect(() => { localStorage.setItem('lang', lang) }, [lang])

  const handleStart = () => setStep(1)

  async function generateWithAI({ resources, skills, preferences, restrictions, alt }) {
    const apiKey = localStorage.getItem('openaiKey')
    if (!apiKey) return null
    const sysUa = 'Ти досвідчений коуч з карʼєри та життя. Генеруй персоналізовані, конкретні ідеї та стислий бізнес-план. Уникай повтору слів користувача. Форматуй як: 3 ідеї (по одному реченню), потім розділ "Як ти можеш застосувати свої навички:" (до 3 пунктів), потім "Бізнес-план: коротко" (5 коротких пунктів). Пиши українською. Якщо дані англійською — відповідай англійською.'
    const sysEn = 'You are an experienced life & career coach. Generate personalized, concrete ideas and a short business plan. Avoid repeating user input verbatim. Format as: 3 ideas (one sentence each), then section "How to apply your skills:" (up to 3 bullets), then "Business plan: short" (5 brief bullets). Respond in English if user data is in English.'
    const system = lang === 'ua' ? sysUa : sysEn
    const user = `Resources: ${resources}\nSkills: ${skills}\nPreferences: ${preferences}\nLimits: ${restrictions}\n${alt ? 'Give a different angle than previous.' : ''}`
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0.9,
        }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content || ''
      if (!content) return null
      // Розбиваємо на безкоштовну і платну частини: перші 3 рядки (ідеї) — free; решта — paid
      const lines = content.split('\n').filter(l => l.trim().length > 0)
      const ideas = []
      const rest = []
      for (const line of lines) {
        if (ideas.length < 3) ideas.push(line)
        else rest.push(line)
      }
      const freeText = (lang === 'ua' ? '3 ідеї на зараз, щоб почати рухатися:' : '3 ideas to start moving now:') + '\n\n' + ideas.join('\n')
      const lockedText = rest.join('\n')
      return { freeText, lockedText }
    } catch (e) {
      console.warn('OpenAI error', e)
      return null
    }
  }

  function analyzeAndGeneratePlan(resources, skills, preferences, restrictions, alt = false) {
    const header = []
    const roles = [
      'організатор свят або подій',
      'творчий підприємець (арт, дизайн, майстер-класи)',
      'організатор дитячих заходів',
      'засновник власного стартапу',
      'унікальний фрілансер або консультант',
    ]
    let role = ''
    if (!alt) {
      if (/комуніка|спілку|організ|team|люд/i.test(skills + preferences)) role = roles[0]
      else if (/творч|малю|дизайн|арт|музик/i.test(skills + preferences)) role = roles[1]
      else if (/діти|дитяч/i.test(skills + preferences)) role = roles[2]
      else if (/бізнес|амбіці|керівн|lead|CEO|стартап/i.test(skills + preferences)) role = roles[3]
      else role = roles[4]
    } else {
      role = roles[Math.floor(Math.random() * roles.length)] || roles[4]
    }

    header.push(`Враховуючи твої навички та вподобання, я бачу тебе у ролі: ${role}`)

    // 3 ідеї
    const ideas = []
    const pool = {
      events: [
        'Організуй стильну тематичну подію у партнерському просторі/кавʼярні (safe, доросла аудиторія).',
        'Запусти серію домашніх вечірок для знайомих з унікальною програмою.',
        'Створи міні-агенцію для організації свят під ключ (від реквізиту до ведучого).',
      ],
      creative: [
        'Проведи майстер-клас у кавʼярні для новачків (арт/дизайн/музика).',
        'Створи онлайн-курс з твоєї творчої теми.',
        'Запусти продаж унікальних подарунків через соцмережі.',
      ],
      kids: [
        'Організуй квест або майстер-клас у школі/садочку.',
        'Підготуй серію програм для днів народження з іграми.',
        'Створи YouTube-канал з ідеями для дитячих свят.',
      ],
      startup: [
        'Створи сайт/бот для вирішення локальної проблеми.',
        'Запусти сервіс підбору вигідних пропозицій у місті.',
        'Організуй платформу для навчання/обміну досвідом.',
      ],
      solo: [
        'Запропонуй консультації знайомим у темі, де ти сильний/на.',
        'Запусти блог з порадами у своїй ніші.',
        'Проведи перший міні-мастермайнд для друзів.',
      ],
    }
    const key = role.includes('свят') ? 'events' : role.includes('творч') ? 'creative' : role.includes('дитяч') ? 'kids' : role.includes('стартап') ? 'startup' : 'solo'
    // Санітизація формулювань для дорослої аудиторії (не kids)
    const sanitize = (arr) => arr.map(txt => txt
      .replace(/підлітків у місцевому парку/gi, 'аудиторію у відповідній indoor-локації')
      .replace(/домашніх вечірок/gi, 'камерних подій у перевірених локаціях')
    )
    ideas.push(...(key === 'kids' ? pool[key] : sanitize(pool[key])))

    const free = []
    free.push('3 ідеї на зараз, щоб почати рухатися:')
    ideas.slice(0, 3).forEach((idea, idx) => free.push(`${idx + 1}. ${idea}`))

    // Обираємо найкращу ідею під особистість (пріоритет «масштабніших» формулювань)
    const priorityRe = /(агенц|платформ|сервіс|студі[яі]|agency|platform|service|studio)/i
    const prioritized = ideas.find(i => priorityRe.test(i))
    const bestIdea = prioritized || [...ideas].sort((a,b) => b.replace(/\W+/g,' ').length - a.replace(/\W+/g,' ').length)[0]

    // Навички (не дублюємо заголовок двічі)
    const skillsBlock = []
    const skillIdeas = []
    if (/організ|поді|івент|свят|вечір|дискотек|team|тімбілд/.test(skills)) skillIdeas.push('Організаторські здібності: бери на себе планування, координацію, ведення подій.')
    if (/комунікаб|спілку|люблю людей/.test(skills)) skillIdeas.push('Комунікабельність: спілкуйся з клієнтами, шукай партнерів, веди соцмережі.')
    if (/творч|дизайн|арт|музик|танцю|співати/.test(skills)) skillIdeas.push('Творчі навички: придумуй унікальні сценарії, конкурси, декоруй простір.')
    if (skillIdeas.length > 0) {
      skillsBlock.push('Як ти можеш застосувати свої навички:')
      skillsBlock.push(...skillIdeas.map(s => '— ' + s))
    }

    // Повний план під ЛИШЕ одну, найкращу ідею
    const paid = []
    paid.push('Бізнес-план: коротко')
    if (key === 'events' || role.includes('свят')) {
      paid.push('Мінімальний бюджет: від 50 євро (реквізит, реклама).')
      paid.push('Перші клієнти: друзі, знайомі, локальні групи у соцмережах.')
      paid.push('Час до першого прибутку: 1–2 тижні при активних діях.')
      paid.push('Можливості розвитку: власна агенція, масштабування на корпоративи, весілля.')
      paid.push('Покроковий план: 1) Склади список послуг. 2) Підготуй реквізит. 3) Зроби оголошення. 4) Проведи перше свято. 5) Збери відгуки.')
    } else if (key === 'creative') {
      paid.push('Мінімальний бюджет: від 20 євро (матеріали, реклама).')
      paid.push('Перші клієнти: знайомі, соцмережі, кавʼярні.')
      paid.push('Час до першого прибутку: 1–3 тижні.')
      paid.push('Можливості розвитку: студія, онлайн-курси, співпраця з закладами.')
      paid.push('Покроковий план: 1) Обери формат. 2) Підготуй матеріали. 3) Зроби приклади. 4) Запусти promo. 5) Проведи перший захід.')
    } else if (key === 'kids') {
      paid.push('Мінімальний бюджет: від 30 євро (іграшки, реквізит).')
      paid.push('Перші клієнти: батьки знайомих, садочки, школи.')
      paid.push('Час до першого прибутку: 1–2 тижні.')
      paid.push('Можливості розвитку: агенція, співпраця з дитсадками, франшиза.')
      paid.push('Покроковий план: 1) Склади програму. 2) Підготуй реквізит. 3) Зроби оголошення. 4) Проведи свято. 5) Збери фото/відгуки.')
    } else if (key === 'startup') {
      paid.push('Мінімальний бюджет: 0–200 євро (лендинг/прототип, реклама).')
      paid.push('Перші клієнти: знайомі, соцмережі, тестові групи.')
      paid.push('Час до першого прибутку: 1–2 місяці.')
      paid.push('Можливості розвитку: масштабування, команда, інвестиції.')
      paid.push('Покроковий план: 1) Гіпотеза. 2) MVP. 3) Перші користувачі. 4) Фідбек. 5) Ітерація.')
    } else {
      paid.push('Мінімальний бюджет: від 0 (консультації, онлайн-зустрічі).')
      paid.push('Перші клієнти: знайомі, локальні групи, соцмережі.')
      paid.push('Час до першого прибутку: 1–2 тижні.')
      paid.push('Можливості розвитку: блог, розширення спектру послуг.')
      paid.push('Покроковий план: 1) Сильна сторона. 2) Пропозиція. 3) Перші клієнти. 4) Відгуки. 5) Портфоліо.')
    }

    return { header: header.join('\n'), freeText: free.join('\n\n'), skillsText: skillsBlock.join('\n\n'), lockedText: paid.join('\n\n'), bestIdea }
  }

  async function generatePlanLocal(alt = false) {
    const { header, freeText, skillsText, lockedText, bestIdea } = analyzeAndGeneratePlan(resources, skills, preferences, restrictions, alt)
    setHeaderText('')
    setRoleText(header.replace(/^Враховуючи[^:]*:\s*/, ''))
    setFreeText(freeText)
    setSkillsText(skillsText)
    setLockedText(lockedText)
    setBestIdea(bestIdea)
  }

  async function generatePlanAI(alt = false) {
    const apiKey = OPENAI_API_KEY || localStorage.getItem('openaiKey')
    if (!apiKey) {
      await generatePlanLocal(alt)
      return
    }
    
    // Аналізуємо введені дані для персоналізації
    const location = resources.includes('село') || resources.includes('Балкани') ? 'сільська місцевість' : 'місто'
    const budget = resources.includes('грошей обмаль') ? 'мінімальний бюджет' : 'середній бюджет'
    const timeAvailable = resources.includes('вільного часу багато') ? 'багато вільного часу' : 'обмежений час'
    const internet = resources.includes('мобільний') ? 'обмежений інтернет' : 'стабільний інтернет'
    
    const englishLevel = skills.includes('базові') ? 'базовий рівень' : skills.includes('англійської') ? 'середній рівень' : 'відсутній'
    const physicalSkills = skills.includes('фізичним') ? 'фізичні навички' : 'відсутні'
    const organization = skills.includes('організовувати') ? 'відсутні' : 'потрібно розвивати'
    
    const workStyle = preferences.includes('сам') ? 'самостійна робота' : preferences.includes('команда') ? 'командна робота' : 'змішана'
    const environment = preferences.includes('відкритому повітрі') ? 'на відкритому повітрі' : 'в приміщенні'
    const schedule = preferences.includes('ранніми') ? 'ранній підйом' : 'гнучкий графік'
    
    const restrictionsList = restrictions.split(',').map(r => r.trim()).filter(r => r.length > 0)
    
    const system = 'Ти персональний коуч. Аналізуй ВСІ введені дані і генеруй план, який точно підходить під цю ситуацію. Пиши стисло, натхненно, конкретно. Українською. НЕ давай загальних відповідей - аналізуй кожен деталь.'
    const user = `КОРИСТУВАЧ ВВІВ:
Ресурси: ${resources}
Навички: ${skills}
Вподобання: ${preferences}
Обмеження: ${restrictions}

АНАЛІЗУЙ ЦІ ДАНІ І ЗГЕНЕРУЙ ПЕРСОНАЛІЗОВАНИЙ ПЛАН:

1) Роль: (враховуючи ВСІ обмеження та можливості з введених даних)
2) 3 ідеї для старту: (реалістичні для цієї конкретної ситуації)
3) Як ти можеш застосувати свої навички: (враховуючи реальні навички з введених даних)
4) Бізнес-план: коротко
   - Мінімальний бюджет: (враховуючи фінансові можливості)
   - Перші клієнти: (враховуючи місце проживання та наявність інтернету)
   - Час до прибутку: (реалістично для цієї ситуації)
   - Можливості розвитку: (враховуючи обмеження)
   - Покроковий план: (5 конкретних кроків, кожен крок з нової рядка)

ВАЖЛИВО: Аналізуй кожен деталь з введених даних. НЕ давай загальних відповідей. Враховуй обмеження: ${restrictionsList.join(', ')}`
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [ { role: 'system', content: system }, { role: 'user', content: user } ],
          temperature: 0.9,
          max_tokens: 2000,
        }),
      })
      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content || ''
      if (!content) {
        await generatePlanLocal(alt)
        return
      }
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
      let roleLine = lines.find(l => /роль|роль:/i.test(l)) || lines[0] || ''
      roleLine = roleLine
        .replace(/^Роль:?\s*/i, '')
        .replace(/^\d+\)\s*/, '')
        .replace(/^\d+\.\s*/, '')
      const header = `Враховуючи твої навички та вподобання, я бачу тебе у ролі: ${roleLine}`

      const ideasStart = lines.findIndex(l => /^\d+\.|•|-\s/.test(l))
      const ideas = ideasStart >= 0 ? lines.slice(ideasStart, ideasStart + 3).map((l,i)=> l.replace(/^\d+\.|[-•]\s*/, `${i+1}. `)) : []
      const freeText = ['3 ідеї на зараз, щоб почати рухатися:', ...ideas].join('\n\n')

      const skillsHeaderIdx = lines.findIndex(l => /^як ти можеш застосувати свої навички/i.test(l))
      let skillsBlock = ''
      if (skillsHeaderIdx >= 0) {
        const skillItems = lines.slice(skillsHeaderIdx + 1).filter(l => l.startsWith('-') || l.startsWith('—') || /^\d+\./.test(l)).slice(0,3)
        skillsBlock = ['Як ти можеш застосувати свої навички:', ...skillItems.map(l => '— ' + l.replace(/^[-—\d+.]+\s*/, ''))].join('\n')
      }

      // Покращений парсинг бізнес-плану
      const planHeaderIdx = lines.findIndex(l => /бізнес-план/i.test(l))
      const planLines = planHeaderIdx >= 0 ? lines.slice(planHeaderIdx + 1) : []
      
      // Шукаємо кожну секцію окремо
      const findSection = (keywords) => {
        const section = planLines.find(l => keywords.some(k => l.toLowerCase().includes(k)))
        return section ? section.trim() : ''
      }
      
      const budgetSection = findSection(['бюджет', 'витрат'])
      const clientsSection = findSection(['клієнт', 'клієнти', 'родич', 'сусід'])
      const timeSection = findSection(['час', 'тиждн', 'місяц'])
      const growthSection = findSection(['розвит', 'розширен', 'масштаб'])
      const stepsSection = findSection(['покроков', 'крок', 'план'])
      
      // Якщо покроковий план не знайдено, шукаємо детальніше
      let finalStepsSection = stepsSection
      if (!finalStepsSection) {
        const detailedSteps = planLines.filter(l => /^\d+[\)\.]|^[•-]\s*\d+/.test(l))
        if (detailedSteps.length > 0) {
          finalStepsSection = 'Покроковий план: ' + detailedSteps.slice(0, 5).map((step, i) => 
            `${i + 1}) ${step.replace(/^[•\-\d\)\.\s]+/, '')}`
          ).join('\n')
        }
      }
      
      const lockedParts = [
        'Бізнес-план: коротко',
        budgetSection || 'Мінімальний бюджет: від 50€ (за потреби реквізит/реклама).',
        clientsSection || 'Перші клієнти: друзі, локальні групи, соцмережі.',
        timeSection || 'Час до прибутку: 1–3 тижні при активних діях.',
        growthSection || 'Можливості розвитку: масштабування, партнерства, команда.',
        finalStepsSection || 'Покроковий план: 1) Пропозиція. 2) Приклади. 3) Пост/оголошення. 4) Перша подія/послуга. 5) Відгуки.',
      ]
      const lockedText = [skillsBlock, lockedParts.join('\n')].filter(Boolean).join('\n\n')

      const priorityRe = /(агенц|платформ|сервіс|студі[яі]|agency|platform|service|studio)/i
      const prioritized = ideas.map(s => s.replace(/^\d+\.\s*/, '')).find(i => priorityRe.test(i))
      const bestIdea = prioritized || (ideas[0] || '').replace(/^\d+\.\s*/, '')

      setHeaderText('')
      setRoleText(roleLine)
      setFreeText(freeText)
      setSkillsText(skillsBlock)
      setLockedText(lockedText)
      setBestIdea(bestIdea)
    } catch (e) {
      await generatePlanLocal(alt)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Авто-скидання доступу
    setPaidUnlocked(false)
    sessionStorage.removeItem('paidUnlocked')
    const url = new URL(window.location.href)
    url.searchParams.delete('paid')
    window.history.replaceState({}, '', url)

    await generatePlanAI(false)
    setFormSubmitted(true)
    setStep(2)
  }

  const generateNewPlan = async (alt = true, keepUnlocked = false) => {
    if (!keepUnlocked) {
      setPaidUnlocked(false)
      sessionStorage.removeItem('paidUnlocked')
    }
    await generatePlanAI(alt)
  }

  async function sha1Hex(message) {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async function startFondyPayment({ amountCents = 100, currency = 'EUR', orderDesc = 'AI Plan unlock', action = 'unlock', persist = true }) {
    try {
      setIsPaying(true)
      const merchant_id = 1396424
      const secret = 'test'
      const order_id = 'demo_' + Date.now()
      const server_callback_url = window.location.origin + '/fondy-callback'
      const response_url = window.location.origin + window.location.pathname + '?paid=1'
      const request = { merchant_id, order_id, order_desc: orderDesc, amount: amountCents, currency, server_callback_url, response_url }
      const signFields = ['merchant_id','order_id','order_desc','amount','currency','server_callback_url','response_url']
      const baseString = [secret, ...signFields.map(k => request[k]), secret].join('|')
      const signature = await sha1Hex(baseString)
      const body = { request: { ...request, signature } }
      const res = await fetch('https://pay.fondy.eu/api/checkout/url/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Fondy HTTP error')
      const data = await res.json()
      if (data && data.response && data.response.checkout_url) {
        window.location.href = data.response.checkout_url
      } else {
        throw new Error('No checkout_url in response')
      }
    } catch (e) {
      const ok = window.confirm('Не вдалося відкрити Fondy (sandbox). Симулювати успішну оплату?')
      if (ok) {
        setPaidUnlocked(true)
        if (persist) sessionStorage.setItem('paidUnlocked', '1')
        const url = new URL(window.location.href)
        url.searchParams.set('paid', '1')
        window.history.replaceState({}, '', url)
        if (action === 'new') {
          // Новий план після оплати: генеруємо і залишаємо розблокованим (без persist)
          await generateNewPlan(true, true)
        }
      }
    } finally {
      setIsPaying(false)
    }
  }

  // Відокремлюємо видимі рядки (перший + заголовок навичок) від решти, яку блюримо
  const allLockedLines = (lockedText || '').split(/\n+/).filter(Boolean)
  const firstVisibleLine = allLockedLines[0] || ''
  const skillsHeaderIndex = allLockedLines.findIndex(l => l.trim() === i18n[lang].useSkills)
  const skillsHeaderLine = skillsHeaderIndex >= 0 ? allLockedLines[skillsHeaderIndex] : ''
  const blurredBodyLines = allLockedLines.filter((_, idx) => idx !== 0 && idx !== skillsHeaderIndex)
  const blurredBody = blurredBodyLines.join('\n')

  function resetPaywall() {
    sessionStorage.removeItem('paidUnlocked')
    const url = new URL(window.location.href)
    url.searchParams.delete('paid')
    window.history.replaceState({}, '', url)
    window.location.reload()
  }

  return (
    <div className="container">
      <div className="topbar">
        <button className="lang-switch" onClick={() => setLang(lang === 'ua' ? 'en' : 'ua')}>{t.lang}</button>
      </div>

      {step === 0 && (
        <div className="welcome">
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
          <button onClick={handleStart}>{t.start}</button>
        </div>
      )}
      {step === 1 && (
        <form className="input-form" onSubmit={handleSubmit}>
          <h2>{t.aboutYou}</h2>
          <label>
            {t.resources} (приклади: {resourceHints.join(', ')})
            <textarea value={resources} onChange={e => setResources(e.target.value)} placeholder={t.placeholderResources} required />
          </label>
          <label>
            {t.skills} (приклади: {skillHints.join(', ')})
            <textarea value={skills} onChange={e => setSkills(e.target.value)} placeholder={t.placeholderSkills} required />
          </label>
          <label>
            {t.preferences} (приклади: {preferenceHints.join(', ')})
            <textarea value={preferences} onChange={e => setPreferences(e.target.value)} placeholder={t.placeholderPreferences} required />
          </label>
          <label>
            {t.restrictions}
            <textarea value={restrictions} onChange={e => setRestrictions(e.target.value)} placeholder={t.placeholderRestrictions} />
          </label>
          <button type="submit">{t.getPlan}</button>
        </form>
      )}
      {step === 2 && formSubmitted && (
        <div className="result">
          <h2>{t.yourPlan}</h2>
          {headerText ? null : null}
          <p style={{whiteSpace: 'pre-line'}}>{freeText}</p>

          <div className={"locked " + (paidUnlocked ? '' : 'blurred')}>
            <div className="stars" aria-hidden="true"><span>★</span><span>★</span><span>★</span></div>
            <div className="locked-overlay" />
            <div className="locked-content">
              <h3>{t.lockedTitle}</h3>
              {roleText && (
                <p className="locked-teaser">Роль: {roleText}</p>
              )}
              {/* Тизер: найкраща ідея під тебе */}
              <p className="locked-teaser">Я вважаю, що під твою особистість найкраще підійде: {bestIdea}</p>
              {/* Видимий заголовок навичок */}
              {skillsText && <p className="locked-teaser" style={{whiteSpace: 'pre-line'}}>{skillsText.split('\n')[0]}</p>}
              {/* Основне тіло під блюром до оплати */}
              <p
                style={{
                  whiteSpace: 'pre-line',
                  filter: paidUnlocked ? 'none' : 'blur(6px)',
                  opacity: paidUnlocked ? 1 : 0.65,
                  pointerEvents: paidUnlocked ? 'auto' : 'none',
                  transition: 'filter 0.25s, opacity 0.25s'
                }}
              >
                {/* Решта навичок + бізнес план */}
                {skillsText.split('\n').slice(1).join('\n')}
                {'\n\n'}
                {lockedText}
              </p>
            </div>
            {!paidUnlocked && (
              <button className="unlock-btn" disabled={isPaying} onClick={() => startFondyPayment({ amountCents: 100, currency: 'EUR', orderDesc: 'Unlock full plan 1€', action: 'unlock', persist: true })}>
                {isPaying ? '...' : t.lockedCta}
              </button>
            )}
          </div>

          <button
            onClick={async () => {
              // Новий план: після оплати 3€ одразу генеруємо і показуємо без блюру (не зберігаємо у sessionStorage)
              await startFondyPayment({ amountCents: 300, currency: 'EUR', orderDesc: 'New plan 3€', action: 'new', persist: false })
            }}
            style={{marginTop: '1em'}}
          >{t.otherVariant}</button>
        </div>
      )}

      <footer className="footer">
        © 2025 AI.Rishennia. All rights reserved.<br />
        Contact: <a href="mailto:ai.rishennia@gmail.com">ai.rishennia@gmail.com</a>
        <div>
          <button className="tiny-link" onClick={resetPaywall}>Скинути доступ (очистити paywall)</button>
        </div>
      </footer>
    </div>
  )
}

export default App
