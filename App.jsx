import React, { useEffect, useMemo, useState } from "react";
import seedrandom from "seedrandom";
import { sha256 } from "js-sha256";
import QRCode from "qrcode";
import LZString from "lz-string";

// helpers
const b64e = (obj) => LZString.compressToEncodedURIComponent(JSON.stringify(obj));
const b64d = (s) => JSON.parse(LZString.decompressFromEncodedURIComponent(s));
const toSlug = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
const hashNameHex = (name, seed, round) => sha256(toSlug(name) + "|" + seed + "|" + round);
const hexToInt = (hex, len = 12) => parseInt(hex.slice(0, len), 16);
const pickIdx = (rng, arr) => Math.floor(rng() * arr.length);
const seededPick = (arr, seed) => { const rng = seedrandom(seed); return arr[pickIdx(rng, arr)]; };
const copyToClipboard = (text) => navigator.clipboard?.writeText(text).catch(() => {});

// themes
const PAIRS = [
  { main:{label:"Flowers",words:["rose","jasmine","sunflower","lily","tulip","daisy","orchid","marigold","lavender","chrysanthemum","hibiscus","carnation","iris","peony","magnolia","camellia","dahlia","lotus","daffodil","azalea"]},
    impostor:{label:"Grasses",words:["bermuda","ryegrass","fescue","bluegrass","wheatgrass","pampas","reed","bamboo","sedge","timothy","switchgrass","sugarcane","barley","oatgrass","cordgrass","zoysia","bentgrass","foxtail","wild rice","couch grass"]} },
  { main:{label:"Fruits",words:["apple","banana","orange","mango","grape","pineapple","papaya","strawberry","watermelon","kiwi","pear","peach","cherry","plum","apricot","pomegranate","lychee","guava","avocado","lemon"]},
    impostor:{label:"Vegetables",words:["carrot","potato","tomato","cucumber","lettuce","spinach","broccoli","cabbage","cauliflower","eggplant","zucchini","pumpkin","beetroot","radish","celery","asparagus","kale","leek","okra","pepper"]} },
  { main:{label:"Mammals",words:["lion","tiger","elephant","giraffe","zebra","kangaroo","whale","bear","wolf","fox","deer","rabbit","horse","camel","panda","monkey","bat","otter","rhinoceros","hippopotamus"]},
    impostor:{label:"Birds",words:["eagle","sparrow","pigeon","parrot","owl","flamingo","peacock","penguin","swan","duck","goose","turkey","robin","hummingbird","crow","hawk","heron","woodpecker","seagull","canary"]} },
  { main:{label:"Sea Animals",words:["shark","tuna","mackerel","sardine","swordfish","crab","lobster","shrimp","jellyfish","starfish","sea urchin","coral","seahorse","manta ray","clam","oyster","mussel","scallop","anchovy","moray"]},
    impostor:{label:"Freshwater Animals",words:["carp","catfish","tilapia","trout","pike","perch","bass","goldfish","eel","crayfish","frog","salamander","newt","tadpole","pond snail","dragonfly","water strider","freshwater turtle","beaver","muskrat"]} },
  { main:{label:"Kitchen Utensils",words:["spatula","whisk","ladle","tongs","peeler","grater","colander","can opener","rolling pin","garlic press","measuring cup","measuring spoon","potato masher","sieve","zester","skimmer","meat tenderizer","pizza cutter","pastry brush","ice cream scoop"]},
    impostor:{label:"Tableware",words:["plate","bowl","cup","mug","saucer","fork","spoon","knife","chopsticks","teaspoon","tablespoon","dessert fork","soup spoon","salad plate","charger plate","glass","wine glass","tumbler","napkin","placemat"]} },
  { main:{label:"Clothing",words:["shirt","pants","dress","skirt","jacket","coat","sweater","t-shirt","jeans","shorts","blouse","hoodie","suit","socks","leggings","cardigan","overcoat","vest","pajamas","raincoat"]},
    impostor:{label:"Accessories",words:["belt","tie","scarf","hat","cap","gloves","earrings","necklace","bracelet","ring","watch","sunglasses","wallet","handbag","backpack","hairpin","headband","brooch","anklet","cufflinks"]} },
  { main:{label:"Cars (types)",words:["sedan","hatchback","SUV","coupe","convertible","minivan","wagon","pickup","roadster","limousine","microcar","sports car","grand tourer","crossover","muscle car","off-roader","city car","compact","mid-size","full-size"]},
    impostor:{label:"Motorcycles (types)",words:["scooter","moped","sportbike","cruiser","dirt bike","touring bike","naked bike","cafe racer","dual-sport","enduro","chopper","bobber","motocross","trial bike","mini bike","adventure bike","bagger","supermoto","scrambler","commuter"]} },
  { main:{label:"String Instruments",words:["guitar","violin","viola","cello","double bass","harp","banjo","mandolin","ukulele","sitar","lute","zither","lyre","balalaika","erhu","sarod","bouzouki","shamisen","koto","oud"]},
    impostor:{label:"Percussion Instruments",words:["drum","snare","bass drum","cymbal","tambourine","maracas","triangle","xylophone","marimba","glockenspiel","bongos","conga","djembe","timbales","timpani","cajon","castanets","woodblock","cowbell","guiro"]} },
  { main:{label:"Desserts",words:["cake","pie","ice cream","pudding","brownie","cupcake","tart","cheesecake","donut","cookie","trifle","mousse","custard","flan","gelato","sorbet","parfait","macaron","eclair","crepe"]},
    impostor:{label:"Fast Food",words:["burger","fries","pizza","hotdog","fried chicken","taco","burrito","kebab","shawarma","nuggets","sandwich","sub","wrap","pita","corn dog","quesadilla","nachos","falafel","gyro","fish and chips"]} },
  { main:{label:"Office Items",words:["stapler","paperclip","binder","folder","notepad","sticky notes","printer","scanner","shredder","whiteboard","marker","highlighter","ruler","tape dispenser","envelope","stamp","calendar","calculator","file cabinet","desk lamp"]},
    impostor:{label:"School Supplies",words:["pencil","pen","eraser","sharpener","crayon","colored pencil","notebook","glue stick","scissors","protractor","compass","backpack","lunchbox","index card","chalk","blackboard","textbook","worksheet","bookmark","binder paper"]} },
  { main:{label:"Furniture",words:["chair","table","sofa","bed","wardrobe","dresser","nightstand","bookshelf","cabinet","desk","stool","bench","ottoman","coffee table","dining table","vanity","sideboard","armchair","recliner","crib"]},
    impostor:{label:"Appliances",words:["refrigerator","microwave","blender","toaster","oven","stove","dishwasher","washing machine","dryer","rice cooker","kettle","coffee maker","air conditioner","fan","heater","vacuum cleaner","juicer","food processor","slow cooker","pressure cooker"]} },
  { main:{label:"Insects",words:["ant","bee","beetle","butterfly","moth","mosquito","fly","dragonfly","grasshopper","cricket","ladybug","wasp","termite","cockroach","mantis","flea","gnat","firefly","weevil","aphid"]},
    impostor:{label:"Arachnids",words:["spider","scorpion","tick","mite","tarantula","harvestman","whip spider","solifuge","pseudoscorpion","house spider","black widow","brown recluse","wolf spider","jumping spider","orb-weaver","camel spider","scabies mite","chigger","dust mite","tick nymph"]} },
  { main:{label:"Weather",words:["rain","snow","hail","fog","mist","drizzle","thunder","lightning","rainbow","cloud","wind","breeze","storm","blizzard","cyclone","tornado","heatwave","frost","dew","sleet"]},
    impostor:{label:"Natural Disasters",words:["earthquake","tsunami","volcano","landslide","flood","drought","wildfire","avalanche","hurricane","typhoon","storm surge","sinkhole","mudslide","dust storm","ashfall","lahar","ice storm","hailstorm","gale","monsoon"]} },
];

