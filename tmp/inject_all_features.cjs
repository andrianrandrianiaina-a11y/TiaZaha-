const fs = require('fs');
const esbuild = require('esbuild');

const filePath = '/app/applet/public/assets/index-CxKXGYsU.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Audio Beep Engine
const audioBeepCode = `
var _audioCtx = null;
var _beepInterval = null;
var _isBeepMuted = false;

function _playBeepTone() {
  if (_isBeepMuted) return;
  try {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') {
      _audioCtx.resume();
    }
    var osc = _audioCtx.createOscillator();
    var gain = _audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, _audioCtx.currentTime); // Note A5 (880Hz)
    osc.frequency.exponentialRampToValueAtTime(1175, _audioCtx.currentTime + 0.12); // High beep
    gain.gain.setValueAtTime(0.2, _audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(_audioCtx.destination);
    osc.start();
    osc.stop(_audioCtx.currentTime + 0.3);
  } catch(e) {}
}

function startAppBeep() {
  if (_isBeepMuted) return;
  if (!_beepInterval) {
    _playBeepTone();
    _beepInterval = setInterval(_playBeepTone, 1400);
  }
}

function stopAppBeep() {
  if (_beepInterval) {
    clearInterval(_beepInterval);
    _beepInterval = null;
  }
}

function toggleBeepMute() {
  _isBeepMuted = !_isBeepMuted;
  if (_isBeepMuted) stopAppBeep();
  return _isBeepMuted;
}
`;

