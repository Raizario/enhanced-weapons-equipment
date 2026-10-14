import { MODULE_ID } from './constants.js';

export const KEYS = 'adaptable agile attached bludgeon brace brawler brutal bulky bypass covert cumbersome defensive deflect demolish disarm drag execute farshot flense flexible flourish hidden lacerate liquidate momentum mount nimble parry penetrate repeater swift trip finesse heavy light reach thrown twoHanded versatile loading ammunition reload'.split(' ').sort();
export const defaultDamage = () => ({formulaMode:false,number:1,die:'d8',bonus:'',formula:'',type:'slashing'});
const profile = data => ({name:String(data?.name||''),properties:Array.isArray(data?.properties)?data.properties:[],damage:{...defaultDamage(),...(data?.damage??{})}});
export function profileState(item) {
 const flags=item.flags?.[MODULE_ID]??{};
 const native=item.system.damage?.base??{};
 const properties=[...(flags.profileBaseProperties??item.system.properties??[])].filter(x=>x!=='combination');
 const def={name:'Primary',properties,damage:{...defaultDamage(), number:native.number??1, die:native.denomination??'d8',bonus:native.bonus??'',formula:native.custom?.formula??'',type:Object.keys(native.types??{})[0]??'slashing'}};
 return {first:profile(flags.profilePrimary??def),second:profile(flags.profileSecondary??{name:'Secondary',properties:[],damage:defaultDamage()})};
}
export function profileProperties(state, which) {return new Set(state[which]?.properties??[]);}
export function nativeDamagePatch(item,state,which) {
 const d=state[which].damage;
 const damageType=d.type||'slashing';
 const priorTypes=Object.keys(item.system.damage?.base?.types??{});
 const patch={ 'system.damage.base.types':Object.fromEntries([...new Set([...priorTypes,damageType])].map(type=>[type,type===damageType]))};
 if(d.formulaMode && String(d.formula||'').trim()){
   patch['system.damage.base.custom.enabled']=true;
   patch['system.damage.base.custom.formula']=String(d.formula);
 }else{
   patch['system.damage.base.custom.enabled']=false;
   patch['system.damage.base.number']=Math.max(0,Number(d.number)||0);
   patch['system.damage.base.denomination']=d.die||'d8';
   patch['system.damage.base.bonus']=String(d.bonus||'');
 }
 return patch;
}
