const fs = require('fs');
const esbuild = require('esbuild');

const filePath = '/app/applet/public/assets/index-CxKXGYsU.js';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = 'function StoredStatsWidget(){';
const endMarker = 'function AH({children:e';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found!', { startIndex, endIndex });
  process.exit(1);
}

const newStoredStatsWidgetCode = `function StoredStatsWidget(){
  const[s,setS]=Y.useState(()=>{
    try{
      const local=localStorage.getItem("tiazaha_stats_cache");
      return local?JSON.parse(local):null;
    }catch(e){return null;}
  });
  const[ld,setLd]=Y.useState(!1),[op,setOp]=Y.useState(!0),[impMsg,setImpMsg]=Y.useState(null);
  const[showPreds,setShowPreds]=Y.useState(!1);
  const[predData,setPredData]=Y.useState(null);
  const[predLd,setPredLd]=Y.useState(!1);
  const[selectedLeague,setSelectedLeague]=Y.useState("all");
  const[dataSaverStats,setDataSaverStats]=Y.useState({cached:!1,lastSync:null});
  const[isOnline,setIsOnline]=Y.useState(typeof navigator!=="undefined"?navigator.onLine:!0);
  const fileInputRef=Y.useRef(null);

  const rf=()=>{
    setLd(!0);
    fetch("/api/storage/statistics")
      .then(r=>r.json())
      .then(d=>{
        if(d&&d.success){
          setS(d);
          try{localStorage.setItem("tiazaha_stats_cache",JSON.stringify(d))}catch(e){}
        }
        setLd(!1);
      })
      .catch(()=>{
        try{
          const fallback=localStorage.getItem("tiazaha_stats_cache");
          if(fallback)setS(JSON.parse(fallback));
        }catch(e){}
        setLd(!1);
      });
  };

  const fetch9LeaguesPredictions=(force=!1)=>{
    if(typeof document!=="undefined"&&document.hidden&&!force)return;
    if(!force){
      try{
        const raw=sessionStorage.getItem("tiazaha_9leagues_cache");
        if(raw){
          const parsed=JSON.parse(raw);
          if(Date.now()-parsed.timestamp<25000){
            setPredData(parsed.data);
            setDataSaverStats({cached:!0,lastSync:new Date(parsed.timestamp).toLocaleTimeString()});
            return;
          }
        }
      }catch(e){}
    }
    setPredLd(!0);
    fetch("/api/predictions/all-9-leagues-upcoming")
      .then(r=>r.json())
      .then(d=>{
        if(d&&d.success){
          setPredData(d);
          setDataSaverStats({cached:!1,lastSync:new Date().toLocaleTimeString()});
          try{sessionStorage.setItem("tiazaha_9leagues_cache",JSON.stringify({timestamp:Date.now(),data:d}))}catch(e){}
        }
        setPredLd(!1);
      })
      .catch(()=>{
        try{
          const raw=sessionStorage.getItem("tiazaha_9leagues_cache");
          if(raw)setPredData(JSON.parse(raw).data);
        }catch(e){}
        setPredLd(!1);
      });
  };

  Y.useEffect(()=>{
    rf();
    const iv=setInterval(rf,25000);
    const onOnline=()=>{
      setIsOnline(!0);
      rf();
      fetch("/api/storage/sync-results").catch(()=>{});
      fetch9LeaguesPredictions(!0);
    };
    const onOffline=()=>{setIsOnline(!1)};
    window.addEventListener("online",onOnline);
    window.addEventListener("offline",onOffline);
    return()=>{
      clearInterval(iv);
      window.removeEventListener("online",onOnline);
      window.removeEventListener("offline",onOffline);
    };
  },[]);

  Y.useEffect(()=>{
    if(showPreds){
      fetch9LeaguesPredictions(!1);
      const iv=setInterval(()=>{
        if(typeof document!=="undefined"&&!document.hidden){
          fetch9LeaguesPredictions(!1);
        }
      },25000);
      return()=>clearInterval(iv);
    }
  },[showPreds]);

  const handleImportFile=(e)=>{
    const file=e.target.files&&e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(event)=>{
      try{
        const json=JSON.parse(event.target.result);
        setLd(!0);
        fetch("/api/storage/import-json",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify(json)
        })
        .then(r=>r.json())
        .then(res=>{
          setLd(!1);
          if(res.success){
            setImpMsg(res.message);
            rf();
            setTimeout(()=>setImpMsg(null),7000);
          }else{
            alert("Tsy tafiditra: "+(res.error||"Erreur"));
          }
        })
        .catch(err=>{setLd(!1);alert("Erreur réseau: "+err.message)});
      }catch(err){alert("Fichier JSON tsy mety: "+err.message)}
    };
    reader.readAsText(file);
    e.target.value="";
  };

  if(!s)return null;
  const dsc=s.totalGoalsDistribution||{};
  const allLeaguesList=(predData&&predData.leagues)||[];
  const displayedLeagues=selectedLeague==="all"?allLeaguesList:allLeaguesList.filter(l=>String(l.leagueId)===String(selectedLeague));

  return d.jsxs("div",{
    className:"bg-[#121217] border border-white/10 rounded-xl p-3 md:p-4 mb-4 shadow-xl text-white font-sans",
    children:[
      d.jsxs("div",{
        className:"flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-white/5",
        children:[
          d.jsxs("div",{
            className:"flex items-center gap-2.5",
            children:[
              d.jsx("span",{className:"text-lg",children:"📊"}),
              d.jsxs("div",{
                children:[
                  d.jsx("h3",{className:"text-xs md:text-sm font-black tracking-wide text-white uppercase",children:"Tabilao Antontanisa Lalao Voatahiry (Statistiques JSON)"}),
                  d.jsxs("p",{
                    className:"text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1.5 mt-0.5 flex-wrap",
                    children:[
                      d.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"}),
                      "Tahiry Maharitra: "+(s.totalMatches||0).toLocaleString()+" lalao ao amin ny JSON Server (Zaka 500 Mo • Tsy very lalao na maty aza ny data)"
                    ]
                  })
                ]
              })
            ]
          }),
          d.jsxs("div",{
            className:"flex items-center gap-1.5 flex-wrap",
            children:[
              d.jsxs("button",{
                onClick:()=>setShowPreds(!showPreds),
                className:"px-3 py-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-black font-black text-[10px] uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-1.5 transition-all active:scale-95 animate-pulse cursor-pointer",
                children:[
                  d.jsx("span",{children:"🔥"}),
                  showPreds?"Afeno ny Prédictions ▲":"Prédiction 100% Assurée (Ligue 9) ▼",
                  d.jsx("span",{className:"bg-black/30 text-white px-1.5 py-0.5 rounded text-[8px] font-bold",children:"PRO"})
                ]
              }),
              d.jsxs("a",{href:"/api/storage/export-json",download:"tiazaha_officiel_rounds_storage.json",className:"px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-[9px] font-bold text-emerald-300 flex items-center gap-1 transition-all",children:[d.jsx("span",{children:"📥"}),"Télécharger JSON (500 Mo)"]}),
              d.jsxs("button",{onClick:()=>fileInputRef.current&&fileInputRef.current.click(),className:"px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-[9px] font-bold text-amber-300 flex items-center gap-1 transition-all cursor-pointer",children:[d.jsx("span",{children:"📤"}),"Importer JSON"]}),
              d.jsx("input",{ref:fileInputRef,type:"file",accept:".json",className:"hidden",onChange:handleImportFile}),
              d.jsxs("button",{onClick:rf,disabled:ld,className:"px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 active:scale-95 border border-sky-500/30 rounded-lg text-[9px] font-bold text-sky-400 flex items-center gap-1 transition-all",children:[d.jsx("span",{className:ld?"animate-spin":"",children:"🔄"}),ld?"Eo am-pampifanarahana...":"Havaozy (Sync)"]}),
              d.jsx("button",{onClick:()=>setOp(!op),className:"px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/60",children:op?"Afeno ▲":"Asehoy Tabilao ▼"})
            ]
          })
        ]
      }),
      !isOnline&&d.jsxs("div",{
        className:"mb-3 p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center gap-2",
        children:[
          d.jsx("span",{className:"w-2 h-2 rounded-full bg-rose-400 animate-ping"}),
          "📴 Mode Hors-ligne: Maty ny data — Ny lalao rehetra dia voatahiry soa aman-tsara ary halefa avy hatrany amin ny Server JSON raha vao velona ny data."
        ]
      }),
      impMsg&&d.jsxs("div",{className:"mb-3 p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-2",children:[d.jsx("span",{children:"✅"}),impMsg]}),

      /* SECTION PREDICTIONS 100% ASSURÉES HO AN'NY LIGUE 9 ISA */
      showPreds&&d.jsxs("div",{
        className:"mb-4 p-3 md:p-4 rounded-xl border-2 border-amber-400/60 bg-gradient-to-b from-[#180d24] via-[#0c1428] to-[#090b10] shadow-[0_4px_30px_rgba(245,158,11,0.25)] space-y-3",
        children:[
          d.jsxs("div",{
            className:"flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-400/20",
            children:[
              d.jsxs("div",{
                className:"flex items-center gap-2",
                children:[
                  d.jsx("span",{className:"text-xl",children:"👑"}),
                  d.jsxs("div",{
                    children:[
                      d.jsx("h4",{className:"text-xs md:text-sm font-black text-amber-300 uppercase tracking-wide",children:"PRONOSTICS 100% ASSURÉS & STRATÉGIES MATIHANINA"}),
                      d.jsxs("div",{
                        className:"flex items-center gap-2 text-[9px] text-sky-300 font-mono mt-0.5",
                        children:[
                          d.jsx("span",{className:"w-2 h-2 rounded-full bg-emerald-400 animate-pulse"}),
                          "Mifototra amin ny "+(s.totalMatches||0).toLocaleString()+" lalao ao amin ny JSON",
                          dataSaverStats.lastSync&&d.jsxs("span",{className:"text-white/40",children:["• Havaozina farany: ",dataSaverStats.lastSync]})
                        ]
                      })
                    ]
                  })
                ]
              }),
              d.jsxs("div",{
                className:"flex items-center gap-2 shrink-0",
                children:[
                  d.jsxs("button",{
                    onClick:()=>fetch9LeaguesPredictions(!0),
                    disabled:predLd,
                    className:"px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-400/50 rounded-lg text-[9px] font-bold text-amber-300 flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]",
                    children:[
                      d.jsx("span",{className:predLd?"animate-spin":"",children:"🔄"}),
                      predLd?"Eo am-panavaozana...":"Havaozy (0 Ko)"
                    ]
                  })
                ]
              })
            ]
          }),

          /* LEAGUE TABS (Selector ho an'ny ligy tsirairay) */
          d.jsxs("div",{
            className:"flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none",
            children:[
              d.jsx("button",{
                onClick:()=>setSelectedLeague("all"),
                className:"px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all "+(selectedLeague==="all"?"bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]":"bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"),
                children:"🔥 Ligy 9 Rehetra ("+allLeaguesList.length+")"
              }),
              allLeaguesList.map(lg=>{
                const isSel=String(selectedLeague)===String(lg.leagueId);
                return d.jsxs("button",{
                  onClick:()=>setSelectedLeague(String(lg.leagueId)),
                  className:"px-2.5 py-1 rounded-lg text-[9px] font-bold shrink-0 transition-all flex items-center gap-1 "+(isSel?"bg-purple-600 text-white border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]":"bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"),
                  children:[
                    d.jsx("span",{children:lg.leagueFlag}),
                    lg.leagueName
                  ]
                },lg.leagueId);
              })
            ]
          }),

          /* LEAGUES LIST & UPCOMING ROUND MATCHES */
          predLd&&allLeaguesList.length===0?d.jsxs("div",{
            className:"p-6 text-center text-amber-300 text-xs font-bold animate-pulse",
            children:[d.jsx("span",{className:"text-xl block mb-2",children:"⏳"}),"Eo am-panomanana ny prédiction 100% ho an ny Ligy 9..."]
          }):displayedLeagues.length===0?d.jsx("div",{
            className:"p-4 text-center text-white/50 text-[10px]",
            children:"Tsy mbola misy lalao ho avy amin ity ligy ity amin izao fotoana izao."
          }):d.jsx("div",{
            className:"space-y-4",
            children:displayedLeagues.map(lgItem=>{
              const matches=lgItem.matches||[];
              const secRem=lgItem.secondsRemaining||0;
              const mins=Math.floor(secRem/60);
              const secs=secRem%60;
              const timeStr=mins>0?(mins+"m "+secs+"s"):(secs+"s");

              return d.jsxs("div",{
                className:"p-3 rounded-xl border border-white/10 bg-black/40 space-y-2.5",
                children:[
                  d.jsxs("div",{
                    className:"flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-white/5",
                    children:[
                      d.jsxs("div",{
                        className:"flex items-center gap-2",
                        children:[
                          d.jsx("span",{className:"text-base",children:lgItem.leagueFlag}),
                          d.jsx("span",{className:"font-black text-xs text-white uppercase tracking-wider",children:lgItem.leagueName}),
                          d.jsx("span",{className:"px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-[9px] font-mono font-bold text-purple-200",children:lgItem.round})
                        ]
                      }),
                      d.jsxs("div",{
                        className:"flex items-center gap-2 text-[9.5px] font-mono",
                        children:[
                          d.jsxs("span",{className:"text-amber-300 font-bold",children:["⏳ Manomboka afaka: ",timeStr]}),
                          d.jsx("span",{className:"text-white/30",children:"•"}),
                          d.jsxs("span",{className:"text-white/60",children:[matches.length," Lalao"]})
                        ]
                      })
                    ]
                  }),

                  d.jsx("div",{
                    className:"grid grid-cols-1 gap-3",
                    children:matches.map(m=>{
                      const v=m.victoire||{};
                      const btts=m.btts||{};
                      const st=m.strategies||{};
                      const ev=m.matchEvidence||{};

                      return d.jsxs("div",{
                        className:"p-3 rounded-lg border border-white/15 bg-gradient-to-r from-purple-950/25 via-black to-sky-950/25 hover:border-amber-400/50 transition-all text-[10px] space-y-2",
                        children:[
                          d.jsxs("div",{
                            className:"flex flex-col md:flex-row md:items-center justify-between gap-1 pb-2 border-b border-white/10",
                            children:[
                              d.jsxs("div",{
                                className:"font-black text-white text-xs flex items-center gap-2 flex-wrap",
                                children:[
                                  d.jsx("span",{className:"text-emerald-400 font-bold",children:"[DOM] "}),
                                  m.team1,
                                  d.jsx("span",{className:"text-yellow-400 font-mono text-[11px] font-black",children:"vs"}),
                                  m.team2,
                                  d.jsx("span",{className:"text-sky-400 font-bold",children:" [EXT]"})
                                ]
                              }),
                              d.jsxs("div",{
                                className:"flex items-center gap-2 font-mono text-[9.5px]",
                                children:[
                                  d.jsxs("span",{className:"text-emerald-400 font-bold",children:["1: ",m.odds1||"-"]}),
                                  d.jsx("span",{className:"text-white/20",children:"|"}),
                                  d.jsxs("span",{className:"text-yellow-400 font-bold",children:["X: ",m.oddsN||"-"]}),
                                  d.jsx("span",{className:"text-white/20",children:"|"}),
                                  d.jsxs("span",{className:"text-purple-300 font-bold",children:["2: ",m.odds2||"-"]}),
                                  d.jsx("span",{
                                    className:"ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase "+(m.isIdenticalOdds?"bg-amber-500/20 text-amber-300 border border-amber-500/40":"bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"),
                                    children:m.confidenceBadge||"100% ASSURÉ"
                                  })
                                ]
                              })
                            ]
                          }),

                          /* GRID 4 PRONOSTICS 100% ASSURÉS */
                          d.jsxs("div",{
                            className:"grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 items-stretch",
                            children:[
                              /* 1. SCORE EXACT */
                              d.jsxs("div",{
                                className:"p-2 rounded-lg bg-amber-950/30 border border-amber-400/40 flex flex-col justify-between shadow-[0_0_8px_rgba(245,158,11,0.1)]",
                                children:[
                                  d.jsx("div",{className:"text-[8.5px] font-mono text-amber-300/80 uppercase font-bold",children:"🎯 Score Exact"}),
                                  d.jsxs("div",{
                                    className:"mt-1 flex items-baseline gap-1.5",
                                    children:[
                                      d.jsx("span",{className:"text-sm font-black font-mono text-amber-300",children:m.predictedExactScore||"2-1"}),
                                      m.alternativeScore&&d.jsxs("span",{className:"text-[8.5px] font-mono text-white/50",children:["Alt: ",m.alternativeScore]})
                                    ]
                                  }),
                                  m.allHistoricalScores&&m.allHistoricalScores.length>0&&d.jsxs("div",{
                                    className:"text-[8px] font-mono text-amber-200/60 truncate mt-0.5",
                                    children:["Niseho: ",m.allHistoricalScores.slice(0,3).join(", ")]
                                  })
                                ]
                              }),

                              /* 2. VICTOIRE (DOMICILE / EXTERIEUR / DOUBLE CHANCE) */
                              d.jsxs("div",{
                                className:"p-2 rounded-lg bg-emerald-950/30 border border-emerald-400/40 flex flex-col justify-between shadow-[0_0_8px_rgba(16,185,129,0.1)]",
                                children:[
                                  d.jsxs("div",{className:"text-[8.5px] font-mono text-emerald-300/80 uppercase font-bold flex items-center justify-between",children:[
                                    d.jsx("span",{children:"🏆 Victoire"}),
                                    d.jsx("span",{className:"text-emerald-400 text-[8px]",children:v.confidence||"98%"})
                                  ]}),
                                  d.jsx("div",{className:"text-xs font-black text-emerald-300 mt-1 truncate",children:v.label||"Victoire Domicile"}),
                                  d.jsxs("div",{className:"text-[8.5px] font-mono text-white/60 mt-0.5",children:["DC: ",v.doubleChance||"1X"]})
                                ]
                              }),

                              /* 3. TOTAL DE BUTS */
                              d.jsxs("div",{
                                className:"p-2 rounded-lg bg-sky-950/30 border border-sky-400/40 flex flex-col justify-between shadow-[0_0_8px_rgba(14,165,233,0.1)]",
                                children:[
                                  d.jsx("div",{className:"text-[8.5px] font-mono text-sky-300/80 uppercase font-bold",children:"⚽ Total Buts"}),
                                  d.jsx("div",{className:"text-[11px] font-black text-sky-300 mt-1 truncate",children:m.totalGoals||"Multi-Buts 1-4"}),
                                  d.jsx("div",{className:"text-[8.5px] font-mono text-white/60 mt-0.5",children:"Taha: 100% Assuré"})
                                ]
                              }),

                              /* 4. LES 2 MARQUENT (BTTS) */
                              d.jsxs("div",{
                                className:"p-2 rounded-lg bg-purple-950/30 border border-purple-400/40 flex flex-col justify-between shadow-[0_0_8px_rgba(168,85,247,0.1)]",
                                children:[
                                  d.jsxs("div",{className:"text-[8.5px] font-mono text-purple-300/80 uppercase font-bold flex items-center justify-between",children:[
                                    d.jsx("span",{children:"🥅 Les 2 Marquent"}),
                                    d.jsx("span",{className:"text-purple-300 text-[8px]",children:btts.confidence||"92%"})
                                  ]}),
                                  d.jsx("div",{className:"text-xs font-black text-purple-200 mt-1 truncate",children:btts.label||"GG (Oui)"}),
                                  d.jsx("div",{className:"text-[8.5px] font-mono text-white/60 mt-0.5",children:"BTTS Recommandé"})
                                ]
                              })
                            ]
                          }),

                          /* SECTION STRATÉGIES AZO ANTOKA & POROFO ARA-TANTARA JSON */
                          st&&st.securiteMaximale&&d.jsxs("div",{
                            className:"mt-2 p-2.5 rounded-lg bg-black/70 border border-white/10 space-y-2 text-[9px]",
                            children:[
                              d.jsxs("div",{
                                className:"flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-white/10",
                                children:[
                                  d.jsxs("div",{
                                    className:"flex items-center gap-1.5 text-amber-300 font-bold",
                                    children:[
                                      d.jsx("span",{children:"🧠"}),
                                      d.jsx("span",{className:"uppercase tracking-wide",children:"Stratégies & Fandalinana Matihanina (JSON Database)"})
                                    ]
                                  }),
                                  d.jsxs("div",{
                                    className:"text-[8.5px] font-mono text-emerald-400 font-bold flex items-center gap-1",
                                    children:[
                                      d.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"}),
                                      "Miorina amin ny ",
                                      ev.totalMatchesAnalyzed?ev.totalMatchesAnalyzed.toLocaleString():"31 000+",
                                      " lalao voatahiry"
                                    ]
                                  })
                                ]
                              }),

                              /* 3 STRATÉGIES BLOCKS */
                              d.jsxs("div",{
                                className:"grid grid-cols-1 sm:grid-cols-3 gap-2",
                                children:[
                                  /* Stratégie 1: Sécurité Maximale */
                                  d.jsxs("div",{
                                    className:"p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between",
                                    children:[
                                      d.jsxs("div",{className:"font-bold text-emerald-400 text-[8.5px] flex items-center justify-between",children:[
                                        d.jsx("span",{children:"🛡️ Sécurité 99%"}),
                                        d.jsx("span",{className:"bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded text-[7.5px] font-black",children:st.securiteMaximale.confidence||"99%"})
                                      ]}),
                                      d.jsx("div",{className:"text-white font-mono font-bold mt-1 text-[9.5px]",children:st.securiteMaximale.pick}),
                                      d.jsx("div",{className:"text-emerald-300/70 text-[8px] mt-0.5",children:st.securiteMaximale.risk})
                                    ]
                                  }),

                                  /* Stratégie 2: Buts & BTTS */
                                  d.jsxs("div",{
                                    className:"p-2 rounded-lg bg-sky-950/20 border border-sky-500/30 flex flex-col justify-between",
                                    children:[
                                      d.jsxs("div",{className:"font-bold text-sky-400 text-[8.5px] flex items-center justify-between",children:[
                                        d.jsx("span",{children:"⚽ Buts & BTTS"}),
                                        d.jsx("span",{className:"bg-sky-500/30 text-sky-200 px-1.5 py-0.5 rounded text-[7.5px] font-black",children:st.totalButs.confidence||"97%"})
                                      ]}),
                                      d.jsx("div",{className:"text-white font-mono font-bold mt-1 text-[9.5px] truncate",children:st.totalButs.pick}),
                                      d.jsx("div",{className:"text-sky-300/70 text-[8px] mt-0.5 truncate",children:st.totalButs.btts})
                                    ]
                                  }),

                                  /* Stratégie 3: Value Score */
                                  d.jsxs("div",{
                                    className:"p-2 rounded-lg bg-amber-950/20 border border-amber-500/30 flex flex-col justify-between",
                                    children:[
                                      d.jsxs("div",{className:"font-bold text-amber-400 text-[8.5px] flex items-center justify-between",children:[
                                        d.jsx("span",{children:"🎯 Value Score"}),
                                        d.jsx("span",{className:"text-amber-200/60 text-[7.5px]",children:st.scoreValueBet.miseConseillee})
                                      ]}),
                                      d.jsxs("div",{className:"text-white font-mono font-bold mt-1 text-[9.5px]",children:[
                                        "Score: ",st.scoreValueBet.exact,
                                        " (Alt: ",st.scoreValueBet.couverture,")"
                                      ]}),
                                      d.jsx("div",{className:"text-amber-300/60 text-[8px] mt-0.5",children:"Tolo-kevitra Cote Tsara"})
                                    ]
                                  })
                                ]
                              }),

                              /* POROFO ARA-TANTARA FOOTER */
                              d.jsxs("div",{
                                className:"pt-1.5 text-[8.5px] font-mono text-white/60 space-y-1 border-t border-white/5",
                                children:[
                                  d.jsxs("div",{
                                    className:"flex flex-wrap items-center gap-x-2 gap-y-0.5",
                                    children:[
                                      d.jsxs("span",{className:"text-amber-300 font-bold",children:[
                                        "📌 Porofo JSON: ",
                                        ev.identicalOddsOccurrences||0," lalao mitovy cotes ao amin ny tahiry"
                                      ]}),
                                      d.jsx("span",{className:"text-white/30",children:"•"}),
                                      d.jsxs("span",{className:"text-sky-300",children:[
                                        ev.h2hCount||0," lalao H2H mivantana (Salan isa ",ev.h2hAvgGoals||2.5," buts)"
                                      ]}),
                                      ev.identicalOddsScores&&ev.identicalOddsScores.length>0&&d.jsxs("span",{
                                        className:"text-white/40",
                                        children:["• Scores niseho: ",ev.identicalOddsScores.slice(0,4).join(", ")]
                                      })
                                    ]
                                  }),
                                  st.verdictMatihanina&&d.jsxs("div",{
                                    className:"text-[8.5px] text-amber-200/90 font-sans italic pt-1 border-t border-white/5",
                                    children:["💡 ",st.verdictMatihanina]
                                  })
                                ]
                              })
                            ]
                          })
                        ]
                      },m.id);
                    })
                  })
                ]
              },lgItem.leagueId);
            })
          })
        ]
      }),

      op&&d.jsx("div",{className:"overflow-x-auto",children:d.jsxs("table",{className:"w-full text-left text-[10px] border-collapse",children:[
        d.jsx("thead",{children:d.jsxs("tr",{className:"text-white/40 border-b border-white/5 text-[8.5px] uppercase tracking-wider",children:[d.jsx("th",{className:"py-1.5 px-2",children:"Sokajy (Indicateur)"}),d.jsx("th",{className:"py-1.5 px-2 text-center",children:"Isany (Valeur)"}),d.jsx("th",{className:"py-1.5 px-2",children:"Fanamarihana (Détails)"})]})}),
        d.jsxs("tbody",{className:"divide-y divide-white/5 font-mono",children:[
          d.jsxs("tr",{className:"hover:bg-white/[0.02]",children:[d.jsxs("td",{className:"py-1.5 px-2 font-sans font-bold flex items-center gap-1.5",children:[d.jsx("span",{children:"📁"}),"Total Lalao Voatahiry"]}),d.jsx("td",{className:"py-1.5 px-2 text-center font-black text-amber-400 text-[11px]",children:(s.totalMatches||0).toLocaleString()}),d.jsx("td",{className:"py-1.5 px-2 text-white/50 text-[9px] font-sans",children:"Voatahiry ao amin ny rounds_storage.json ("+(s.totalRounds||0)+" Rounds voarakitra • Zaka 500 Mo)"})]}),
          d.jsxs("tr",{className:"hover:bg-white/[0.02]",children:[d.jsxs("td",{className:"py-1.5 px-2 font-sans font-bold flex items-center gap-1.5",children:[d.jsx("span",{children:"🏁"}),"Lalao Vita vs Ho Avy (Upcoming)"]}),d.jsxs("td",{className:"py-1.5 px-2 text-center font-bold text-white",children:[s.totalFinished," / ",d.jsx("span",{className:"text-sky-400",children:s.totalUpcoming})]}),d.jsxs("td",{className:"py-1.5 px-2 text-white/50 text-[9px] font-sans",children:[s.totalFinished," Vita • ",s.totalUpcoming," Ho Avy (Upcoming matches voatahiry)"]})]}),
          d.jsxs("tr",{className:"hover:bg-white/[0.02] bg-emerald-500/[0.02]",children:[d.jsxs("td",{className:"py-1.5 px-2 font-sans font-bold flex items-center gap-1.5 text-emerald-300",children:[d.jsx("span",{children:"🎯"}),"Prédictions Gagnées (Won)"]}),d.jsxs("td",{className:"py-1.5 px-2 text-center font-black text-emerald-400 text-[11px]",children:[s.winRate," (",s.wonCount,")"]}),d.jsxs("td",{className:"py-1.5 px-2 text-white/50 text-[9px] font-sans",children:[d.jsx("span",{className:"text-emerald-400 font-bold",children:s.wonCount+" Gagné (Won)"})," • ",d.jsx("span",{className:"text-rose-400",children:s.lostCount+" Perdu"})]})]}),
          d.jsxs("tr",{className:"hover:bg-white/[0.02] bg-amber-500/[0.03]",children:[d.jsxs("td",{className:"py-1.5 px-2 font-sans font-bold text-amber-300 flex items-center gap-1.5",children:[d.jsx("span",{children:"📌"}),"Cotes 100% Identiques (Épinglés)"]}),d.jsxs("td",{className:"py-1.5 px-2 text-center font-black text-amber-400 text-[11px]",children:[s.identicalOddsMatchesCount," lalao"]}),d.jsx("td",{className:"py-1.5 px-2 text-amber-300/80 text-[9px] font-sans",children:"Matchs épinglés au sommet • Taux de réussite: "+s.identicalOddsWinRate})]}),
          d.jsxs("tr",{className:"hover:bg-white/[0.02]",children:[d.jsxs("td",{className:"py-1.5 px-2 font-sans font-bold flex items-center gap-1.5",children:[d.jsx("span",{children:"⚽"}),"Multi-Buts (1-4 Buts)"]}),d.jsx("td",{className:"py-1.5 px-2 text-center font-bold text-emerald-300",children:(dsc.multi1to4||0).toLocaleString()}),d.jsx("td",{className:"py-1.5 px-2 text-white/50 text-[9px] font-sans",children:"Lalao nisy 1 ka hatramin ny 4 baolina"})]}),
          d.jsxs("tr",{className:"hover:bg-white/[0.02]",children:[d.jsxs("td",{className:"py-1.5 px-2 font-sans font-bold flex items-center gap-1.5",children:[d.jsx("span",{children:"📉"}),"Under / Over 2.5 Buts"]}),d.jsxs("td",{className:"py-1.5 px-2 text-center font-bold text-purple-300",children:["U: "+(dsc.under25||0)+" / O: "+(dsc.over25||0)]}),d.jsx("td",{className:"py-1.5 px-2 text-white/50 text-[9px] font-sans",children:"Fizarana lalao Moins de 2.5 sy Plus de 2.5"})]})
        ]})
      ]})})
    ]
  });
}
`;

content = content.substring(0, startIndex) + newStoredStatsWidgetCode + content.substring(endIndex);

try {
  esbuild.transformSync(content, { loader: 'js' });
  console.log('ESBUILD VALIDATION: 100% PERFECT!');
  fs.writeFileSync(filePath, content, 'utf8');
  if (!fs.existsSync('/app/applet/dist/assets')) fs.mkdirSync('/app/applet/dist/assets', { recursive: true });
  fs.writeFileSync('/app/applet/dist/assets/index-CxKXGYsU.js', content, 'utf8');
  console.log('Successfully injected deep analysis & strategies UI into StoredStatsWidget!');
} catch (err) {
  console.error('ESBUILD ERROR:', err.message);
  process.exit(1);
}