const choosePairIndex = (seed, round) => Math.floor(seedrandom(`${seed}|${round}|pair`)() * PAIRS.length);

function buildImpostorSet(roster, seed, round, impostorCount) {
  const hashed = roster.map((name) => ({
    name,
    hashHex: hashNameHex(name, seed, round),
    hashInt: hexToInt(hashNameHex(name, seed, round), 12)
  }));
  const sorted = [...hashed].sort((a,b)=> a.hashInt - b.hashInt);
  const impostors = new Set(sorted.slice(0, Math.min(impostorCount, sorted.length)).map(x=>x.name));
  return { hashed, impostors, sortedHashes: sorted.map(x=>x.hashHex) };
}
const wordFor = (name, role, pairIndex, seed, round, wordRefresh = 0) => {
  const pair = PAIRS[pairIndex];
  const list = role === "IMPOSTOR" ? pair.impostor.words : pair.main.words;
  const pickSeed = `${seed}|${round}|${wordRefresh}|${toSlug(name)}|word`;
  return seededPick(list, pickSeed);
};
const rolesAndWords = (roster, seed, round, impostorCount, pairIndex, wordRefresh) => {
  const { impostors } = buildImpostorSet(roster, seed, round, impostorCount);
  return roster.map((name)=>{
    const role = impostors.has(name) ? "IMPOSTOR" : "CREW";
    return { name, role, word: wordFor(name, role, pairIndex, seed, round, wordRefresh) };
  });
};
const buildJoinPayload = ({ seed, round, impostorCount, wordRefresh, pairIndex, roster }) => {
  const { sortedHashes } = buildImpostorSet(roster, seed, round, impostorCount);
  return { s: seed, r: round, k: impostorCount, w: wordRefresh, p: pairIndex, list: sortedHashes, n: roster.length };
};

