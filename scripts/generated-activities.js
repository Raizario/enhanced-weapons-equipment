/** dnd5e 6.x utility activities for Enhanced Weapons. No Midi-QOL required. */
import { MODULE_ID } from './constants.js';
import { masteryState } from './mastery.js';
import { synchronizeMastery, permanentProperties, switchIndependentMastery } from './mastery-runtime.js';

const inflight = new Set();
const MANEUVERS = {
  brawler: ['Brawler — Shove / Grapple', 'bonus', 'After attacking with this weapon as part of the Attack action, use a Bonus Action to shove or grapple the opponent.'],
  brace: ['Brace — Reactive Strike', 'reaction', 'When a creature you can see willingly moves into your reach, use your Reaction to make one melee weapon attack against it.'],
  deflect: ['Deflect — Reduce Damage', 'reaction', 'When a creature within 5 feet hits you, use your Reaction to reduce damage by 1d4 + proficiency bonus (minimum 0).'],
  disarm: ['Disarm — Special Attack', 'action', 'Replace one attack of the Attack action with a disarming attack, using the contest and size rules in the Enhanced Weapons document. No damage on success.'],
  drag: ['Drag — Special Attack', 'action', 'Replace one attack of the Attack action with a dragging attack, using the contest and size rules in the Enhanced Weapons document. On success, pull the target up to 10 feet.'],
  trip: ['Trip — Special Attack', 'action', 'Replace one attack of the Attack action with a tripping attack, using the contest and size rules in the Enhanced Weapons document. On success, deal weapon damage and knock prone.'],
  flourish: ['Flourish — Opening Maneuver', 'special', 'Before the first attack of your Attack action while wielding this weapon in two hands, make a DC 13 Strength or Dexterity check, adding proficiency if proficient. Success: +2 to the first weapon attack this turn. Failure: take damage equal to proficiency bonus.']
};

function entries(item) {
  const flags = item.flags?.[MODULE_ID] ?? {};
  const base = permanentProperties(item);
  const mastery = masteryState(flags);
  const combo = !!flags.combinationEnabled;
  const list = [];
  const switchSpeed = String(flags.combinationSpeed ?? 'standard').toLowerCase();
  if (combo) list.push({kind:'profile-switch', name:'Change Weapon Profile', activation:switchSpeed === 'slow'?'action':'bonus',
    explanation:`Transform into the other weapon profile (${switchSpeed} Combination speed).`,type:'utility'});
  if (mastery.mode === 'yes' && mastery.first && mastery.second && mastery.first !== mastery.second)
    list.push({kind:'mastery-stance',name:'Switch Mastery Stance',activation:'bonus',explanation:'Adopt your other configured Mastery.',type:'utility'});
  if (combo) {
    const profiles=profileState(item);
    for (const which of ['first','second']) {
      const profile=profiles[which];
      const prefix=profile.name?.trim() || (which==='first'?'Primary':'Secondary');
      list.push({kind:`profile-${which}-attack`,name:`${prefix}: Attack`,activation:'action',type:'attack',
        explanation:`Attack using the ${prefix} weapon profile.`,damage:profile.damage,profile:which});
      const properties=new Set(profile.properties);
      // The profile-specific mastery applies only when the mastery mode is tied to profiles.
      if(mastery.mode==='combination') {const key=which==='first'?mastery.first:mastery.second;if(key)properties.add(key);}
      for(const [key,[name,activation,explanation]] of Object.entries(MANEUVERS)) if(properties.has(key))
        list.push({kind:`profile-${which}-${key}`,name:`${prefix}: ${name}`,activation,type:'utility',explanation,profile:which});
      for(const key of ['flexible','momentum']) if(properties.has(key)) list.push({kind:`profile-${which}-${key}`,name:`${prefix}: ${key==='flexible'?'Flexible — Follow-up Strike':'Momentum — Charging Strike'}`,
        activation:key==='flexible'?'bonus':'action',type:'attack',profile:which,rule:key,
        explanation:key==='flexible'?'After taking the Attack action, make the bonus attack.':'Requires 20 feet of straight movement toward the target; once per turn.'});
    }
  } else {
    const properties=new Set(base);
    if(mastery.enabled){if(mastery.first)properties.add(mastery.first);if(mastery.second)properties.add(mastery.second);}
    for(const [key,[name,activation,explanation]] of Object.entries(MANEUVERS)) if(properties.has(key))
      list.push({kind:`maneuver-${key}`,name,activation,type:'utility',explanation});
    for(const key of ['flexible','momentum']) if(properties.has(key)) list.push({kind:`maneuver-${key}`,
      name:key==='flexible'?'Flexible — Follow-up Strike':'Momentum — Charging Strike',
      activation:key==='flexible'?'bonus':'action',type:'attack',rule:key,
      explanation:key==='flexible'?'After the Attack action, make a bonus weapon attack.':'Requires 20 feet of straight movement toward the target; once per turn.'});
  }
  return list;
}
function damagePart(d) {
  const type=d?.type||'slashing';
  if(d?.formulaMode && String(d.formula||'').trim()) return {custom:{enabled:true,formula:String(d.formula)},types:{[type]:true}};
  return {number:Math.max(0,Number(d?.number??1)),denomination:d?.die||'d8',bonus:String(d?.bonus??''),types:{[type]:true}};
}
function managedActivities(item) {
  const col = item.system?.activities;
  const activities = col?.contents ?? (col?.values ? [...col.values()] : []);
  return activities.filter(a => a.flags?.[MODULE_ID]?.generatedKind);
}
export async function synchronizeGeneratedActivities(item) {
  if (item?.type !== 'weapon' || !item.isOwner || typeof item.createActivity !== 'function' || inflight.has(item.uuid)) return;
  inflight.add(item.uuid);
  try {
    const wanted=entries(item);
    const existing=managedActivities(item);
    const valid=new Set(wanted.map(e=>e.kind));
    // Only manage our own activities; never delete custom activities.
    for(const old of existing) if(!valid.has(old.flags[MODULE_ID].generatedKind)) await old.delete();
    for(const spec of wanted){
      const current=existing.find(a=>a.flags[MODULE_ID].generatedKind===spec.kind);
      const data={name:spec.name,activation:{type:spec.activation,value:1,override:true},
        description:{chatFlavor:spec.explanation},flags:{[MODULE_ID]:{generatedKind:spec.kind,profile:spec.profile??null}}};
      if(spec.type==='attack'){
        const stored=spec.rule ? item.getFlag(MODULE_ID,`${spec.rule}Attack`) : spec.damage;
        const fallback=spec.rule==='momentum'?{number:2,die:'d6',bonus:'',type:'slashing'}:{number:1,die:'d4',bonus:'',type:'bludgeoning'};
        // Inherit the attack bonus and ability configuration of the weapon.
        data.attack={type:{value:item.system.attackType||'melee',classification:'weapon'}};
        data.damage={includeBase:false,parts:[damagePart(stored??fallback)]};
      }
      if(current && current.type!==spec.type){await current.delete();await item.createActivity(spec.type,data,{renderSheet:false});continue;}
      if(!current){await item.createActivity(spec.type,data,{renderSheet:false});continue;}
      const patch={};
      if(current.name!==data.name)patch.name=data.name;
      if(current.activation?.type!==spec.activation){patch['activation.type']=spec.activation;patch['activation.override']=true;}
      if(spec.type==='attack'){
        patch['damage.includeBase']=false;
        patch['damage.parts']=data.damage.parts;
      }
      if(Object.keys(patch).length)await current.update(patch,{render:false});
    }
  }catch(error){console.error(`${MODULE_ID} | Unable to synchronize activities for ${item.name}`,error);}
  finally{inflight.delete(item.uuid);}
}

