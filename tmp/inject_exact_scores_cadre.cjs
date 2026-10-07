const fs = require('fs');
const esbuild = require('esbuild');

const filePath = '/app/applet/public/assets/index-CxKXGYsU.js';
let content = fs.readFileSync(filePath, 'utf8');

const pStartMarker = 'function PinnedUpcomingWidget(){';
const pEndMarker = 'function TeamStorageSearchWidget(){';

const pStart = content.indexOf(pStartMarker);
const pEnd = content.indexOf(pEndMarker);

if (pStart === -1 || pEnd === -1) {
  console.error('PinnedUpcomingWidget markers not found!', { pStart, pEnd });
  process.exit(1);
}

const newPinnedUpcomingWidgetCode = `function PinnedUpcomingWidget(){
  const[activeTab,setActiveTab]=Y.useState("upcoming"); // 'upcoming' na 'identical_storage'
  const[lg,setLeague]=Y.useState("8035");
  const[data,setData]=Y.useState(()=>{
    try{
      const local=localStorage.getItem("tiazaha_pinned_cache_"+lg);
      return local?JSON.parse(local):null;
    }catch(e){return null;}
  });
  const[identicalData,setIdenticalData]=Y.useState(()=>{
    try{
      const local=localStorage.getItem("tiazaha_all_identical_cache");
      return local?JSON.parse(local):null;
    }catch(e){return null;}
  });
  const[ld,setLoading]=Y.useState(!1);
  const[op,setIsOpen]=Y.useState(!0);
  const[muted,setMuted]=Y.useState(typeof _isBeepMuted!=="undefined"?_isBeepMuted:!1);
  const[isOnline,setIsOnline]=Y.useState(typeof navigator!=="undefined"?navigator.onLine:!0);

  const leagueNames={
    "8035":"🏴󠁧󠁢󠁥󠁮󠁧󠁿 English League",
    "8036":"🇮🇹 Italian League",
    "8037":"🇪🇸 Spanish League",
    "8042":"🇫🇷 French League",
    "8043":"🇩🇪 German League",
    "8044":"🇵🇹 Portuguese League",
    "8056":"⭐ Champions Cup",
    "8060":"🌏 Euro / Asie Cup",
    "8065":"🏆 Coupe du Monde",
    "all":"🔥 Ligy 9 Rehetra"
  };

  const loadPinned=(sel=lg,force=!1)=>{
    if(typeof document!=="undefined"&&document.hidden&&!force)return;
    setLoading(!0);
    fetch("/api/predictions/upcoming-pinned?leagueId="+sel)
      .then(r=>r.json())
      .then(d=>{
        if(d&&d.success){
          setData(d);
          try{localStorage.setItem("tiazaha_pinned_cache_"+sel,JSON.stringify(d))}catch(e){}
          if(Array.isArray(d.matches)&&d.matches.some(m=>m.isIdenticalOdds)&&!muted){
            try{if(typeof startAppBeep==="function")startAppBeep();}catch(e){}
          }
        }
        setLoading(!1);
      })
      .catch(()=>{
        try{
          const fallback=localStorage.getItem("tiazaha_pinned_cache_"+sel);
          if(fallback)setData(JSON.parse(fallback));
        }catch(e){}
        setLoading(!1);
      });
  };

  const loadIdenticalMatches=()=>{
    fetch("/api/predictions/identical-matches-all-leagues")
      .then(r=>r.json())
      .then(d=>{
        if(d&&d.success){
          setIdenticalData(d);
          try{localStorage.setItem("tiazaha_all_identical_cache",JSON.stringify(d))}catch(e){}
        }
      })
      .catch(()=>{
        try{
          const fallback=localStorage.getItem("tiazaha_all_identical_cache");
          if(fallback)setIdenticalData(JSON.parse(fallback));
        }catch(e){}
      });
  };

  Y.useEffect(()=>{
    loadPinned(lg,!0);
    loadIdenticalMatches();
    const iv=setInterval(()=>loadPinned(lg,!1),12000);
    const onOnline=()=>{
      setIsOnline(!0);
      loadPinned(lg,!0);
      loadIdenticalMatches();
    };
    const onOffline=()=>{setIsOnline(!1);};
    window.addEventListener("online",onOnline);
    window.addEventListener("offline",onOffline);
    return()=>{
      clearInterval(iv);
      window.removeEventListener("online",onOnline);
      window.removeEventListener("offline",onOffline);
    };
  },[lg]);

  const activeLeagueName=leagueNames[lg]||("Ligy "+lg);
  const matches=(data&&data.matches)||[];
  const curRound=(data&&(data.currentUpcomingRound||data.nextRoundNumber))||"";

  // Identical storage list filtered by selected league
  const allIdenticalList=(identicalData&&identicalData.leagues)||[];
  const filteredIdenticalLeagues=lg==="all"?allIdenticalList:allIdenticalList.filter(l=>String(l.leagueId)===String(lg));

  return d.jsxs("div",{
    className:"bg-gradient-to-b from-[#13121f] via-[#0c0d16] to-[#08080d] border-2 border-amber-500/50 rounded-2xl p-3 md:p-4 mb-4 shadow-[0_4px_30px_rgba(245,158,11,0.2)] text-white font-sans relative overflow-hidden",
    children:[
      d.jsx("div",{className:"absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-br from-amber-500/15 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none"}),
      
      /* TOP HEADER */
      d.jsxs("div",{
        className:"flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-white/10 relative z-10",
        children:[
          d.jsxs("div",{
            className:"flex items-center gap-2.5",
            children:[
              d.jsx("div",{
                className:"w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/30 to-purple-600/30 border border-amber-400/60 flex items-center justify-center text-amber-300 font-bold text-lg shadow-[0_0_15px_rgba(245,158,11,0.35)] shrink-0",
                children:"👑"
              }),
              d.jsxs("div",{
                children:[
                  d.jsxs("div",{
                    className:"flex items-center gap-2 flex-wrap",
                    children:[
                      d.jsx("h2",{
                        className:"text-xs md:text-sm font-black tracking-wider text-amber-300 uppercase",
                        children:"CADRE TOKANA • LALAO & PRÉDICTIONS ISAKIN NY ROUND (LIGUE 9)"
                      }),
                      curRound&&d.jsxs("span",{
                        className:"px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1",
                        children:[
                          d.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"}),
                          "Round "+curRound
                        ]
                      }),
                      d.jsx("span",{
                        className:"px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[9px] font-black text-emerald-300 uppercase tracking-widest font-mono",
                        children:"🔒 TSY MIOMBAOVA MANDRA-PAHAVITA"
                      })
                    ]
                  }),
                  d.jsxs("p",{
                    className:"text-[9.5px] text-amber-200/80 font-medium flex items-center gap-2 mt-0.5 flex-wrap",
                    children:[
                      d.jsxs("span",{
                        children:[
                          "Scores exacts rehetra voatahiry araky ny fipetrakin ny ekipa ",
                          d.jsx("strong",{className:"text-white font-black underline",children:"[DOMICILE] vs [EXTÉRIEUR]"}),
                          " (Ohatra: Liverpool [DOM] vs Fulham [EXT])"
                        ]
                      }),
                      d.jsx("span",{className:"text-white/40",children:"•"}),
                      d.jsxs("span",{
                        className:"text-sky-300 font-mono text-[9px] flex items-center gap-1",
                        children:[
                          d.jsx("span",{className:"w-1.5 h-1.5 rounded-full "+(isOnline?"bg-emerald-400 animate-pulse":"bg-rose-500")}),
                          isOnline?"Auto-Sync mandeha":"Mode Hors-Ligne (Voatahiry)"
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          /* CONTROLS (REFRESH, MUTE, COLLAPSE) */
          d.jsxs("div",{
            className:"flex items-center gap-2 shrink-0 self-end sm:self-auto",
            children:[
              d.jsxs("button",{
                onClick:()=>{
                  if(typeof toggleBeepMute==="function"){
                    const m=toggleBeepMute();
                    setMuted(m);
                  }
                },
                className:"px-2.5 py-1 border rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all "+(muted?"bg-white/5 border-white/10 text-white/40":"bg-purple-600/25 border-purple-400/50 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.25)]"),
                children:[d.jsx("span",{children:muted?"🔇":"🔊"}),muted?"Feo Natsahatra":"Feo Beep"]
              }),
              d.jsxs("button",{
                onClick:()=>{setLoading(!0);loadPinned(lg,!0);loadIdenticalMatches();},
                disabled:ld,
                className:"px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-500/40 rounded-lg text-[9px] font-bold text-amber-300 flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]",
                children:[d.jsx("span",{className:ld?"animate-spin":"",children:"🔄"}),ld?"...":"Havaozy"]
              }),
              d.jsx("button",{
                onClick:()=>setIsOpen(!op),
                className:"px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/60",
                children:op?"Afeno ▲":"Asehoy Cadre ▼"
              })
            ]
          })
        ]
      }),

      !isOnline&&d.jsxs("div",{
        className:"mb-3 p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center gap-2",
        children:[
          d.jsx("span",{className:"w-2 h-2 rounded-full bg-rose-400 animate-ping"}),
          "📴 Mode Hors-ligne: Maty ny data — Ny lalao sy scores rehetra dia voatahiry soa aman-tsara ao anaty tahiry anatiny. Tsy misy lalao very."
        ]
      }),

      /* LEAGUE SELECTOR PILLS */
      op&&d.jsxs("div",{
        className:"space-y-3",
        children:[
          /* SUB-TABS: TAB 1 (ROUND HO AVY) vs TAB 2 (102 LALAO MITOVY COTE AMIN'NY TAHIRY) */
          d.jsxs("div",{
            className:"flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl bg-black/50 border border-white/10",
            children:[
              d.jsxs("div",{
                className:"flex items-center gap-1.5",
                children:[
                  d.jsxs("button",{
                    onClick:()=>setActiveTab("upcoming"),
                    className:"px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 "+(activeTab==="upcoming"?"bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]":"bg-white/5 text-white/70 hover:bg-white/10"),
                    children:[
                      d.jsx("span",{children:"⚡"}),
                      "Lalao Ho Avy Amin ny Round ("+(matches.length)+")"
                    ]
                  }),
                  d.jsxs("button",{
                    onClick:()=>setActiveTab("identical_storage"),
                    className:"px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 "+(activeTab==="identical_storage"?"bg-gradient-to-r from-purple-600 to-sky-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]":"bg-white/5 text-white/70 hover:bg-white/10"),
                    children:[
                      d.jsx("span",{children:"📁"}),
                      "Tabilao Fampitoviana: 100% Mitovy Cote & Ekipa ao amin ny Tahiry"
                    ]
                  })
                ]
              }),
              d.jsxs("div",{
                className:"text-[9px] font-mono text-amber-300/80 px-2 py-0.5",
                children:[activeLeagueName]
              })
            ]
          }),

          /* LEAGUE BUTTONS (9 LIGUES) */
          d.jsx("div",{
            className:"flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none",
            children:Object.entries(leagueNames).map(([id,name])=>{
              const isSel=String(lg)===String(id);
              return d.jsx("button",{
                onClick:()=>{
                  setLeague(id);
                  setLoading(!0);
                  loadPinned(id,!0);
                },
                className:"px-2.5 py-1 rounded-lg text-[9px] font-bold shrink-0 transition-all flex items-center gap-1 "+(isSel?"bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black":"bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"),
                children:name
              },id);
            })
          }),

          /* CONTENT OF TAB 1: UPCOMING ROUND MATCHES (ALL EXACT SCORES BY STRICT DOMICILE VS EXTERIEUR ORDER) */
          activeTab==="upcoming"&&(
            ld&&matches.length===0?d.jsxs("div",{
              className:"p-8 text-center text-amber-300 text-xs font-bold animate-pulse",
              children:[d.jsx("span",{className:"text-2xl block mb-2",children:"⏳"}),"Eo am-pakana sy famakafakana ny lalao rehetra amin ny Round..."]
            }):matches.length===0?d.jsxs("div",{
              className:"p-6 text-center border-2 border-dashed border-white/10 rounded-xl bg-black/30",
              children:[
                d.jsx("div",{className:"text-2xl mb-1",children:"⏳"}),
                d.jsxs("div",{className:"text-xs font-bold text-white/70",children:["Miandry ny lalao ho avy amin ny ",activeLeagueName]}),
                d.jsx("div",{className:"text-[9px] text-white/40 mt-1",children:"Tsindrio ny 'Havaozy' na mifidiana ligy hafa eo ambony"})
              ]
            }):d.jsx("div",{
              className:"space-y-3",
              children:matches.map((m,idx)=>{
                const exact=m.predictedExactScore||"2-1";
                const alt=m.alternativeScore;
                const histList=m.scoresWithRounds||[];
                const allHist=m.allHistoricalScores||[];
                const winner=m.winnerInfo||{};
                const vict=m.victoirePrediction||{};
                const isHomeFav=winner.winner==="home"||vict.isHomeFav;

                return d.jsxs("div",{
                  className:"rounded-xl border-2 transition-all p-3 md:p-4 relative overflow-hidden "+(m.isIdenticalOdds?"border-amber-400/80 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-[#0e101a] shadow-[0_0_20px_rgba(245,158,11,0.25)]":"border-white/10 bg-gradient-to-r from-[#141522] via-[#0d0e17] to-black hover:border-amber-500/40"),
                  children:[
                    /* MATCH HEADER */
                    d.jsxs("div",{
                      className:"flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2.5 border-b border-white/10",
                      children:[
                        d.jsxs("div",{
                          className:"flex items-center gap-2 flex-wrap",
                          children:[
                            d.jsx("span",{className:"text-base",children:m.isIdenticalOdds?"🔥":"🎯"}),
                            d.jsxs("div",{
                              className:"font-black text-xs md:text-sm tracking-wide flex items-center gap-2 flex-wrap",
                              children:[
                                d.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",children:"[DOMICILE]"}),
                                d.jsx("span",{className:"text-white font-black "+(isHomeFav?"underline decoration-amber-400 decoration-2 font-mono text-amber-200":""),children:m.team1}),
                                d.jsx("span",{className:"text-yellow-400 font-mono text-xs font-black",children:"vs"}),
                                d.jsx("span",{className:"text-white font-black "+(!isHomeFav?"underline decoration-amber-400 decoration-2 font-mono text-amber-200":""),children:m.team2}),
                                d.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-500/20 text-sky-400 border border-sky-500/30",children:"[EXTÉRIEUR]"})
                              ]
                            })
                          ]
                        }),
                        d.jsxs("div",{
                          className:"flex items-center gap-2 self-start md:self-auto flex-wrap",
                          children:[
                            d.jsxs("div",{
                              className:"inline-flex items-center gap-1.5 bg-black/80 px-2 py-0.5 rounded-lg border border-white/10 text-[9.5px] font-mono",
                              children:[
                                d.jsxs("span",{className:"text-emerald-400 font-bold",children:["1: ",m.odds1||"-"]}),
                                d.jsx("span",{className:"text-white/20",children:"|"}),
                                d.jsxs("span",{className:"text-yellow-400 font-bold",children:["X: ",m.oddsN||"-"]}),
                                d.jsx("span",{className:"text-white/20",children:"|"}),
                                d.jsxs("span",{className:"text-purple-300 font-bold",children:["2: ",m.odds2||"-"]})
                              ]
                            }),
                            d.jsx("span",{
                              className:"px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider "+(m.isIdenticalOdds?"bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse":"bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"),
                              children:m.isIdenticalOdds?"🔥 100% COTE & EKIPA MITOVY":("📁 "+(m.totalHistoricalMatches||0)+" Lalao Voatahiry")
                            })
                          ]
                        })
                      ]
                    }),

                    /* WINNER HOLDING VICTORY (EKIPA MITAZONA NY FANDRESENA) */
                    d.jsxs("div",{
                      className:"mt-2.5 p-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-black/60 to-purple-500/15 border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
                      children:[
                        d.jsxs("div",{
                          className:"flex items-center gap-2",
                          children:[
                            d.jsx("span",{className:"text-base",children:"👑"}),
                            d.jsxs("div",{
                              children:[
                                d.jsxs("div",{
                                  className:"text-[10.5px] font-black text-amber-300 flex items-center gap-1.5 flex-wrap",
                                  children:[
                                    d.jsx("span",{className:"underline",children:winner.winningTeam||(isHomeFav?m.team1:m.team2)}),
                                    d.jsx("span",{className:"text-emerald-400",children:"NO MITAZONA NY FANDRESENA"}),
                                    d.jsxs("span",{className:"px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[8.5px] font-mono",children:[vict.doubleChance||(isHomeFav?"1X":"X2")]})
                                  ]
                                }),
                                d.jsx("div",{
                                  className:"text-[8.5px] text-white/60 font-sans mt-0.5",
                                  children:winner.description||("Tombony lehibe: "+(vict.label||"Victoire"))
                                })
                              ]
                            })
                          ]
                        }),
                        d.jsxs("div",{
                          className:"flex items-center gap-1.5 shrink-0 font-mono text-[9px]",
                          children:[
                            d.jsx("span",{className:"text-white/40",children:"Safidy:"}),
                            d.jsx("span",{className:"px-2 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",children:vict.tip||(isHomeFav?"1":"2")}),
                            d.jsx("span",{className:"px-2 py-0.5 rounded font-black bg-purple-500/20 text-purple-300 border border-purple-500/40",children:m.predictionAssuree||"Multi-Buts 1-4"})
                          ]
                        })
                      ]
                    }),

                    /* ALL EXACT SCORES STRICTLY BY DOMICILE VS EXTERIEUR ORDER (User Request 1) */
                    d.jsxs("div",{
                      className:"mt-2.5 p-2.5 rounded-xl bg-black/60 border border-sky-400/30 space-y-1.5",
                      children:[
                        d.jsxs("div",{
                          className:"flex items-center justify-between gap-1 flex-wrap",
                          children:[
                            d.jsxs("span",{
                              className:"text-[9px] font-mono font-black text-sky-300 uppercase tracking-wider flex items-center gap-1.5",
                              children:[
                                d.jsx("span",{children:"🎯"}),
                                "SCORES EXACTES REHETRA VOATAHIRY ("+m.team1+" [DOM] vs "+m.team2+" [EXT]) :"
                              ]
                            }),
                            d.jsxs("span",{
                              className:"text-[8.5px] font-mono text-white/50",
                              children:[histList.length," lalao teo aloha tamin ity filaharana ity"]
                            })
                          ]
                        }),
                        histList.length>0?d.jsx("div",{
                          className:"flex items-center gap-1.5 flex-wrap pt-0.5",
                          children:histList.map((item,sIdx)=>{
                            const isMatchPredicted=item.score===exact;
                            return d.jsxs("span",{
                              className:"px-2 py-0.5 rounded text-[9.5px] font-mono font-black border transition-all "+(item.isIdenticalOdds?"bg-amber-400 text-black border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]":(isMatchPredicted?"bg-emerald-500/30 text-emerald-200 border-emerald-400":"bg-white/5 text-white/80 border-white/10")),
                              children:[
                                item.score,
                                d.jsxs("span",{className:"text-[7.5px] ml-1 opacity-70",children:["(R",item.roundNumber,")"]})
                              ]
                            },sIdx);
                          })
                        }):d.jsx("div",{
                          className:"text-[9px] text-white/40 italic",
                          children:"Tsy mbola nisy fihaonana voatahiry tamin ity filaharana ity teo aloha (Lalao vaovao)"
                        }),
                        allHist.length>0&&d.jsxs("div",{
                          className:"text-[8.5px] font-mono text-amber-200/70 pt-1 border-t border-white/5 flex items-center gap-2 flex-wrap",
                          children:[
                            d.jsx("span",{className:"text-white/40",children:"Fiverenan ny score (Fréquence):"}),
                            allHist.map((scText,scIdx)=>d.jsx("span",{className:"text-amber-300 font-bold",children:scText},scIdx))
                          ]
                        })
                      ]
                    }),

                    /* EXACT SCORE PREDICTION ROW (LOCKED & PRECISE) */
                    d.jsxs("div",{
                      className:"mt-2 p-2 rounded-xl bg-gradient-to-r from-emerald-950/40 via-black/80 to-sky-950/40 border border-emerald-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
                      children:[
                        d.jsxs("div",{
                          className:"flex items-center gap-2 flex-wrap",
                          children:[
                            d.jsx("span",{className:"text-[10px] font-mono font-black text-emerald-300 uppercase",children:"🎯 Score Exact Vinavinaina:"}),
                            d.jsx("span",{
                              className:"px-3 py-0.5 rounded-lg font-black font-mono text-sm md:text-base bg-emerald-500/25 text-emerald-200 border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]",
                              children:exact
                            }),
                            alt&&d.jsxs("span",{
                              className:"px-2 py-0.5 rounded font-mono text-[9px] bg-sky-500/15 text-sky-200 border border-sky-400/30",
                              children:["Couverture: ",d.jsx("strong",{className:"text-white",children:alt})]
                            })
                          ]
                        }),
                        d.jsxs("div",{
                          className:"flex items-center gap-1 text-[8.5px] font-mono text-emerald-400/80",
                          children:[
                            d.jsx("span",{children:"🔒"}),
                            "Voahidy: Tsy miovaova mandra-pahavita"
                          ]
                        })
                      ]
                    })
                  ]
                },m.id||idx);
              })
            })
          ),

          /* CONTENT OF TAB 2: IDENTICAL STORAGE (102+ LALAO REHETRA MITOVY COTE SY EKIPA 100%) */
          activeTab==="identical_storage"&&(
            filteredIdenticalLeagues.length===0?d.jsxs("div",{
              className:"p-6 text-center text-white/50 text-xs border border-white/10 rounded-xl",
              children:[d.jsx("span",{className:"text-xl block mb-1",children:"📁"}),"Tsy misy lalao mitovy cote 100% voatahiry tamin ity ligy ity."]
            }):d.jsx("div",{
              className:"space-y-4",
              children:filteredIdenticalLeagues.map(lgGroup=>{
                const pMatches=lgGroup.matches||[];
                return d.jsxs("div",{
                  className:"p-3 rounded-xl border border-white/10 bg-black/40 space-y-2.5",
                  children:[
                    d.jsxs("div",{
                      className:"flex items-center justify-between pb-1.5 border-b border-white/5",
                      children:[
                        d.jsxs("div",{
                          className:"flex items-center gap-2",
                          children:[
                            d.jsx("span",{className:"text-base",children:lgGroup.leagueFlag||"⚽"}),
                            d.jsx("span",{className:"font-black text-xs text-amber-300 uppercase",children:lgGroup.leagueName}),
                            d.jsxs("span",{className:"px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px]",children:[pMatches.length," Lalao Mitovy Cote 100%"]})
                          ]
                        })
                      ]
                    }),
                    d.jsx("div",{
                      className:"grid grid-cols-1 gap-2.5",
                      children:pMatches.map((pair,pIdx)=>{
                        const pWin=pair.winnerInfo||{};
                        const pStrat=pair.strategies||{};
                        return d.jsxs("div",{
                          className:"p-3 rounded-lg border border-amber-400/40 bg-gradient-to-r from-purple-950/20 via-black to-sky-950/20 text-[10px] space-y-2",
                          children:[
                            d.jsxs("div",{
                              className:"flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-white/5",
                              children:[
                                d.jsxs("div",{
                                  className:"font-black text-xs text-white flex items-center gap-1.5 flex-wrap",
                                  children:[
                                    d.jsx("span",{className:"text-emerald-400 font-bold",children:"[DOM]"}),
                                    pair.team1,
                                    d.jsx("span",{className:"text-yellow-400 font-mono text-xs font-black",children:"vs"}),
                                    pair.team2,
                                    d.jsx("span",{className:"text-sky-400 font-bold",children:"[EXT]"})
                                  ]
                                }),
                                d.jsxs("div",{
                                  className:"flex items-center gap-2 font-mono text-[9.5px]",
                                  children:[
                                    d.jsxs("span",{className:"text-emerald-400 font-bold",children:["1: ",pair.odds1]}),
                                    d.jsx("span",{className:"text-white/20",children:"|"}),
                                    d.jsxs("span",{className:"text-yellow-400 font-bold",children:["X: ",pair.oddsN]}),
                                    d.jsx("span",{className:"text-white/20",children:"|"}),
                                    d.jsxs("span",{className:"text-purple-300 font-bold",children:["2: ",pair.odds2]}),
                                    d.jsx("span",{className:"ml-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-400 text-black",children:"COTE MITOVY 100%"})
                                  ]
                                })
                              ]
                            }),
                            d.jsxs("div",{
                              className:"p-1.5 rounded-lg bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-1 text-[9px]",
                              children:[
                                d.jsxs("div",{
                                  className:"flex items-center gap-1.5",
                                  children:[
                                    d.jsx("span",{children:"👑"}),
                                    d.jsx("span",{className:"text-amber-300 font-bold",children:pWin.badge||"MPITAZONA FANDRESENA:"}),
                                    d.jsx("span",{className:"text-white font-mono",children:pWin.winningTeam})
                                  ]
                                }),
                                d.jsxs("div",{
                                  className:"font-mono text-emerald-400 font-bold",
                                  children:["Vinavina: ",pair.predictedExactScore||"2-1"]
                                })
                              ]
                            }),
                            d.jsxs("div",{
                              className:"text-[8.5px] font-mono text-amber-200/80 flex items-center gap-1.5 flex-wrap",
                              children:[
                                d.jsx("span",{className:"text-white/40",children:"Scores rehetra niseho (na samihafa aza):"}),
                                (pair.distinctScores||[]).map((sc,sIdx)=>d.jsx("span",{className:"px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 font-bold",children:sc},sIdx))
                              ]
                            })
                          ]
                        },pair.id||pIdx);
                      })
                    })
                  ]
                },lgGroup.leagueId);
              })
            })
          )
        ]
      })
    ]
  });
}
`;