export default function App() {
  // force mode strictly from URL param
  const params = new URLSearchParams(window.location.search);
  const initialMode = params.get("mode") === "player" ? "player" : "admin";
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    const handle = () => {
      const p = new URLSearchParams(window.location.search);
      setMode(p.get("mode") === "player" ? "player" : "admin");
    };
    window.addEventListener("popstate", handle);
    return () => window.removeEventListener("popstate", handle);
  }, []);

  const goAdmin = () => { const u = new URL(window.location.href); u.searchParams.set("mode","admin"); window.location.href = u.toString(); };
  const goPlayer = () => { const u = new URL(window.location.href); u.searchParams.set("mode","player"); window.location.href = u.toString(); };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Among Us – English Club (Web Game)</h1>
          <div className="flex items-center gap-2">
            <button onClick={goAdmin} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${mode==="admin"?"bg-indigo-600 text-white":"bg-white border"}`}>Admin</button>
            <button onClick={goPlayer} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${mode==="player"?"bg-indigo-600 text-white":"bg-white border"}`}>Player</button>
          </div>
        </header>
        {mode === "player" ? <PlayerView /> : <AdminView />}
        <footer className="mt-10 text-xs text-slate-500">
          <p>Roles & words are deterministic per <em>Room Code</em> and <em>Round</em>. Share Player Link/QR for each round.</p>
        </footer>
      </div>
    </div>
  );
}

