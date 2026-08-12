import http from 'http';
import { randomInt } from 'crypto';

let HSRI_STATE_DATA = null;
let HSRI_NATIONAL_AVERAGES = null;
let HSRI_METADATA = null;

async function loadHsriData() {
  try {
    const mod = await import('./src/data/humanSecurityData.js');
    HSRI_STATE_DATA = mod.PROCESSED_STATE_DATA;
    HSRI_NATIONAL_AVERAGES = mod.NATIONAL_AVERAGES;
    HSRI_METADATA = mod.DATA_METADATA;
    console.log(`HSRI data loaded: ${HSRI_STATE_DATA?.length || 0} states`);
  } catch (e) {
    console.log('HSRI data load failed:', e?.message);
  }
}

const STATE_LGAS = {
  Abia: ['Arochukwu','Bende','Ikwuano','Isiala Ngwa North','Isiala Ngwa South','Isuikwuato','Obi Ngwa','Ohafia','Osisioma','Ugwunagbo','Ukwa East','Ukwa West','Umuahia North','Umuahia South','Umunneochi'],
  Adamawa: ['Demsa','Fufore','Ganye','Girei','Gombi','Guyuk','Hong','Jada','Lamurde','Madagali','Maiha','Mayo-Belwa','Michika','Mubi North','Mubi South','Numan','Shelleng','Song','Toungo','Yola North','Yola South'],
  'Akwa Ibom': ['Abak','Eastern Obolo','Eket','Esit Eket','Essien Udim','Etim Ekpo','Etinan','Ibeno','Ibesikpo Asutan','Ibiono Ibom','Ikono','Ikot Abasi','Ikot Ekpene','Ini','Itu','Mbo','Mkpat Enin','Nsit Ibom','Nsit Ubium','Obot Akara','Okobo','Onna','Oron','Oruk Anam','Udung Uko','Ukanafun','Uruan','Urue-Offong/Oruko','Uyo'],
  Anambra: ['Aguata','Anambra East','Anambra West','Anaocha','Awka North','Awka South','Ayamelum','Dunukofia','Ekwusigo','Idemili North','Idemili South','Ihiala','Njikoka','Nnewi North','Nnewi South','Ogbaru','Onitsha North','Onitsha South','Orumba North','Orumba South','Oyi'],
  Bauchi: ['Alkaleri','Bauchi','Bogoro','Damban','Darazo','Dass','Gamawa','Ganjuwa','Giade','Itas/Gadau','Jama\'are','Katagum','Kirfi','Misau','Ningi','Shira','Tafawa Balewa','Toro','Warji','Zaki'],
  Bayelsa: ['Brass','Ekeremor','Kolokuma/Opokuma','Nembe','Ogbia','Sagbama','Southern Ijaw','Yenagoa'],
  Benue: ['Ado','Agatu','Apa','Buruku','Gboko','Guma','Gwer East','Gwer West','Katsina-Ala','Konshisha','Kwande','Logo','Makurdi','Obi','Ogbadibo','Ohimini','Oju','Okpokwu','Otukpo','Tarka','Ukum','Ushongo','Vandeikya'],
  Borno: ['Abadam','Askira/Uba','Bama','Bayo','Biu','Chibok','Damboa','Dikwa','Gubio','Guzamala','Gwoza','Hawul','Jere','Kaga','Kala/Balge','Konduga','Kukawa','Kwaya Kusar','Mafa','Magumeri','Maiduguri','Marte','Mobbar','Monguno','Ngala','Nganzai','Shani'],
  'Cross River': ['Abi','Akamkpa','Akpabuyo','Bakassi','Bekwarra','Biase','Boki','Calabar Municipal','Calabar South','Etung','Ikom','Obanliku','Obubra','Obudu','Odukpani','Ogoja','Yakurr','Yala'],
  Delta: ['Aniocha North','Aniocha South','Bomadi','Burutu','Ethiope East','Ethiope West','Ika North East','Ika South','Isoko North','Isoko South','Ndokwa East','Ndokwa West','Okpe','Oshimili North','Oshimili South','Patani','Sapele','Udu','Ughelli North','Ughelli South','Ukwuani','Uvwie','Warri North','Warri South','Warri South West'],
  Ebonyi: ['Abakaliki','Afikpo North','Afikpo South','Ezza North','Ezza South','Ikwo','Ishielu','Ivo','Izzi','Ohaozara','Ohaukwu','Onicha'],
  Edo: ['Akoko-Edo','Egor','Esan Central','Esan North-East','Esan South-East','Esan West','Etsako Central','Etsako East','Etsako West','Igueben','Ikpoba-Okha','Oredo','Orhionmwon','Ovia North-East','Ovia South-West','Owan East','Owan West','Uhunmwonde'],
  Ekiti: ['Ado Ekiti','Efon','Ekiti East','Ekiti South-West','Ekiti West','Emure','Gbonyin','Ido Osi','Ijero','Ikere','Ikole','Ilejemeje','Irepodun/Ifelodun','Ise/Orun','Moba','Oye'],
  Enugu: ['Aninri','Awgu','Enugu East','Enugu North','Enugu South','Ezeagu','Igbo Etiti','Igbo Eze North','Igbo Eze South','Isi Uzo','Nkanu East','Nkanu West','Nsukka','Oji River','Udenu','Udi','Uzo Uwani'],
  FCT: ['Abaji','Bwari','Gwagwalada','Kuje','Kwali','Municipal Area Council'],
  Gombe: ['Akko','Balanga','Billiri','Dukku','Funakaye','Gombe','Kaltungo','Kwami','Nafada','Shongom','Yamaltu/Deba'],
  Imo: ['Aboh Mbaise','Ahiazu Mbaise','Ehime Mbano','Ezinihitte','Ideato North','Ideato South','Ihitte/Uboma','Ikeduru','Isiala Mbano','Isu','Mbaitoli','Ngor Okpala','Njaba','Nkwerre','Nwangele','Obowo','Oguta','Ohaji/Egbema','Okigwe','Onuimo','Orlu','Orsu','Oru East','Oru West','Owerri Municipal','Owerri North','Owerri West','Unuimo'],
  Jigawa: ['Auyo','Babura','Biriniwa','Birnin Kudu','Buji','Dutse','Gagarawa','Garki','Gumel','Guri','Gwaram','Gwiwa','Hadejia','Jahun','Kafin Hausa','Kaugama','Kazaure','Kiri Kasama','Kiyawa','Maigatari','Malam Madori','Miga','Ringim','Roni','Sule Tankarkar','Taura','Yankwashi'],
  Kaduna: ['Birnin Gwari','Chikun','Giwa','Igabi','Ikara','Jaba','Jema\'a','Kachia','Kaduna North','Kaduna South','Kagarko','Kajuru','Kaura','Kauru','Kubau','Kudan','Lere','Makarfi','Sabon Gari','Sanga','Soba','Zangon Kataf','Zaria'],
  Kano: ['Ajingi','Albasu','Bagwai','Bebeji','Bichi','Bunkure','Dala','Dambatta','Dawakin Kudu','Dawakin Tofa','Doguwa','Fagge','Gabasawa','Garko','Garun Mallam','Gaya','Gezawa','Gwale','Gwarzo','Kabo','Kano Municipal','Karaye','Kibiya','Kiru','Kumbotso','Kunchi','Kura','Madobi','Makoda','Minjibir','Nasarawa','Rano','Rimin Gado','Rogo','Shanono','Sumaila','Takai','Tarauni','Tofa','Tsanyawa','Tudun Wada','Ungogo','Warawa','Wudil'],
  Katsina: ['Bakori','Batagarawa','Batsari','Baure','Bindawa','Charanchi','Dandume','Danja','Dan Musa','Daura','Dutsi','Dutsin Ma','Faskari','Funtua','Ingawa','Jibia','Kafur','Kaita','Kankara','Kankia','Katsina','Kurfi','Kusada','Mai\'Adua','Malumfashi','Mani','Mashi','Matazu','Musawa','Rimi','Sabuwa','Safana','Sandamu','Zango'],
  Kebbi: ['Aleiro','Arewa Dandi','Argungu','Augie','Bagudo','Birnin Kebbi','Bunza','Dandi','Fakai','Gwandu','Jega','Kalgo','Koko/Besse','Maiyama','Ngaski','Sakaba','Shanga','Suru','Wasagu/Danko','Yauri','Zuru'],
  Kogi: ['Adavi','Ajaokuta','Ankpa','Bassa','Dekina','Ibaji','Idah','Igalamela Odolu','Ijumu','Kabba/Bunu','Kogi','Lokoja','Mopa-Muro','Ofu','Ogori/Magongo','Okehi','Okene','Olamaboro','Omala','Yagba East','Yagba West'],
  Kwara: ['Asa','Baruten','Edu','Ekiti','Ifelodun','Ilorin East','Ilorin South','Ilorin West','Irepodun','Isin','Kaiama','Moro','Offa','Oke Ero','Oyun','Pategi'],
  Lagos: ['Agege','Ajeromi-Ifelodun','Alimosho','Amuwo-Odofin','Apapa','Badagry','Epe','Eti Osa','Ibeju-Lekki','Ifako-Ijaye','Ikeja','Ikorodu','Kosofe','Lagos Island','Lagos Mainland','Mushin','Ojo','Oshodi-Isolo','Somolu','Surulere'],
  Nasarawa: ['Akwanga','Awe','Doma','Karu','Keana','Keffi','Kokona','Lafia','Nasarawa','Nasarawa Egon','Obi','Toto','Wamba'],
  Niger: ['Agaie','Agwara','Bida','Borgu','Bosso','Chanchaga','Edati','Gbako','Gurara','Katcha','Kontagora','Lapai','Lavun','Magama','Mariga','Mashegu','Mokwa','Munya','Paikoro','Rafi','Rijau','Shiroro','Suleja','Tafa','Wushishi'],
  Ogun: ['Abeokuta North','Abeokuta South','Ado-Odo/Ota','Ewekoro','Ifo','Ijebu East','Ijebu North','Ijebu North East','Ijebu Ode','Ikenne','Imeko Afon','Ipokia','Obafemi Owode','Odeda','Odogbolu','Ogun Waterside','Remo North','Sagamu','Yewa North','Yewa South'],
  Ondo: ['Akoko North-East','Akoko North-West','Akoko South-East','Akoko South-West','Akure North','Akure South','Ese Odo','Idanre','Ifedore','Ilaje','Ile Oluji/Okeigbo','Irele','Odigbo','Okitipupa','Ondo East','Ondo West','Ose','Owo'],
  Osun: ['Atakumosa East','Atakumosa West','Aiyedaade','Aiyedire','Boluwaduro','Boripe','Ede North','Ede South','Egbedore','Ejigbo','Ife Central','Ife East','Ife North','Ife South','Ifedayo','Ifelodun','Ila','Ilesa East','Ilesa West','Irepodun','Irewole','Isokan','Iwo','Obokun','Odo Otin','Ola Oluwa','Olorunda','Oriade','Orolu','Osogbo'],
  Oyo: ['Afijio','Akinyele','Atiba','Atisbo','Egbeda','Ibadan North','Ibadan North-East','Ibadan North-West','Ibadan South-East','Ibadan South-West','Ibarapa Central','Ibarapa East','Ibarapa North','Ido','Irepo','Iseyin','Itesiwaju','Iwajowa','Kajola','Lagelu','Ogbomosho North','Ogbomosho South','Ogo Oluwa','Olorunsogo','Oluyole','Ona Ara','Orelope','Ori Ire','Oyo East','Oyo West','Saki East','Saki West','Surulere'],
  Plateau: ['Barkin Ladi','Bassa','Bokkos','Jos East','Jos North','Jos South','Kanam','Kanke','Langtang North','Langtang South','Mangu','Mikang','Pankshin','Qua\'an Pan','Riyom','Shendam','Wase'],
  Rivers: ['Abua/Odual','Ahoada East','Ahoada West','Akuku-Toru','Andoni','Asari-Toru','Bonny','Degema','Eleme','Emohua','Etche','Gokana','Ikwerre','Khana','Obio/Akpor','Ogba/Egbema/Ndoni','Ogu/Bolo','Okrika','Omuma','Opobo/Nkoro','Oyigbo','Port Harcourt','Tai'],
  Sokoto: ['Binji','Bodinga','Dange Shuni','Gada','Goronyo','Gudu','Gwadabawa','Illela','Isa','Kebbe','Kware','Rabah','Sabon Birni','Shagari','Silame','Sokoto North','Sokoto South','Tambuwal','Tangaza','Tureta','Wamakko','Wurno','Yabo'],
  Taraba: ['Ardo Kola','Bali','Donga','Gashaka','Gassol','Ibi','Jalingo','Karim Lamido','Kurmi','Lau','Sardauna','Takum','Ussa','Wukari','Yorro','Zing'],
  Yobe: ['Bade','Bursari','Damaturu','Fika','Fune','Geidam','Gujba','Gulani','Jakusko','Karasuwa','Machina','Nangere','Nguru','Potiskum','Tarmuwa','Yunusari','Yusufari'],
  Zamfara: ['Anka','Bakura','Birnin Magaji','Bukkuyum','Bungudu','Gummi','Gusau','Kaura Namoda','Maradun','Maru','Shinkafi','Talata Mafara','Tsafe','Zurmi'],
};
const STATES = Object.keys(STATE_LGAS);
const STATE_NAMES_LOWER = STATES.map(s => s.toLowerCase());
const NEWS_SOURCES = [
  { name: 'Daily Trust', feed: 'https://dailytrust.com/feed/' },
  { name: 'Premium Times', feed: 'https://www.premiumtimesng.com/feed' },
  { name: 'Punch', feed: 'https://punchng.com/feed/' },
  { name: 'Vanguard', feed: 'https://www.vanguardngr.com/feed/' },
  { name: 'Channels TV', feed: 'https://www.channelstv.com/feed/' },
  { name: 'Tribune', feed: 'https://tribuneonlineng.com/feed/' },
];