// 2. Define RedAllLeaguesWidget
const redAllLeaguesCode = `
function RedAllLeaguesWidget() {
  var [data, setData] = Y.useState(null);
  var [loading, setLoading] = Y.useState(false);
  var [isOpen, setIsOpen] = Y.useState(true);
  var [muted, setMuted] = Y.useState(false);

  var fetchLeagues = function() {
    fetch("/api/predictions/all-leagues-identical")
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.success) {
          setData(d);
          if (Array.isArray(d.matches) && d.matches.length > 0 && !muted) {
            startAppBeep();
          } else if (!d.matches || d.matches.length === 0) {
            stopAppBeep();
          }
        }
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  };

  Y.useEffect(function() {
    fetchLeagues();
    var iv = setInterval(fetchLeagues, 5000);
    return function() { clearInterval(iv); stopAppBeep(); };
  }, [muted]);

  var matches = (data && data.matches) || [];

  return d.jsxs("div", {
    className: "bg-gradient-to-b from-[#1c080d] via-[#120508] to-black border-2 border-red-500/50 rounded-2xl p-3 md:p-4 mb-4 shadow-[0_4px_25px_rgba(239,68,68,0.25)] text-white font-sans relative overflow-hidden",
    children: [
      d.jsx("div", { className: "absolute -top-12 -right-12 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" }),
      d.jsxs("div", {
        className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-red-500/20 relative z-10",
        children: [
          d.jsxs("div", {
            className: "flex items-center gap-2.5",
            children: [
              d.jsx("div", {
                className: "w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold text-base shadow-[0_0_12px_rgba(239,68,68,0.3)] shrink-0",
                children: "🔴"
              }),
              d.jsxs("div", {
                children: [
                  d.jsxs("div", {
                    className: "flex items-center gap-2 flex-wrap",
                    children: [
                      d.jsx("h2", {
                        className: "text-xs md:text-sm font-black tracking-wider text-white uppercase",
                        children: "TABILAO MENA STANDARD • LIGUE 9 REHETRA"
                      }),
                      d.jsxs("span", {
                        className: "px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[9px] font-black text-red-300 uppercase tracking-widest flex items-center gap-1",
                        children: [
                          d.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" }),
                          "SCAN EN DIRECT (9 LIGUES)"
                        ]
                      }),
                      matches.length > 0 ? d.jsx("span", {
                        className: "px-2 py-0.5 rounded-full bg-red-600/30 border border-red-400 text-[9px] font-black text-red-200 uppercase tracking-widest animate-pulse",
                        children: "🔥 " + matches.length + " LALAO MITOVY 100% HITA"
                      }) : d.jsx("span", {
                        className: "px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-white/50 uppercase tracking-widest",
                        children: "⏳ MIANDRY NY LALAO MANARAKA"
                      })
                    ]
                  }),
                  d.jsxs("p", {
                    className: "text-[9.5px] text-red-200/70 font-medium flex items-center gap-2 mt-0.5 flex-wrap",
                    children: [
                      d.jsx("span", { children: "Fikarohana lalao mitovy 100% cotes sy ekipa amin ny Ligy 9 miaraka (English, Italian, Spanish, German, French, Dutch, Champions, Euro/Asie, World Cup)" }),
                      d.jsx("span", { className: "text-white/40", children: "•" }),
                      d.jsx("span", { className: "text-red-300/80 font-mono text-[9px]", children: "Auto-Scan isaky ny 5s" })
                    ]
                  })
                ]
              })
            ]
          }),
          d.jsxs("div", {
            className: "flex items-center gap-2 shrink-0 self-end sm:self-auto",
            children: [
              d.jsxs("button", {
                onClick: function() {
                  var m = toggleBeepMute();
                  setMuted(m);
                },
                className: "px-2.5 py-1 border rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all " +
                  (muted ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30"),
                title: muted ? "Alefaso ny feo beep" : "Atsaharo ny feo beep",
                children: [
                  d.jsx("span", { children: muted ? "🔇" : "🔊" }),
                  muted ? "Feo Beep (Natsahatra)" : "Feo Beep (Mandeha)"
                ]
              }),
              d.jsxs("button", {
                onClick: function() { setLoading(true); fetchLeagues(); },
                disabled: loading,
                className: "px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 active:scale-95 border border-red-500/40 rounded-lg text-[9px] font-bold text-red-300 flex items-center gap-1 transition-all",
                children: [
                  d.jsx("span", { className: loading ? "animate-spin" : "", children: "🔄" }),
                  loading ? "..." : "Havaozy"
                ]
              }),
              d.jsx("button", {
                onClick: function() { setIsOpen(!isOpen); },
                className: "px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/60",
                children: isOpen ? "Afeno ▲" : "Asehoy Tabilao ▼"
              })
            ]
          })
        ]
      }),
      isOpen && (
        matches.length === 0 ? d.jsxs("div", {
          className: "p-6 md:p-8 text-center border border-dashed border-red-500/20 rounded-xl bg-red-950/10 space-y-2",
          children: [
            d.jsx("div", { className: "text-2xl animate-pulse", children: "⏳" }),
            d.jsx("div", { className: "font-black text-white text-xs md:text-sm", children: "Tsy mbola misy lalao mitovy 100% amin ny tahiry amin ireo Ligy 9 amin izao fotoana izao" }),
            d.jsxs("div", {
              className: "mt-2 p-2.5 rounded-lg bg-black/60 border border-red-500/30 text-[10px] text-red-200/90 max-w-lg mx-auto flex items-center justify-center gap-2",
              children: [
                d.jsx("span", { className: "w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" }),
                d.jsx("span", {
                  children: "Manara-maso mivantana ny Ligy 9 rehetra... Raha vantany vao misy lalao mitovy 100% ny ekipa sy ny cotes dia hiseho avy hatrany eto ary haneno ny feo beep !"
                })
              ]
            }),
            d.jsx("div", { className: "text-[9px] text-white/40 mt-2 font-mono", children: "📡 Live Scanning actif sur les 9 ligues virtuelles • Beep alerte automatique" })
          ]
        }) : d.jsx("div", {
          className: "space-y-3",
          children: matches.map(function(mItem, idx) {
            var exactScore = mItem.predictedExactScore || "1-1";
            var altScore = mItem.alternativeScore;
            var histScores = mItem.allHistoricalScores || [];

            return d.jsxs("div", {
              className: "rounded-xl border-2 border-red-500/60 bg-gradient-to-r from-red-600/[0.12] via-[#16070a] to-black p-3 md:p-4 shadow-[0_4px_20px_rgba(239,68,68,0.2)] relative overflow-hidden transition-all duration-200",
              children: [
                d.jsxs("div", {
                  className: "flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2.5 border-b border-red-500/20",
                  children: [
                    d.jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        d.jsx("span", { className: "text-red-400 text-sm animate-bounce", children: "🔴" }),
                        d.jsxs("div", {
                          children: [
                            d.jsxs("div", {
                              className: "font-black text-white text-xs md:text-sm tracking-wide flex items-center gap-2 flex-wrap",
                              children: [
                                d.jsxs("span", { className: "px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-[9px] font-bold text-red-300 font-mono", children: [mItem.leagueFlag || "⚽", " ", mItem.leagueName || ("Ligy " + mItem.leagueId)] }),
                                d.jsx("span", { className: "text-emerald-400 font-bold", children: "[DOM] " }),
                                mItem.team1,
                                d.jsx("span", { className: "text-amber-400 font-mono text-xs", children: "vs" }),
                                mItem.team2,
                                d.jsx("span", { className: "text-rose-400 font-bold", children: " [EXT]" })
                              ]
                            }),
                            d.jsxs("div", {
                              className: "flex items-center gap-2 text-[10px] text-white/50 font-mono mt-0.5",
                              children: [
                                d.jsxs("span", { className: "text-red-300 font-bold", children: [mItem.round || ("Round " + mItem.roundNumber)] }),
                                d.jsx("span", { children: "•" }),
                                d.jsxs("span", { className: "text-white/60", children: ["Manomboka: ", mItem.expectedStart ? new Date(mItem.expectedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Ho avy"] })
                              ]
                            })
                          ]
                        })
                      ]
                    }),
                    d.jsxs("div", {
                      className: "flex items-center gap-2 self-start md:self-auto",
                      children: [
                        d.jsx("span", {
                          className: "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-400/40 animate-pulse",
                          children: "🔥 100% Cotes & Ekipa Mitovy"
                        })
                      ]
                    })
                  ]
                }),
                d.jsxs("div", {
                  className: "grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-3 items-center",
                  children: [
                    d.jsxs("div", {
                      className: "p-2 rounded-lg bg-black/60 border border-red-500/20",
                      children: [
                        d.jsx("div", { className: "text-[9px] font-mono text-white/50 uppercase", children: "Cotes 1X2 Mitovy Tanteraka" }),
                        d.jsxs("div", {
                          className: "flex items-center gap-3 font-mono font-bold text-xs mt-1",
                          children: [
                            d.jsxs("span", { className: "text-emerald-400", children: ["1: ", mItem.odds1 || "-"] }),
                            d.jsx("span", { className: "text-white/20", children: "|" }),
                            d.jsxs("span", { className: "text-amber-400", children: ["X: ", mItem.oddsN || "-"] }),
                            d.jsx("span", { className: "text-white/20", children: "|" }),
                            d.jsxs("span", { className: "text-rose-400", children: ["2: ", mItem.odds2 || "-"] })
                          ]
                        })
                      ]
                    }),
                    d.jsxs("div", {
                      className: "p-2 rounded-lg bg-red-950/30 border border-red-500/30",
                      children: [
                        d.jsx("div", { className: "text-[9px] font-mono text-red-300/70 uppercase", children: "Pronostic Total Buts" }),
                        d.jsx("div", { className: "font-black text-xs text-white mt-1", children: mItem.predictionAssuree })
                      ]
                    }),
                    d.jsxs("div", {
                      className: "p-2 rounded-lg bg-black/60 border border-red-500/20",
                      children: [
                        d.jsx("div", { className: "text-[9px] font-mono text-white/50 uppercase flex items-center justify-between", children: [d.jsx("span", { children: "Score Exact Voatahiry" }), altScore && d.jsxs("span", { className: "text-white/40 text-[8.5px]", children: ["Alt: ", altScore] })] }),
                        d.jsxs("div", {
                          className: "flex items-center gap-2 mt-1",
                          children: [
                            d.jsx("span", { className: "px-2 py-0.5 rounded font-black font-mono text-sm bg-red-500/20 text-red-200 border border-red-400/40", children: exactScore }),
                            histScores.length > 0 && d.jsxs("span", {
                              className: "text-[9px] font-mono text-amber-300/80 bg-black/40 px-1.5 py-0.5 rounded border border-amber-500/20",
                              children: ["Score(s) niseho: ", histScores.join(", ")]
                            })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            }, mItem.id || idx);
          })
        })
      )
    ]
  });
}
`;