export function registerGeneratedActivities() {
  Hooks.on('dnd5e.postUseActivity', (activity) => {
    const kind = activity?.flags?.[MODULE_ID]?.generatedKind;
    if (!['profile-switch','mastery-stance','mastery-switch'].includes(kind)) return;
    const item = activity.item;
    // The activity may be an execution clone; resolve to the authoritative embedded item.
    const original = item?.actor?.items?.get(item.id) ?? item;
    if (!original?.actor) return;
    const flags = original.flags?.[MODULE_ID] ?? {};
    const state = masteryState(flags);
    const combo=!!flags.combinationEnabled;
    const next = kind==='mastery-stance' ? (state.active==='first'?'second':'first') : combo ? ((flags.profileActive||'first')==='first'?'second':'first') : (state.active==='first'?'second':'first');
    if(kind==='mastery-stance') void switchIndependentMastery(original).catch(error=>console.error(`${MODULE_ID} | Stance activity`,error));
    else void synchronizeMastery(original, {next, announce:true}).catch(error => console.error(`${MODULE_ID} | Mastery activity`, error));
  });
  Hooks.on('updateItem', (item, changes) => {
    if (item.type !== 'weapon' || inflight.has(item.uuid)) return;
    const relevant = 'system' in changes || !!foundry.utils.getProperty(changes, `flags.${MODULE_ID}`);
    if (relevant) void synchronizeGeneratedActivities(item);
  });
  Hooks.on('createItem', item => { if (item.type === 'weapon') void synchronizeGeneratedActivities(item); });
  Hooks.once('ready', () => {
    if (!game.user?.isGM) return;
    for (const item of game.items ?? []) if (item.type === 'weapon') void synchronizeGeneratedActivities(item);
    for (const actor of game.actors ?? []) for (const item of actor.items ?? []) {
      if (item.type === 'weapon') void synchronizeGeneratedActivities(item);
    }
  });
}