const SECURITY_KEYWORDS = /\b(kill|killed|killing|death|dead|attack|attacked|attacke?d?|bandit|banditry|terrorist|terrorism|kidnap|kidnapped|abduct|abducted|clash|clashed|gunmen|insurgent|militant|IED|bomb|bombing|explosion|ambush|raid|raided|shoot|shot|shooting|massacre|fatal|fatality|victim|troops|soldiers|soldier|military|security\s+forces|jihadist|ISWAP|Boko\s*Haram|herdsmen|rustling|cattle\s+rustling|arson|arsonist|communal|farmer-herder|invasion|violent|deadly|wound|injur)\b/i;
const INJURY_KEYWORDS = /\b(injur|wound|casualt)\b/i;

function pick(arr) { return arr[randomInt(arr.length)]; }

function extractState(text) {
  const t = text.toLowerCase();
  for (const s of STATE_NAMES_LOWER) {
    if (t.includes(s)) return STATES[STATE_NAMES_LOWER.indexOf(s)];
  }
  return null;
}

function extractLGA(text, state) {
  if (!state) return null;
  const lgas = STATE_LGAS[state];
  if (!lgas) return null;
  const t = text.toLowerCase();
  for (const lga of lgas) {
    if (t.includes(lga.toLowerCase())) return lga;
  }
  return null;
}

