export class SeededRNG {
  private state:number;
  constructor(seed=42){ this.state=seed%2147483647; if(this.state<=0)this.state+=2147483646; for(let i=0;i<50;i++)this.next(); }
  next():number{ this.state=(this.state*16807)%2147483647; return (this.state-1)/2147483646; }
  normal(m=0,s=1):number{ let u1=this.next(),u2=this.next(); while(u1<=1e-7)u1=this.next(); return m+Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)*s; }
  logNormal(mu:number,s:number):number{ return Math.exp(this.normal(mu,s)); }
  exp(mean:number):number{ return -mean*Math.log(1-this.next()); }
}
export type Policy='fixed'|'heuristic_min_queue'|'heuristic_expected_wait'|'heuristic_projected'|'multicriteria'|'multicriteria_no_digg'|'rl'|'rl_no_digg'|'rl_no_digg2'|'rl_w2'|'rl_w2_clean'|'rl_w6'|'rl_w6_clean';
export interface Scenario { id: string; shovels: number; trucks: number; dist: number[]; rel: 'none' | 'moderate' | 'severe'; }
/**
 * Safe, externally prepared per-face input. The powder factor is q in kg/m³
 * and is used in the article's unit-cost equation. Fragmentation remains external.
 */
export interface FragmentationProfile {
  shovelIndex: number;
  faceId: string;
  p80Mm: number;
  rockMassIndex: number;
  diggability: number;
  powderFactorKgM3: number;
}
export interface Agent { choose(f: number[][], g: number[], ctx: { dumped: number }, stochastic: boolean): number; endEpisode?(m: { tph: number; cost: number; E: number }): void; }
export const FEAT_N = 10;

const PPO_POLICIES = new Set<Policy>([
  "rl", "rl_no_digg", "rl_no_digg2",
  "rl_w2", "rl_w2_clean", "rl_w6", "rl_w6_clean",
]);

function validateProfiles(profiles: FragmentationProfile[], shovelCount: number): void {
  if (!Array.isArray(profiles) || profiles.length !== shovelCount) {
    throw new Error(`Se requieren exactamente ${shovelCount} perfiles externos, uno por pala.`);
  }
  const ids = new Set<string>();
  const shovelIndices = new Set<number>();
  for (const [index, profile] of profiles.entries()) {
    if (!profile || typeof profile.faceId !== 'string' || !profile.faceId.trim() || ids.has(profile.faceId)) {
      throw new Error(`Identificador de frente inválido o repetido en el perfil ${index + 1}.`);
    }
    ids.add(profile.faceId);
    if (!Number.isInteger(profile.shovelIndex) || profile.shovelIndex < 0 || profile.shovelIndex >= shovelCount || shovelIndices.has(profile.shovelIndex)) {
      throw new Error(`Perfil ${profile.faceId}: shovelIndex debe ser único y estar entre 0 y ${shovelCount - 1}.`);
    }
    shovelIndices.add(profile.shovelIndex);
    const allowedKeys = ['shovelIndex', 'faceId', 'p80Mm', 'rockMassIndex', 'diggability', 'powderFactorKgM3'];
    if (Object.keys(profile).some((key) => !allowedKeys.includes(key))) throw new Error(`Perfil ${profile.faceId}: contiene campos no admitidos.`);
    const fields: Array<[string, number, number, number]> = [
      ['p80Mm', profile.p80Mm, 5, 1500],
      ['rockMassIndex', profile.rockMassIndex, 1, 14],
      ['diggability', profile.diggability, 0, 100],
      ['powderFactorKgM3', profile.powderFactorKgM3, Number.MIN_VALUE, Number.MAX_VALUE],
    ];
    for (const [name, value, min, max] of fields) {
      if (!Number.isFinite(value) || value < min || value > max) {
        throw new Error(`Perfil ${profile.faceId}: ${name} debe estar entre ${min} y ${max}.`);
      }
    }
  }
}
const REL={none:null,moderate:{sMtbf:30,sMttr:3,tMtbf:50,tMttr:2},severe:{sMtbf:12,sMttr:3,tMttr:3,tMtbf:25}};
const DT=5, SHIFT=8*3600;

