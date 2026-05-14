'use client';

import { fetchPointsTable } from '@/lib/api';
import { TEAM_THEMES, type TeamCode } from '@/lib/store';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';

interface PointsRow {
  team: string;
  played: number;
  won: number;
  lost: number;
  nr: number;
  pts: number;
  nrr: string;
}

export default function PointsTable({ fullPage = false }: { fullPage?: boolean }) {
  const [rows, setRows] = useState<PointsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPointsTable();
        if (Array.isArray(data) && data.length > 0) setRows(data);
      } catch (e) {
        console.error('[PointsTable]', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const displayRows = fullPage ? rows : rows.slice(0, 6);

  return (
    <div className={`glass rounded-2xl overflow-hidden ${
      fullPage ? 'w-full' : ''
    }`}>

      {!fullPage && (
        <div className="flex items-center gap-2 px-5 pt-5 mb-3">
          <span className="text-lg">🏆</span>
          <h3 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider">
            Points Table
          </h3>
        </div>
      )}

      {loading ? (
        <div className="space-y-2 p-5">
          {[...Array(fullPage ? 10 : 5)].map((_, i) => (
            <div key={i} className="skeleton h-10 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[rgb(var(--color-muted))] text-center py-8">
          Points table loading…
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[rgb(var(--color-muted))] border-b border-[rgba(var(--color-border),0.2)] bg-[rgba(var(--color-surface),0.4)]">
                <th className={`text-left font-semibold ${ fullPage ? 'py-3 px-5 text-xs' : 'py-2 px-5 text-[10px]' }`}>#</th>
                <th className={`text-left font-semibold ${ fullPage ? 'py-3 px-2 text-xs' : 'py-2 px-2 text-[10px]' }`}>Team</th>
                <th className={`text-center font-semibold ${ fullPage ? 'py-3 px-3 text-xs' : 'py-2 px-2 text-[10px]' }`}>P</th>
                <th className={`text-center font-semibold ${ fullPage ? 'py-3 px-3 text-xs' : 'py-2 px-2 text-[10px]' }`}>W</th>
                <th className={`text-center font-semibold ${ fullPage ? 'py-3 px-3 text-xs' : 'py-2 px-2 text-[10px]' }`}>L</th>
                {fullPage && <th className="text-center font-semibold py-3 px-3 text-xs">NR</th>}
                <th className={`text-center font-semibold text-[rgb(var(--color-primary))] ${ fullPage ? 'py-3 px-4 text-xs' : 'py-2 px-2 text-[10px]' }`}>PTS</th>
                <th className={`text-center font-semibold ${ fullPage ? 'py-3 px-4 text-xs' : 'py-2 px-2 text-[10px]' }`}>NRR</th>
                {fullPage && <th className="text-center font-semibold py-3 px-4 text-xs">Status</th>}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, idx) => {
                const code = row.team as TeamCode;
                const theme = TEAM_THEMES[code];
                const isTopFour = idx < 4;
                const isLast = idx === rows.length - 1;
                return (
                  <Fragment key={row.team}>
                    {/* Divider after top 4 in fullPage mode */}
                    {fullPage && idx === 4 && (
                      <tr key="divider">
                        <td colSpan={9} className="px-5 py-1">
                          <div className="h-px bg-[rgba(var(--color-border),0.3)] relative">
                            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 text-[9px] font-bold text-[rgb(var(--color-muted))] bg-[rgb(var(--color-bg))] px-2">
                              PLAYOFF LINE
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr
                      key={row.team}
                      className={`border-b border-[rgba(var(--color-border),0.1)] transition-colors group ${
                        isTopFour
                          ? 'bg-[rgba(var(--color-primary),0.03)] hover:bg-[rgba(var(--color-primary),0.07)]'
                          : 'hover:bg-[rgba(var(--color-surface),0.4)]'
                      }`}
                    >
                      {/* Rank */}
                      <td className={`${ fullPage ? 'py-3 px-5' : 'py-2 px-5' } font-bold`}>
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                            isTopFour
                              ? 'text-xs'
                              : 'text-[rgb(var(--color-muted))]'
                          }`}
                          style={isTopFour ? {
                            background: `rgba(${theme?.glow ?? '100,100,100'},0.18)`,
                            color: theme?.primary ?? '#aaa',
                          } : {}}
                        >
                          {idx + 1}
                        </span>
                      </td>

                      {/* Team */}
                      <td className={`${ fullPage ? 'py-3 px-2' : 'py-2 px-2' }`}>
                        <Link href={`/team/${code}`} className="flex items-center gap-2 group/link">
                          {theme?.logo && (
                            <img
                              src={theme.logo}
                              alt={code}
                              className={`object-contain flex-shrink-0 ${ fullPage ? 'w-7 h-7' : 'w-5 h-5' }`}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <div>
                            <span
                              className={`font-bold group-hover/link:underline underline-offset-2 ${ fullPage ? 'text-sm' : 'text-xs' }`}
                              style={{ color: theme?.primary ?? 'rgb(var(--color-text))' }}
                            >
                              {row.team}
                            </span>
                            {fullPage && (
                              <p className="text-[10px] text-[rgb(var(--color-muted))] leading-none mt-0.5 hidden sm:block">
                                {theme ? {
                                  RCB: 'Royal Challengers Bengaluru',
                                  KKR: 'Kolkata Knight Riders',
                                  MI: 'Mumbai Indians',
                                  CSK: 'Chennai Super Kings',
                                  GT: 'Gujarat Titans',
                                  SRH: 'Sunrisers Hyderabad',
                                  DC: 'Delhi Capitals',
                                  RR: 'Rajasthan Royals',
                                  LSG: 'Lucknow Super Giants',
                                  PBKS: 'Punjab Kings',
                                }[code] ?? code : code}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>

                      {/* Stats */}
                      <td className={`text-center text-[rgb(var(--color-muted))] ${ fullPage ? 'py-3 px-3 text-sm' : 'py-2 px-2 text-xs' }`}>{row.played}</td>
                      <td className={`text-center font-semibold text-green-400 ${ fullPage ? 'py-3 px-3 text-sm' : 'py-2 px-2 text-xs' }`}>{row.won}</td>
                      <td className={`text-center font-semibold text-red-400 ${ fullPage ? 'py-3 px-3 text-sm' : 'py-2 px-2 text-xs' }`}>{row.lost}</td>
                      {fullPage && <td className="py-3 px-3 text-sm text-center text-[rgb(var(--color-muted))]">{row.nr}</td>}
                      <td className={`text-center font-black text-[rgb(var(--color-text))] ${ fullPage ? 'py-3 px-4 text-base' : 'py-2 px-2 text-xs' }`}>{row.pts}</td>
                      <td className={`text-center font-semibold ${ fullPage ? 'py-3 px-4 text-sm' : 'py-2 px-2 text-xs' } ${
                        row.nrr?.startsWith('+') ? 'text-green-400' : 'text-red-400'
                      }`}>{row.nrr}</td>

                      {/* Status badge */}
                      {fullPage && (
                        <td className="py-3 px-4 text-center">
                          {isTopFour ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">
                              Q
                            </span>
                          ) : isLast ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
                              E
                            </span>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          <div className={`flex items-center gap-4 ${ fullPage ? 'px-5 py-3' : 'px-5 py-2' } text-[10px] text-[rgb(var(--color-muted))] opacity-70 border-t border-[rgba(var(--color-border),0.15)]`}>
            <span><span className="font-bold text-green-400">Q</span> = Qualified for playoffs</span>
            {fullPage && <span><span className="font-bold text-red-400">E</span> = Eliminated</span>}
            {!fullPage && (
              <span className="ml-auto">Top 4 qualify</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