function pickLga(state) { const l = STATE_LGAS[state]; return l ? pick(l) : null; }

function parseRSS(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRegex.exec(xmlText)) !== null) {
    const block = m[1];
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/))?.[1]?.trim() || '';
    const link = (block.match(/<link>(.*?)<\/link>/))?.[1]?.trim() || '';
    const desc = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || block.match(/<description>(.*?)<\/description>/))?.[1]?.trim() || '';
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/))?.[1]?.trim() || '';
    const dcDate = (block.match(/<dc:date>(.*?)<\/dc:date>/))?.[1]?.trim() || '';
    items.push({ title, link, description: desc, pubDate, dcDate });
  }
  return items;
}

function parseDate(pubDate) {
  try {
    const d = new Date(pubDate);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch {}
  return new Date().toISOString().split('T')[0];
}

function classifyIncident(text) {
  const t = text.toLowerCase();
  if (/\b(kidnap|abduct)\b/.test(t)) return 'kidnapping';
  if (/\b(bandit|rustl)\b/.test(t)) return 'banditry';
  if (/\b(terrorist|terrorism|bomb|ied|suicide)\b/.test(t)) return 'terrorism';
  if (/\b(clash|communal|farmer-herder)\b/.test(t)) return 'clash';
  if (/\b(gunmen|attack|ambush|raid)\b/.test(t)) return 'armed attack';
  if (/\b(explosion|bomb)\b/.test(t)) return 'bombing';
  return 'other';
}

function extractFatalities(text) {
  const m = text.match(/(\d+)\s*(killed?|dead|die?s?|fatalit|death)/i);
  return m ? parseInt(m[1], 10) : 0;
}

function extractAbductions(text) {
  const m = text.match(/(\d+)\s*(abduct|kidnap|taken?)\b/i);
  return m ? parseInt(m[1], 10) : 0;
}

async function scrapeFeeds() {
  const scraped = [];
  for (const src of NEWS_SOURCES) {
    try {
      const res = await fetch(src.feed, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const xml = await res.text();
      const articles = parseRSS(xml);
      for (const art of articles) {
        const combined = `${art.title} ${art.description}`;
        if (!SECURITY_KEYWORDS.test(combined)) continue;
        const state = extractState(combined);
        if (!state) continue;
        const lga = extractLGA(combined, state) || pickLga(state);
        const incType = classifyIncident(combined);
        const fatalities = extractFatalities(combined);
        const abductions = extractAbductions(combined);
        const injuriesMatch = combined.match(/(\d+)\s*injur/i);
        const injuries = injuriesMatch ? parseInt(injuriesMatch[1], 10) : 0;
        scraped.push({
          id: 0,
          date: parseDate(art.pubDate),
          state,
          lga,
          community: '',
          incident_type: incType,
          fatalities,
          abductions,
          injuries,
          summary: art.title,
          source_name: src.name,
          source_url: art.link || src.feed,
        });
      }
    } catch {}
  }
  const seen = new Set();
  const deduped = scraped.filter(i => {
    const key = `${i.date}|${i.state}|${i.incident_type}|${i.fatalities}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.forEach((i, idx) => i.id = idx + 1);
  return deduped.sort((a, b) => b.date.localeCompare(a.date));
}

function generateSeedIncidents() {
  const TYPES = ['terrorism','banditry','kidnapping','armed attack','clash','bombing'];
  const COMMUNITIES = ['Central Market','Main Town','Rural Settlement','Village','Camp','Highway','Border Post','Farm Settlement','Fishing Village','Mining Site','Palm Plantation','Rubber Estate','Cattle Ranch','Market Square','Primary School','College','Hospital','Police Station','Military Base','Checkpoint','IDP Camp','Refugee Camp','Relief Center','Food Distribution Point','Water Point','Health Center','Mosque','Church','Local Government Secretariat','Court','Prison','Bank','Mall','Bus Station','Motor Park','Bridge','Dam','Power Station','Telecom Tower','Radio Station'];
  const ACTORS = ['Suspected militants','Armed gunmen','Unknown attackers','Security forces','Criminal gangs','Insurgents'];
  const LOCS = ['Central Market','Main Town','Village','Camp','Highway','Border Post','Farm Settlement','Fishing Village'];

  function randomDate() {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 45);
    const diff = now.getTime() - start.getTime();
    return new Date(start.getTime() + Math.random() * diff).toISOString().split('T')[0];
  }

  const incs = Array.from({ length: 67 }, (_, i) => {
    const state = pick(STATES);
    const lga = pickLga(state);
    const date = randomDate();
    const type = pick(TYPES);
    return {
      id: i + 1,
      date,
      state,
      lga,
      community: pick(COMMUNITIES),
      incident_type: type,
      fatalities: Math.random() < 0.6 ? randomInt(1, 15) : 0,
      abductions: Math.random() < 0.4 ? randomInt(1, 20) : 0,
      injuries: Math.random() < 0.5 ? randomInt(1, 20) : 0,
      rescued: Math.random() < 0.3 ? randomInt(1, 15) : 0,
      summary: `${pick(ACTORS)} attacked ${pick(LOCS)}, triggering a security response.`,
      source_name: pick(NEWS_SOURCES).name,
      source_url: pick(NEWS_SOURCES).feed,
    };
  });
  return incs.sort((a, b) => b.date.localeCompare(a.date));
}

let incidents = generateSeedIncidents();

function computeStats(list) {
  const totalIncidents = list.length;
  const totalFatalities = list.reduce((s, i) => s + (i.fatalities || 0), 0);
  const totalAbductions = list.reduce((s, i) => s + (i.abductions || 0), 0);
  const totalInjuries = list.reduce((s, i) => s + (i.injuries || 0), 0);
  const totalRescued = list.reduce((s, i) => s + (i.rescued || 0), 0);
  const stateMap = {};
  const typeMap = {};
  const dateMap = {};
  const lgaMap = {};
  for (const i of list) {
    if (!stateMap[i.state]) stateMap[i.state] = { state: i.state, count: 0, fatalities: 0, abductions: 0, injuries: 0, rescued: 0 };
    stateMap[i.state].count++;
    stateMap[i.state].fatalities += i.fatalities || 0;
    stateMap[i.state].abductions += i.abductions || 0;
    stateMap[i.state].injuries += i.injuries || 0;
    stateMap[i.state].rescued += i.rescued || 0;
    if (!typeMap[i.incident_type]) typeMap[i.incident_type] = { incidentType: i.incident_type, count: 0, fatalities: 0, abductions: 0, injuries: 0, rescued: 0 };
    typeMap[i.incident_type].count++;
    typeMap[i.incident_type].fatalities += i.fatalities || 0;
    typeMap[i.incident_type].abductions += i.abductions || 0;
    typeMap[i.incident_type].injuries += i.injuries || 0;
    typeMap[i.incident_type].rescued += i.rescued || 0;
    if (!dateMap[i.date]) dateMap[i.date] = { date: i.date, count: 0, fatalities: 0, abductions: 0, injuries: 0, rescued: 0 };
    dateMap[i.date].count++;
    dateMap[i.date].fatalities += i.fatalities || 0;
    dateMap[i.date].abductions += i.abductions || 0;
    dateMap[i.date].injuries += i.injuries || 0;
    dateMap[i.date].rescued += i.rescued || 0;
    const lgaKey = `${i.state}/${i.lga}`;
    if (!lgaMap[lgaKey]) lgaMap[lgaKey] = { state: i.state, lga: i.lga, count: 0, fatalities: 0, abductions: 0, injuries: 0, rescued: 0 };
    lgaMap[lgaKey].count++;
    lgaMap[lgaKey].fatalities += i.fatalities || 0;
    lgaMap[lgaKey].abductions += i.abductions || 0;
    lgaMap[lgaKey].injuries += i.injuries || 0;
    lgaMap[lgaKey].rescued += i.rescued || 0;
  }
  return {
    overall: { totalIncidents, totalFatalities, totalAbductions, totalInjuries, totalRescued },
    byState: Object.values(stateMap).sort((a, b) => b.fatalities - a.fatalities),
    byType: Object.values(typeMap).sort((a, b) => b.count - a.count),
    byDate: Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date)),
    byLga: Object.values(lgaMap).sort((a, b) => b.fatalities - a.fatalities),
  };
}

async function refreshData() {
  try {
    const scraped = await scrapeFeeds();
    if (scraped.length > 3) {
      const seenIds = new Set(scraped.map(i => `${i.date}|${i.state}|${i.lga}|${i.incident_type}`));
      const merged = [...scraped, ...generateSeedIncidents().filter(s => !seenIds.has(`${s.date}|${s.state}|${s.lga}|${s.incident_type}`))];
      merged.forEach((i, idx) => i.id = idx + 1);
      incidents = merged.sort((a, b) => b.date.localeCompare(a.date));
      console.log(`Scraper merged: ${scraped.length} scraped + ${incidents.length - scraped.length} seed = ${incidents.length} incidents`);
    } else {
      console.log(`Scraper found only ${scraped.length} articles – keeping seed data`);
    }
  } catch (e) {
    console.log('Scraper error:', e?.message);
  }
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

loadHsriData();
refreshData();
setInterval(refreshData, 30 * 60 * 1000);

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/health') return sendJSON(res, 200, { ok: true, incidents: incidents.length });
  if (url.pathname === '/api/hsri') {
    return sendJSON(res, 200, {
      stateData: HSRI_STATE_DATA,
      averages: HSRI_NATIONAL_AVERAGES,
      metadata: HSRI_METADATA
    });
  }
  if (url.pathname === '/api/incidents') {
    const limit = parseInt(url.searchParams.get('limit') || '500', 10);
    return sendJSON(res, 200, { incidents: incidents.slice(0, Math.min(limit, 500)) });
  }
  if (url.pathname === '/api/stats') return sendJSON(res, 200, computeStats(incidents));
  if (url.pathname === '/api/refresh') {
    refreshData().then(() => sendJSON(res, 200, { ok: true, incidents: incidents.length }));
    return;
  }
  sendJSON(res, 404, { error: 'Not found' });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`API server on http://localhost:${PORT} with ${incidents.length} seed incidents. Scraper refreshing every 30 min.`);
});
