const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
function ok(v,m){if(!v)throw new Error(m)}
const day=read('day.html'),css=read('styles.css'),exp=read('expenses.html'),expjs=read('expenses.js'),trip=read('trip-runtime.js'),data=read('data.js'),party=read('party-render-runtime.js');
ok(day.includes('<strong>To next stop</strong>'),'Timeline instruction must use To next stop');
ok(!day.includes('<strong>Next leg</strong>'),'Legacy Next leg label remains');
ok(exp.includes('placeholder="e.g. Dinner"')&&!exp.includes('Fergburger'),'Expense placeholder must be trip-neutral');
ok(!exp.includes('Choose the currency actually charged'),'Redundant currency instruction remains');
ok(expjs.includes('expenseCurrency=MONEY.getTripCurrency().code;'),'New expense must default to destination currency');
ok(css.includes('data-party-presentation="emoji"'),'Emoji-only party presentation CSS missing');
ok(party.includes('dataset.partyPresentation'),'Party presentation runtime contract missing');
ok(trip.includes("title.includes('little bear')?'🧸'")&&trip.includes("title.includes('quince')?'🔥'")&&trip.includes("title.includes('lune')?'🇫🇷'"),'Restaurant-specific booking icons missing');
ok(trip.includes("title.includes('tỉnh thức')")&&trip.includes("?'🦶'"),'Spa-specific booking icons missing');
ok(data.includes('"emoji": "🫧"')&&data.includes('"emoji": "🪨"')&&data.includes('"emoji": "🦶"'),'Spa content icons missing');
ok(!data.includes('Tỉnh Thức Spa is the scheduled'),'English Tỉnh Thức fallback remains');
console.log('RC8 PRESENTATION CONTRACT: PASS');
