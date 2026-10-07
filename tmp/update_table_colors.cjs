const fs = require('fs');
const esbuild = require('esbuild');

const filePath = '/app/applet/public/assets/index-CxKXGYsU.js';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = 'function RedAllLeaguesWidget() {';
const endMarker = 'function StoredStatsWidget(){';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found!', { startIndex, endIndex });
  process.exit(1);
}

const newWidgetCode = `function RedAllLeaguesWidget() {
  var [data, setData] = Y.useState(null);
  var [loading, setLoading] = Y.useState(false);
  var [isOpen, setIsOpen] = Y.useState(true);
  var [muted, setMuted] = Y.useState(false);

  var fetchLeagues = function() {
    if (typeof document !== "undefined" && document.hidden) return;
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
    var iv = setInterval(fetchLeagues, 10000);
    return function() { clearInterval(iv); stopAppBeep(); };
  }, [muted]);

  var matches = (data && data.matches) || [];

  return d.jsxs("div", {
    className: "bg-gradient-to-b from-[#180d24] via-[#0b1329] to-[#080d16] border-2 border-amber-400/60 rounded-2xl p-3 md:p-4 mb-4 shadow-[0_4px_30px_rgba(245,158,11,0.25)] text-white font-sans relative overflow-hidden",
    children: [
      d.jsx("div", { className: "absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-purple-600/20 via-sky-500/15 to-amber-500/20 rounded-full blur-3xl pointer-events-none" }),
      d.jsxs("div", {
        className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-amber-400/20 relative z-10",
        children: [
          d.jsxs("div", {
            className: "flex items-center gap-2.5",
            children: [
              d.jsx("div", {
                className: "w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/30 to-purple-600/30 border border-amber-400/60 flex items-center justify-center text-amber-300 font-bold text-base shadow-[0_0_15px_rgba(245,158,11,0.35)] shrink-0",
                children: "👑"
              }),
              d.jsxs("div", {
                children: [
                  d.jsxs("div", {
                    className: "flex items-center gap-2 flex-wrap",
                    children: [
                      d.jsx("h2", {
                        className: "text-xs md:text-sm font-black tracking-wider text-amber-300 uppercase",
                        children: "TABILAO LIGUE 9 REHETRA • SCANNER INTELLIGENT"
                      }),
                      d.jsxs("span", {
                        className: "px-2 py-0.5 rounded-full bg-purple-950/70 border border-purple-400/50 text-[9px] font-black text-purple-300 uppercase tracking-widest flex items-center gap-1",
                        children: [
                          d.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" }),
                          "SCAN EN DIRECT (9 LIGUES)"
                        ]
                      }),
                      matches.length > 0 ? d.jsx("span", {
                        className: "px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400 text-[9px] font-black text-emerald-300 uppercase tracking-widest animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.35)]",
                        children: "🔥 " + matches.length + " LALAO MITOVY 100% HITA"
                      }) : d.jsx("span", {
                        className: "px-2 py-0.5 rounded-full bg-sky-950/60 border border-sky-400/40 text-[9px] font-bold text-sky-300 uppercase tracking-widest",
                        children: "⏳ MIANDRY NY LALAO MANARAKA"
                      })
                    ]
                  }),
                  d.jsxs("p", {
                    className: "text-[9.5px] text-sky-200/80 font-medium flex items-center gap-2 mt-0.5 flex-wrap",
                    children: [
                      d.jsx("span", { children: "Fikarohana lalao mitovy 100% cotes sy ekipa amin ny Ligy 9 miaraka (English, Italian, Spanish, German, French, Portuguese, Champions, Euro/Asie, World Cup)" }),
                      d.jsx("span", { className: "text-amber-400/60", children: "•" }),
                      d.jsx("span", { className: "text-yellow-300 font-mono text-[9px] font-bold", children: "Auto-Scan isaky ny 10s" })
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
                  (muted ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-purple-600/25 border-purple-400/50 text-purple-200 hover:bg-purple-600/35 shadow-[0_0_10px_rgba(168,85,247,0.25)]"),
                title: muted ? "Alefaso ny feo beep" : "Atsaharo ny feo beep",
                children: [
                  d.jsx("span", { children: muted ? "🔇" : "🔊" }),
                  muted ? "Feo Beep (Natsahatra)" : "Feo Beep (Mandeha)"
                ]
              }),
              d.jsxs("button", {
                onClick: function() { setLoading(true); fetchLeagues(); },
                disabled: loading,
                className: "px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 border border-sky-400/50 rounded-lg text-[9px] font-bold text-sky-300 flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(14,165,233,0.2)]",
                children: [
                  d.jsx("span", { className: loading ? "animate-spin" : "", children: "🔄" }),
                  loading ? "..." : "Havaozy"
                ]
              }),
              d.jsx("button", {
                onClick: function() { setIsOpen(!isOpen); },
                className: "px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 rounded-lg text-[9px] font-bold text-amber-300",
                children: isOpen ? "Afeno ▲" : "Asehoy Tabilao ▼"
              })
            ]
          })
        ]
      }),
      isOpen && (
        matches.length === 0 ? d.jsxs("div", {
          className: "p-6 md:p-8 text-center border-2 border-dashed border-amber-500/30 rounded-xl bg-gradient-to-r from-purple-950/25 via-sky-950/20 to-amber-950/20 space-y-2",
          children: [
            d.jsx("div", { className: "text-3xl animate-bounce", children: "⏳" }),
            d.jsx("div", { className: "font-black text-amber-300 text-xs md:text-sm tracking-wide", children: "Tsy mbola misy lalao mitovy 100% amin ny tahiry amin ireo Ligy 9 amin izao fotoana izao" }),
            d.jsxs("div", {
              className: "mt-2 p-2.5 rounded-lg bg-black/70 border border-sky-400/40 text-[10px] text-sky-200 max-w-lg mx-auto flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(14,165,233,0.15)]",
              children: [
                d.jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" }),
                d.jsx("span", {
                  children: "Manara-maso mivantana ny Ligy 9 rehetra... Raha vantany vao misy lalao mitovy 100% ny ekipa sy ny cotes dia hiseho avy hatrany eto ary haneno ny feo beep !"
                })
              ]
            }),
            d.jsx("div", { className: "text-[9px] text-purple-300/80 mt-2 font-mono", children: "📡 Live Scanning actif sur les 9 ligues virtuelles • Beep alerte automatique" })
          ]
        }) : d.jsx("div", {
          className: "space-y-3",
          children: matches.map(function(mItem, idx) {
            var exactScore = mItem.predictedExactScore || "1-1";
            var altScore = mItem.alternativeScore;
            var histScores = mItem.allHistoricalScores || [];
            return d.jsxs("div", {
              className: "rounded-xl border-2 border-amber-400/60 bg-gradient-to-r from-purple-950/50 via-sky-950/40 to-[#0c1322] p-3 md:p-4 shadow-[0_4px_25px_rgba(245,158,11,0.2)] relative overflow-hidden transition-all duration-200",
              children: [
                d.jsxs("div", {
                  className: "flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2.5 border-b border-amber-400/20",
                  children: [
                    d.jsxs("div", {
                      className: "flex items-center gap-2",
                      children: [
                        d.jsx("span", { className: "text-amber-400 text-sm animate-bounce", children: "⭐" }),
                        d.jsxs("div", {
                          children: [
                            d.jsxs("div", {
                              className: "font-black text-white text-xs md:text-sm tracking-wide flex items-center gap-2 flex-wrap",
                              children: [
                                d.jsxs("span", { className: "px-2 py-0.5 rounded bg-purple-600/30 border border-purple-400/50 text-[9px] font-bold text-purple-200 font-mono", children: [mItem.leagueFlag || "⚽", " ", mItem.leagueName || ("Ligy " + mItem.leagueId)] }),
                                d.jsx("span", { className: "text-emerald-400 font-bold", children: "[DOM] " }),
                                mItem.team1,
                                d.jsx("span", { className: "text-yellow-400 font-mono text-xs font-black", children: "vs" }),
                                mItem.team2,
                                d.jsx("span", { className: "text-sky-400 font-bold", children: " [EXT]" })
                              ]
                            }),
                            d.jsxs("div", {
                              className: "flex items-center gap-2 text-[10px] text-white/50 font-mono mt-0.5",
                              children: [
                                d.jsxs("span", { className: "text-amber-300 font-bold", children: [mItem.round || ("Round " + mItem.roundNumber)] }),
                                d.jsx("span", { children: "•" }),
                                d.jsxs("span", { className: "text-sky-300/80", children: ["Manomboka: ", mItem.expectedStart ? new Date(mItem.expectedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Ho avy"] })
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
                          className: "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/25 to-emerald-500/25 text-amber-200 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse",
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
                      className: "p-2 rounded-lg bg-black/70 border border-sky-400/40 shadow-[0_0_10px_rgba(14,165,233,0.1)]",
                      children: [
                        d.jsx("div", { className: "text-[9px] font-mono text-sky-300 uppercase font-bold", children: "Cotes 1X2 Mitovy Tanteraka" }),
                        d.jsxs("div", {
                          className: "flex items-center gap-3 font-mono font-bold text-xs mt-1",
                          children: [
                            d.jsxs("span", { className: "text-emerald-400 font-black", children: ["1: ", mItem.odds1 || "-"] }),
                            d.jsx("span", { className: "text-white/20", children: "|" }),
                            d.jsxs("span", { className: "text-yellow-400 font-black", children: ["X: ", mItem.oddsN || "-"] }),
                            d.jsx("span", { className: "text-white/20", children: "|" }),
                            d.jsxs("span", { className: "text-purple-300 font-black", children: ["2: ", mItem.odds2 || "-"] })
                          ]
                        })
                      ]
                    }),
                    d.jsxs("div", {
                      className: "p-2 rounded-lg bg-emerald-950/40 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
                      children: [
                        d.jsx("div", { className: "text-[9px] font-mono text-emerald-300 uppercase font-bold", children: "Pronostic Total Buts" }),
                        d.jsx("div", { className: "font-black text-xs md:text-sm text-yellow-300 mt-1", children: mItem.predictionAssuree })
                      ]
                    }),
                    d.jsxs("div", {
                      className: "p-2 rounded-lg bg-purple-950/40 border border-purple-400/40 shadow-[0_0_10px_rgba(168,85,247,0.1)]",
                      children: [
                        d.jsx("div", { className: "text-[9px] font-mono text-purple-300 uppercase flex items-center justify-between font-bold", children: [d.jsx("span", { children: "Score Exact Voatahiry" }), altScore && d.jsxs("span", { className: "text-sky-300 text-[8.5px]", children: ["Alt: ", altScore] })] }),
                        d.jsxs("div", {
                          className: "flex items-center gap-2 mt-1",
                          children: [
                            d.jsx("span", { className: "px-2 py-0.5 rounded font-black font-mono text-sm bg-amber-500/25 text-amber-200 border border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.25)]", children: exactScore }),
                            histScores.length > 0 && d.jsxs("span", {
                              className: "text-[9px] font-mono text-emerald-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-400/30",
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

content = content.substring(0, startIndex) + newWidgetCode + content.substring(endIndex);

// Validate with esbuild
try {
  esbuild.transformSync(content, { loader: 'js' });
  console.log('ESBUILD VALIDATION: 100% PERFECT!');
  fs.writeFileSync(filePath, content, 'utf8');
  fs.writeFileSync('/app/applet/dist/assets/index-CxKXGYsU.js', content, 'utf8');
  console.log('Successfully updated bundles with new color palette!');
} catch (err) {
  console.error('ESBUILD ERROR:', err.message);
  process.exit(1);
}