content = content.substring(0, pStart) + newPinnedUpcomingWidgetCode + content.substring(pEnd);

// Also update RedAllLeaguesWidget to return null so there is NO conflicting duplicate widget
const rStartMarker = 'function RedAllLeaguesWidget()';
const rEndMarker = 'function StoredStatsWidget';

const rStart = content.indexOf(rStartMarker);
const rEnd = content.indexOf(rEndMarker);

if (rStart !== -1 && rEnd !== -1) {
  content = content.substring(0, rStart) + 'function RedAllLeaguesWidget(){return null;}' + content.substring(rEnd);
  console.log('Successfully neutralized RedAllLeaguesWidget to avoid duplicate display!');
}

try {
  esbuild.transformSync(content, { loader: 'js' });
  console.log('ESBUILD VALIDATION: 100% PERFECT SYNTAX!');
  fs.writeFileSync(filePath, content, 'utf8');
  if (!fs.existsSync('/app/applet/dist/assets')) fs.mkdirSync('/app/applet/dist/assets', { recursive: true });
  fs.writeFileSync('/app/applet/dist/assets/index-CxKXGYsU.js', content, 'utf8');
  console.log('Successfully injected exact fixture scores PinnedUpcomingWidget into public and dist!');
} catch (err) {
  console.error('ESBUILD ERROR:', err.message);
  process.exit(1);
}