// Inject RedAllLeaguesWidget before StoredStatsWidget
const targetSSW = 'function StoredStatsWidget(){';
if (!content.includes(targetSSW)) {
  console.error('Target StoredStatsWidget not found!');
  process.exit(1);
}

// 3. New enhanced StoredStatsWidget with Export & Import buttons
const newStoredStatsWidget = `
function StoredStatsWidget(){
  const[s,setS]=Y.useState(null),[ld,setLd]=Y.useState(!1),[op,setOp]=Y.useState(!0),[impMsg,setImpMsg]=Y.useState(null);
  const fileInputRef=Y.useRef(null);
  const rf=()=>{setLd(!0),fetch("/api/storage/statistics").then(r=>r.json()).then(d=>{d&&d.success&&setS(d),setLd(!1)}).catch(()=>setLd(!1))};
  Y.useEffect(()=>{rf();const iv=setInterval(rf,15e3);return()=>clearInterval(iv)},[]);

  const handleImportFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setLd(true);
        fetch("/api/storage/import-json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json)
        })
        .then(r => r.json())
        .then(res => {
          setLd(false);
          if (res.success) {
            setImpMsg(res.message);
            rf();
            setTimeout(() => setImpMsg(null), 7000);
          } else {
            alert("Tsy tafiditra: " + (res.error || "Erreur"));
          }
        })
        .catch(err => {
          setLd(false);
          alert("Erreur réseau: " + err.message);
        });
      } catch (err) {
        alert("Fichier JSON tsy mety: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if(!s)return null;
  const dsc=s.totalGoalsDistribution||{};
  return d.jsxs("div",{className:"bg-[#121217] border border-white/10 rounded-xl p-3 md:p-4 mb-4 shadow-xl text-white font-sans",children:[
    d.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-white/5",children:[
      d.jsxs("div",{className:"flex items-center gap-2.5",children:[
        d.jsx("span",{className:"text-lg",children:"📊"}),
        d.jsxs("div",{children:[
          d.jsx("h3",{className:"text-xs md:text-sm font-black tracking-wide text-white uppercase",children:"Tabilao Antontanisa Lalao Voatahiry (Statistiques JSON)"}),
          d.jsxs("p",{className:"text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1.5 mt-0.5",children:[
            d.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"}),
            "Tahiry Maharitra: "+(s.totalMatches||0).toLocaleString()+" lalao ao amin ny JSON Server (Tsy misy doublons • Tsy misy lalao tsy misy cote)"
          ]})
        ]})
      ]}),
      d.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap",children:[
        d.jsxs("a",{href:"/api/storage/export-json",download:"tiazaha_officiel_rounds_storage.json",className:"px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-[9px] font-bold text-emerald-300 flex items-center gap-1 transition-all",children:[d.jsx("span",{children:"📥"}),"Télécharger JSON"]}),
        d.jsxs("button",{onClick:()=>fileInputRef.current&&fileInputRef.current.click(),className:"px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-[9px] font-bold text-amber-300 flex items-center gap-1 transition-all cursor-pointer",children:[d.jsx("span",{children:"📤"}),"Importer JSON"]}),
        d.jsx("input",{ref:fileInputRef,type:"file",accept:".json",className:"hidden",onChange:handleImportFile}),
        d.jsxs("button",{onClick:rf,disabled:ld,className:"px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 active:scale-95 border border-sky-500/30 rounded-lg text-[9px] font-bold text-sky-400 flex items-center gap-1 transition-all",children:[d.jsx("span",{className:ld?"animate-spin":"",children:"🔄"}),ld?"Eo am-pampifanarahana...":"Havaozy (Sync)"]}),
        d.jsx("button",{onClick:()=>setOp(!op),className:"px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/60",children:op?"Afeno ▲":"Asehoy Tabilao ▼"})
      ]})
    ]}),
    impMsg&&d.jsxs("div",{className:"mb-3 p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-2",children:[d.jsx("span",{children:"✅"}),impMsg]}),
    op&&d.jsx("div",{className:"overflow-x-auto",children:d.jsxs("table",{className:"w-full text-left text-[10px] border-collapse",children:[
      d.jsx("thead",{children:d.jsxs("tr",{className:"text-white/40 border-b border-white/5 text-[8.5px] uppercase tracking-wider",children:[d.jsx("th",{className:"py-1.5 px-2",children:"Sokajy (Indicateur)"}),d.jsx("th",{className:"py-1.5 px-2 text-center",children:"Isany (Valeur)"}),d.jsx("th",{className:"py-1.5 px-2",children:"Fanamarihana (Détails)"})]})}),
      d.jsxs("tbody",{className:"divide-y divide-white/5 font-mono",children:[
        d.jsxs("tr",{className:"hover:bg-white/[0.02]",children:[d.jsxs("td",{className:"py-1.5 px-2 font-sans font-bold flex items-center gap-1.5",children:[d.jsx("span",{children:"📁"}),"Total Lalao Voatahiry"]}),d.jsx("td",{className:"py-1.5 px-2 text-center font-black text-amber-400 text-[11px]",children:(s.totalMatches||0).toLocaleString()}),d.jsx("td",{className:"py-1.5 px-2 text-white/50 text-[9px] font-sans",children:"Voatahiry ao amin ny rounds_storage.json ("+(s.totalRounds||0)+" Rounds voarakitra • 100% misy cote)"})]}),
        d.jsxs("tr",{className:"hover:bg-white/[0.02]",children:[d.jsxs("td",{className:"py-1.5 px-2 font-sans font-bold flex items-center gap-1.5",children:[d.jsx("span",{children:"🏁"}),"Lalao Vita vs Ho Avy (Upcoming)"]}),d.jsxs("td",{className:"py-1.5 px-2 text-center font-bold text-white",children:[s.totalFinished," / ",d.jsx("span",{className:"text-sky-400",children:s.totalUpcoming})]}),d.jsxs("td",{className:"py-1.5 px-2 text-white/50 text-[9px] font-sans",children:[s.totalFinished," Vita • ",s.totalUpcoming," Ho Avy (Upcoming matches voatahiry)"]})]}),
        d.jsxs("tr",{className:"hover:bg-white/[0.02] bg-emerald-500/[0.02]",children:[d.jsxs("td",{className:"py-1.5 px-2 font-sans font-bold flex items-center gap-1.5 text-emerald-300",children:[d.jsx("span",{children:"🎯"}),"Prédictions Gagnées (Won)"]}),d.jsxs("td",{className:"py-1.5 px-2 text-center font-black text-emerald-400 text-[11px]",children:[s.winRate," (",s.wonCount,")"]}),d.jsxs("td",{className:"py-1.5 px-2 text-white/50 text-[9px] font-sans",children:[d.jsx("span",{className:"text-emerald-400 font-bold",children:s.wonCount+" Gagné (Won)"})," • ",d.jsx("span",{className:"text-rose-400",children:s.lostCount+" Perdu"})]})]}),
        d.jsxs("tr",{className:"hover:bg-white/[0.02] bg-amber-500/[0.03]",children:[d.jsxs("td",{className:"py-1.5 px-2 font-sans font-bold text-amber-300 flex items-center gap-1.5",children:[d.jsx("span",{children:"📌"}),"Cotes 100% Identiques (Épinglés)"]}),d.jsxs("td",{className:"py-1.5 px-2 text-center font-black text-amber-400 text-[11px]",children:[s.identicalOddsMatchesCount," lalao"]}),d.jsx("td",{className:"py-1.5 px-2 text-amber-300/80 text-[9px] font-sans",children:"Matchs épinglés au sommet • Taux de réussite: "+s.identicalOddsWinRate})]}),
        d.jsxs("tr",{className:"hover:bg-white/[0.02]",children:[d.jsxs("td",{className:"py-1.5 px-2 font-sans font-bold flex items-center gap-1.5",children:[d.jsx("span",{children:"⚽"}),"Multi-Buts (1-4 Buts)"]}),d.jsx("td",{className:"py-1.5 px-2 text-center font-bold text-emerald-300",children:(dsc.multi1to4||0).toLocaleString()}),d.jsx("td",{className:"py-1.5 px-2 text-white/50 text-[9px] font-sans",children:"Lalao nisy 1 ka hatramin ny 4 baolina"})]}),
        d.jsxs("tr",{className:"hover:bg-white/[0.02]",children:[d.jsxs("td",{className:"py-1.5 px-2 font-sans font-bold flex items-center gap-1.5",children:[d.jsx("span",{children:"📉"}),"Under / Over 2.5 Buts"]}),d.jsxs("td",{className:"py-1.5 px-2 text-center font-bold text-purple-300",children:["U: "+(dsc.under25||0)+" / O: "+(dsc.over25||0)]}),d.jsx("td",{className:"py-1.5 px-2 text-white/50 text-[9px] font-sans",children:"Fizarana lalao Moins de 2.5 sy Plus de 2.5"})]})
      ]})
    ]})})
  ]});
}
`;