export class MineSimV3 {
  rng:SeededRNG; frng:SeededRNG; trucks:any[]=[];
  constructor(seed:number){ this.rng=new SeededRNG(seed); this.frng=new SeededRNG(seed*7919+13); }
  private sched(mtbfH:number,mttrH:number):[number,number][]{
    const out:[number,number][]=[]; let t=0;
    while(true){ t+=this.frng.exp(mtbfH*3600); if(t>=SHIFT)break; const d=mttrH*3600*this.frng.logNormal(-0.125,0.5); out.push([t,t+d]); t+=d; }
    return out;
  }
  run(policy: Policy, sc: Scenario, profiles: FragmentationProfile[], agent?: Agent, stochastic = false, rep = 1, exponent = 0.38): any {
    const NS = sc.shovels, NT = sc.trucks, rng = this.rng;
    if (PPO_POLICIES.has(policy) && !agent) {
      throw new Error(`La política PPO "${policy}" requiere un agente PPO cargado.`);
    }
    validateProfiles(profiles, NS);
    const orderedProfiles = [...profiles].sort((a, b) => a.shovelIndex - b.shovelIndex);
    if (!Number.isInteger(NS) || NS < 1 || NS > 4 || !Number.isInteger(NT) || NT < 1 || NT > 24 || !Array.isArray(sc.dist) || sc.dist.length !== NS || sc.dist.some((d) => !Number.isFinite(d) || d <= 0)) throw new Error('Configuración de flota o distancias inválida.');
    if (!['none', 'moderate', 'severe'].includes(sc.rel)) throw new Error('Nivel de fallas inválido.');
    if (!Number.isFinite(exponent) || exponent <= 0 || exponent > 1) throw new Error('El exponente SAG debe estar en (0, 1].');
    const cap=240, loadedV=24/3.6, emptyV=38/3.6;
    // Fallas exógenas: misma semilla => mismo calendario para todas las políticas.
    const R=REL[sc.rel]; const shSched:[number,number][][]=[]; const trPend:number[]=Array(NT).fill(0); const trSched:[number,number][][]=[];
    for(let s=0;s<NS;s++) shSched.push(R?this.sched(R.sMtbf,R.sMttr):[]);
    for(let k=0;k<NT;k++) trSched.push(R?this.sched(R.tMtbf,R.tMttr):[]);
    // Los perfiles externos ya contienen P80, geomecánica, excavabilidad y q.
    const sh: any[] = [];
    for (let s = 0; s < NS; s++) {
      const profile = orderedProfiles[s];
      // Mantiene alineada la secuencia PRNG del motor v3 original.
      rng.logNormal(0, 0.055);
      rng.logNormal(0, 0.025);
      rng.logNormal(0, 0.025);
      const loadingFactor = Math.max(0.65, Math.min(1.45, 1 + (80 - profile.diggability) * 0.007));
      sh.push({
        A: profile.rockMassIndex,
        profile,
        base: 145 * loadingFactor + (s === 1 ? 15 : 0),
        queue: [] as number[], cur: -1, rem: 0, starv: 0, down: false, downLeft: 0,
      });
    }
    const dumpedBy=Array(NS).fill(0), dec=Array(NS).fill(0);
    const cr={queue:[] as number[],cur:-1,rem:0,dumped:0};
    const tr:any[]=[]; this.trucks=tr;
    for(let i=0;i<NT;i++){ const a=i%NS; tr.push({id:i,pay:0,st:'returning',sh:a,rem:Math.max(10,Math.round(sc.dist[a]/emptyV*(i/NT))),fuel:0,cyc:0}); }
    let wShovel=0,wCrusher=0,cycles=0;
    for(let t=0;t<SHIFT;t+=DT){
      for(let s=0;s<NS;s++){ const dn=shSched[s].find(([a,b])=>t>=a&&t<b); sh[s].down=!!dn; sh[s].downLeft=dn?dn[1]-t:0; }
      for(let k=0;k<NT;k++){ while(trSched[k].length&&trSched[k][0][0]<=t){ trPend[k]+=trSched[k][0][1]-trSched[k][0][0]; trSched[k].shift(); } }
      // Chancador.
      if(cr.cur>=0){ cr.rem-=DT; if(cr.rem<=0){
        const k=tr[cr.cur]; cr.dumped+=k.pay; dumpedBy[k.sh]+=k.pay; k.pay=0; k.cyc++; cycles++;
        const nx=this.select(policy,k,sh,sc.dist,emptyV,agent,stochastic,cr.dumped,dumpedBy,t); dec[nx]++;
        k.sh=nx; k.st='returning'; k.rem=Math.round(sc.dist[nx]/emptyV*rng.logNormal(0,0.08)+trPend[cr.cur]); trPend[cr.cur]=0; cr.cur=-1; } }
      else if(cr.queue.length){ cr.cur=cr.queue.shift()!; cr.rem=Math.round(65*rng.logNormal(0,0.06)); tr[cr.cur].st='dumping'; }
      // Palas.
      for(let s=0;s<NS;s++){ const p=sh[s];
        if(p.down) { continue; }
        if(p.cur>=0){ p.rem-=DT; if(p.rem<=0){ const k=tr[p.cur]; k.pay=cap; k.st='hauling';
          k.rem=Math.round(sc.dist[s]/loadedV*rng.logNormal(0,0.09)+trPend[p.cur]); trPend[p.cur]=0; k.fuel+=(sc.dist[s]/1000)*4.2; p.cur=-1; } }
        else if(p.queue.length){ p.cur=p.queue.shift()!; p.rem=Math.round(p.base*rng.logNormal(0,0.09)); tr[p.cur].st='loading'; }
        else p.starv+=DT; }
      // Camiones.
      for(const k of tr){
        if(k.st==='returning'){ k.rem-=DT; k.fuel+=(DT/3600)*85; if(k.rem<=0){ k.st='queuing_shovel'; sh[k.sh].queue.push(k.id);} }
        else if(k.st==='queuing_shovel'){ wShovel+=DT; k.fuel+=(DT/3600)*45; }
        else if(k.st==='hauling'){ k.rem-=DT; if(k.rem<=0){ k.st='queuing_crusher'; cr.queue.push(k.id);} }
        else if(k.st==='queuing_crusher'){ wCrusher+=DT; k.fuel+=(DT/3600)*45; } }
    }
    const tot=cr.dumped;
    if (!(tot > 0)) throw new Error(`La réplica ${rep} del escenario ${sc.id} no entregó toneladas; no se puede calcular el blending ni el costo unitario.`);
    const tph=tot/8, fuelT=tr.reduce((a,k)=>a+k.fuel,0)/tot;
    // Solo contribuyen al blending las palas que realmente entregaron mineral.
    let wP = 0, wA = 0, wD = 0, wQ = 0;
    for (let s = 0; s < NS; s++) {
      const delivered = dumpedBy[s];
      wP += delivered * sh[s].profile.p80Mm;
      wA += delivered * sh[s].profile.rockMassIndex;
      wD += delivered * sh[s].profile.diggability;
      wQ += delivered * sh[s].profile.powderFactorKgM3;
    }
    const bP = wP / tot, bA = wA / tot, bD = wD / tot, bQ = wQ / tot;
    const eps = Math.max(0.92, Math.min(1.08, rng.logNormal(0, 0.035)));
    const wShovelMin = cycles ? wShovel / cycles / 60 : 0, wCrusherMin = cycles ? wCrusher / cycles / 60 : 0;
    const esag = 8.2 * Math.pow(bP / 240, exponent) * Math.pow(bA / 7.2, 0.25) * eps;
    // Ecuación de costo unitario del artículo: incluye el factor de carga q ponderado por toneladas.
    const cOther = (0.55 + 0.42 * bQ) + fuelT * 1.18 + (0.85 + 0.0075 * (100 - bD)) + 0.95;
    const cost = cOther + esag * 0.088, co2 = fuelT * 2.68 + esag * 0.45;
    if(agent&&agent.endEpisode) agent.endEpisode({tph,cost,E:esag});
    const mx=Math.max(...dumpedBy)/tot;
    return {scenario:sc.id,rep,policy,tph:Math.round(tph),wShovel:wShovelMin,wCrusher:wCrusherMin,cycle:cycles?(SHIFT*NT/cycles)/60:0,fuel:fuelT,
      blendP80: bP, blendA: bA, blendD: bD, blendPowderFactorKgM3: bQ, eps, esag, cost, co2, cOther, shareMax: mx, decisions: dec.reduce((a,b)=>a+b,0),
      active:tr.filter(k=>k.cyc>0).length};
  }
  private select(policy:Policy,k:any,sh:any[],dist:number[],eV:number,agent:Agent|undefined,stoch:boolean,dumped:number,dumpedBy:number[],t:number):number{
    const N=sh.length; const ql=(s:any)=>s.queue.length+(s.cur>=0?1:0);
    const enr=(i:number)=>this.trucks.filter((x:any)=>x.st==='returning'&&x.sh===i&&x.id!==k.id).length;
    if(policy==='fixed') return k.sh;
    if(policy==='heuristic_min_queue'){ let b=-1,bq=1e9; for(let i=0;i<N;i++){ if(sh[i].down)continue; const q=ql(sh[i]); if(q<bq){bq=q;b=i;} } if(b<0){ b=0; bq=ql(sh[0]); for(let i=1;i<N;i++){ if(ql(sh[i])<bq){bq=ql(sh[i]);b=i;} } } return b; }
    if(policy==='heuristic_expected_wait'){ let b=0,bt=1e18; for(let i=0;i<N;i++){ const tt=dist[i]/eV+(sh[i].queue.length+(sh[i].cur>=0?0.5:0))*sh[i].base+sh[i].downLeft; if(tt<bt){bt=tt;b=i;} } return b; }
    if(policy==='heuristic_projected'){ let b=0,bt=1e18; for(let i=0;i<N;i++){ const travel=dist[i]/eV; const backlog=(sh[i].queue.length+(sh[i].cur>=0?0.5:0)+enr(i))*sh[i].base+sh[i].downLeft; const tt=Math.max(travel,backlog)+sh[i].base; if(tt<bt){bt=tt;b=i;} } return b; }
    if(policy==='multicriteria'||policy==='multicriteria_no_digg'){ let b=0,bs=-1e18; for(let i=0;i<N;i++){
      const sc=(sh[i].starv>60?3:0)+(policy==='multicriteria'?sh[i].profile.diggability/50:0)-ql(sh[i])*1.85-(dist[i]/3000)*1.2-(sh[i].down?10:0); if(sc>bs){bs=sc;b=i;} } return b; }
    // RL.
    const tot=Math.max(1,dumped); const f:number[][]=[];
    for(let i=0;i<N;i++){ const s=sh[i]; f.push([ql(s)/4, i===k.sh?1:0, dist[i]/eV/600, (['rl','rl_w2','rl_w6'].includes(policy)?s.profile.diggability/100:0), Math.min(s.starv,300)/300, s.down?1:0, Math.min(s.downLeft/3600,1), (['rl_no_digg2','rl_w2_clean','rl_w6_clean'].includes(policy)?0:s.base/200), dumpedBy[i]/tot-1/N, enr(i)/4]); }
    const g=Array(FEAT_N).fill(0); for(const r of f) for(let j=0;j<FEAT_N;j++) g[j]+=r[j]/N;
    g.push(Math.max(...f.map(r=>r[0])), t/SHIFT);
    return agent!.choose(f,g,{dumped},stoch);
  }
}