function AdminView() {
  const [seed, setSeed] = useState(() => localStorage.getItem("au_seed") || randomRoomCode());
  const [round, setRound] = useState(() => Number(localStorage.getItem("au_round") || 1));
  const [impostorCount, setImpostorCount] = useState(() => Number(localStorage.getItem("au_k") || 1));
  const [wordRefresh, setWordRefresh] = useState(() => Number(localStorage.getItem("au_w") || 0));
  const [pairIndex, setPairIndex] = useState(() => Number(localStorage.getItem("au_pair") || choosePairIndex(seed, round)));
  const [roster, setRoster] = useState(() => {
    const raw = localStorage.getItem("au_roster"); return raw ? JSON.parse(raw) : [];
  });
  const [nameInput, setNameInput] = useState("");
  const [hideWords, setHideWords] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);

  useEffect(()=>{ localStorage.setItem("au_seed", seed); }, [seed]);
  useEffect(()=>{ localStorage.setItem("au_round", String(round)); }, [round]);
  useEffect(()=>{ localStorage.setItem("au_k", String(impostorCount)); }, [impostorCount]);
  useEffect(()=>{ localStorage.setItem("au_w", String(wordRefresh)); }, [wordRefresh]);
  useEffect(()=>{ localStorage.setItem("au_pair", String(pairIndex)); }, [pairIndex]);
  useEffect(()=>{ localStorage.setItem("au_roster", JSON.stringify(roster)); }, [roster]);

  const assignments = useMemo(() => rolesAndWords(roster, seed, round, impostorCount, pairIndex, wordRefresh), [roster, seed, round, impostorCount, pairIndex, wordRefresh]);
  const pair = PAIRS[pairIndex] || PAIRS[0];

  async function buildAndSetQr() {
    const payload = buildJoinPayload({ seed, round, impostorCount, wordRefresh, pairIndex, roster });
    const url = new URL(window.location.href);
    url.searchParams.set("mode", "player");
    url.searchParams.set("payload", b64e(payload));
    const dataUrl = await QRCode.toDataURL(url.toString(), { width: 360, margin: 1 });
    setQrUrl(dataUrl);
  }
  useEffect(()=>{ buildAndSetQr(); }, [seed, round, impostorCount, wordRefresh, pairIndex, roster]);

  function addName() {
    const n = nameInput.trim();
    if (!n) return;
    if (roster.includes(n)) return;
    setRoster([...roster, n]); setNameInput("");
  }
  const removeName = (n) => setRoster(roster.filter(x=>x!==n));
  const clearRoster = () => { if (confirm("Clear all names?")) setRoster([]); };
  const nextRound = () => { setRound(round + 1); setWordRefresh(0); setPairIndex(choosePairIndex(seed, round + 1)); };
  const reshuffleWords = () => setWordRefresh(wordRefresh + 1);
  const newRoom = () => { const s = randomRoomCode(); setSeed(s); setRound(1); setWordRefresh(0); setPairIndex(choosePairIndex(s, 1)); };

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-semibold text-lg mb-3">Room Settings</h2>
          <label className="block text-sm font-medium">Room Code</label>
          <div className="flex gap-2 mt-1">
            <input value={seed} onChange={(e)=>setSeed(e.target.value)} className="flex-1 rounded-xl border px-3 py-2"/>
            <button onClick={()=>copyToClipboard(seed)} className="px-3 py-2 rounded-xl border">Copy</button>
            <button onClick={newRoom} className="px-3 py-2 rounded-xl bg-indigo-600 text-white">New</button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-sm font-medium">Round</label>
              <div className="flex items-center gap-2 mt-1">
                <button onClick={()=> setRound(Math.max(1, round-1))} className="px-2 py-1 rounded-lg border">-</button>
                <input value={round} onChange={(e)=>setRound(Number(e.target.value)||1)} className="w-16 text-center rounded-lg border px-2 py-1"/>
                <button onClick={()=> setRound(round+1)} className="px-2 py-1 rounded-lg border">+</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Impostors</label>
              <select value={impostorCount} onChange={(e)=>setImpostorCount(Number(e.target.value))} className="w-full mt-1 rounded-lg border px-2 py-2">
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Pair (Theme)</label>
              <select value={pairIndex} onChange={(e)=>setPairIndex(Number(e.target.value))} className="w-full mt-1 rounded-lg border px-2 py-2">
                {PAIRS.map((p, i)=>(<option key={i} value={i}>{p.main.label} vs {p.impostor.label}</option>))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={nextRound} className="px-3 py-2 rounded-xl bg-emerald-600 text-white">Next Round</button>
            <button onClick={reshuffleWords} className="px-3 py-2 rounded-xl bg-sky-600 text-white">Refresh Words</button>
            <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={hideWords} onChange={(e)=>setHideWords(e.target.checked)} /> Hide words</label>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-semibold text-lg mb-2">Roster</h2>
          <div className="flex gap-2">
            <input value={nameInput} onChange={(e)=>setNameInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter") addName(); }} placeholder="Type a player name…" className="flex-1 rounded-xl border px-3 py-2"/>
            <button onClick={addName} className="px-3 py-2 rounded-xl bg-indigo-600 text-white">Add</button>
            <button onClick={clearRoster} className="px-3 py-2 rounded-xl border">Clear</button>
          </div>
          <div className="mt-3 max-h-48 overflow-auto border rounded-xl p-2 text-sm">
            {roster.length === 0 && <p className="text-slate-500">No players yet.</p>}
            {roster.map(n => (
              <div key={n} className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50">
                <span>{n}</span>
                <button onClick={()=>removeName(n)} className="text-red-600 text-xs">remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-semibold text-lg mb-2">Share Player Link (Round Snapshot)</h2>
          <p className="text-sm text-slate-600">Bagikan link/QR berikut untuk **mode Player**. Link memaksa <code>?mode=player</code> dan menyertakan payload ronde.</p>
          <ShareLink seed={seed} round={round} impostorCount={impostorCount} wordRefresh={wordRefresh} pairIndex={pairIndex} roster={roster} />
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow p-4 overflow-auto">
          <h2 className="font-semibold text-lg mb-2">Assignments</h2>
          {/* table omitted for brevity in fixed package */}
          {rolesAndWords(roster, seed, round, impostorCount, pairIndex, wordRefresh).length === 0 && (<p className="text-slate-500 text-sm">Add player names to generate words & roles.</p>)}
        </div>
      </div>
    </div>
  );
}

function ShareLink({ seed, round, impostorCount, wordRefresh, pairIndex, roster }){
  const [qrUrl, setQrUrl] = useState(null);
  const payloadObj = buildJoinPayload({ seed, round, impostorCount, wordRefresh, pairIndex, roster });
  const shareUrl = (()=>{ const u = new URL(window.location.href); u.searchParams.set("mode","player"); u.searchParams.set("payload", b64e(payloadObj)); return u.toString(); })();

  useEffect(()=>{
    (async () => {
      const dataUrl = await QRCode.toDataURL(shareUrl, { width: 360, margin: 1 });
      setQrUrl(dataUrl);
    })();
  }, [shareUrl]);

  return (
    <div>
      <div className="mt-2 text-xs break-all bg-slate-100 rounded-xl p-2 border">{shareUrl}</div>
      <div className="mt-2 flex gap-2">
        <button onClick={()=>copyToClipboard(shareUrl)} className="px-3 py-2 rounded-xl bg-slate-800 text-white">Copy Link</button>
      </div>
      {qrUrl && <div className="mt-3 flex items-center justify-center">
        <img src={qrUrl} alt="QR code" className="w-56 h-56 rounded-xl border bg-white" />
      </div>}
    </div>
  );
}

function PlayerView() {
  const qs = new URLSearchParams(window.location.search);
  const payloadStr = qs.get("payload") || "";
  const [payloadText, setPayloadText] = useState(payloadStr);
  const [payload, setPayload] = useState(()=>{
    try { return payloadStr ? b64d(payloadStr) : null; } catch { return null; }
  });
  const [name, setName] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(()=>{
    try { if (payloadText) setPayload(b64d(payloadText)); }
    catch { setPayload(null); }
  }, [payloadText]);

  function compute() {
    setError("");
    if (!payload) { setError("Payload/link tidak valid. Minta admin share link/QR untuk ronde ini."); setResult(null); return; }
    const { s, r, k, w, p, list } = payload;
    const h = hashNameHex(name, s, r);
    const exists = list.includes(h);
    if (!exists) { setError("Nama tidak terdaftar untuk ronde ini. Pastikan ejaannya sama persis seperti yang dimasukkan admin."); setResult(null); return; }
    const impostorHashes = new Set([...list].slice(0, Math.min(k, list.length)));
    const role = impostorHashes.has(h) ? "IMPOSTOR" : "CREW";
    const pairIndex = Number(p) || 0;
    const word = wordFor(name, role, pairIndex, s, r, w);
    setResult({ role, word, mainLabel: PAIRS[pairIndex].main.label, impLabel: PAIRS[pairIndex].impostor.label, count: list.length, round: r });
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6">
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-semibold text-lg mb-2">Join Round</h2>
        <p className="text-sm text-slate-600">Jika membuka dari link/QR admin, kolom payload akan terisi otomatis.</p>
        <div className="mt-2">
          <label className="block text-sm font-medium">Payload</label>
          <textarea value={payloadText} onChange={(e)=>setPayloadText(e.target.value)} rows={2} className="w-full rounded-xl border px-3 py-2 text-xs" placeholder="(auto)"/>
        </div>
        <div className="mt-2">
          <label className="block text-sm font-medium">Your Name</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter") compute(); }} className="w-full rounded-xl border px-3 py-2" placeholder="e.g., Asma"/>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={compute} className="px-3 py-2 rounded-xl bg-indigo-600 text-white">Get My Word</button>
          <button onClick={()=>{ setResult(null); setError(""); }} className="px-3 py-2 rounded-xl border">Reset</button>
        </div>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>

      {result && (
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <p className="text-slate-500 text-sm">Round <b>{result.round}</b> · Players joined: <b>{result.count}</b></p>
          <p className="mt-2 text-xs text-slate-500">(Jangan tunjukkan ke orang lain)</p>
          <div className="mt-4">
            <div className="inline-block bg-slate-900 text-white rounded-2xl px-6 py-4 text-3xl font-black tracking-wide select-all">{result.word}</div>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            <p>Theme for crew: <b>{result.mainLabel}</b>. Impostor theme (disembunyikan oleh admin).</p>
          </div>
          <div className="mt-3">
            <button onClick={()=>copyToClipboard(result.word)} className="px-3 py-2 rounded-xl border">Copy Word</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-4 text-sm text-slate-600">
        <p><b>Cara bermain:</b> Deskripsikan kata Anda dalam Bahasa Inggris tanpa menyebut kata.</p>
      </div>
    </div>
  );
}

function randomRoomCode() {
  const words = ["amber","basil","cobalt","dawn","ember","flint","glint","hazel","indigo","jade","kepler","lumen","magma","nectar","onyx","poppy","quartz","raven","saffron","topaz","ultra","velvet","willow","xenon","yarrow","zephyr"];
  const rng = seedrandom(String(Date.now()));
  return `${seededPick(words, rng())}-${Math.floor(100 + rng()*900)}`;
}