// Replace StoredStatsWidget definition with AudioEngine + RedAllLeaguesWidget + Enhanced StoredStatsWidget
// First find end of old StoredStatsWidget
const oldWidgetStart = content.indexOf('function StoredStatsWidget(){');
const oldWidgetEnd = content.indexOf('function AH({children:e,activeTab:t', oldWidgetStart);

if (oldWidgetStart === -1 || oldWidgetEnd === -1) {
  console.error('Could not locate old StoredStatsWidget bounds!');
  process.exit(1);
}

content = content.substring(0, oldWidgetStart) +
  audioBeepCode + '\n' +
  redAllLeaguesCode + '\n' +
  newStoredStatsWidget + '\n' +
  content.substring(oldWidgetEnd);

// Mount RedAllLeaguesWidget below TeamStorageSearchWidget
const targetRender = 'd.jsx(PinnedUpcomingWidget,{}),d.jsx(TeamStorageSearchWidget,{}),d.jsx(StoredStatsWidget,{})';
const replacementRender = 'd.jsx(PinnedUpcomingWidget,{}),d.jsx(TeamStorageSearchWidget,{}),d.jsx(RedAllLeaguesWidget,{}),d.jsx(StoredStatsWidget,{})';

if (!content.includes(targetRender)) {
  console.error('Target render sequence not found!');
  process.exit(1);
}

content = content.replace(targetRender, replacementRender);

// Also in PinnedUpcomingWidget, trigger beep if m.length > 0
const targetPinnedBeep = 'if (d && d.success) setData(d);';
const replacementPinnedBeep = 'if (d && d.success) { setData(d); if (Array.isArray(d.matches) && d.matches.length > 0) { startAppBeep(); } }';
if (content.includes(targetPinnedBeep)) {
  content = content.replace(targetPinnedBeep, replacementPinnedBeep);
}

// Validate syntax with esbuild
try {
  esbuild.transformSync(content, { loader: 'js' });
  console.log('ESBUILD SYNTAX VALIDATION: SUCCESS 100%!');
  fs.writeFileSync(filePath, content, 'utf8');
  fs.writeFileSync('/app/applet/dist/assets/index-CxKXGYsU.js', content, 'utf8');
  console.log('Successfully written to public and dist bundles!');
} catch (err) {
  console.error('ESBUILD SYNTAX ERROR:', err.message);
  process.exit(1);
}
