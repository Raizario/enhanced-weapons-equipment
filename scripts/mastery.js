export const MASTERY_OPTIONS = 'adaptable agile attached bludgeon brace brawler brutal bulky bypass covert cumbersome defensive deflect demolish disarm drag execute farshot flense flexible flourish hidden lacerate liquidate momentum mount nimble parry penetrate repeater swift trip'.split(' ').sort();
export function masteryState(flags = {}) {
  const mode = flags.masteryMode || (flags.masteryEnabled === true ? 'yes' : 'no');
  const enabled = mode !== 'no';
  const first = MASTERY_OPTIONS.includes(flags.masteryFirst) ? flags.masteryFirst : '';
  const second = MASTERY_OPTIONS.includes(flags.masterySecond) ? flags.masterySecond : '';
  const active = flags.masteryActive === 'second' ? 'second' : 'first';
  const firstDie = [4,6,8,10,12].includes(Number(flags.masteryFirstDie)) ? Number(flags.masteryFirstDie) : 6;
  const secondDie = [4,6,8,10,12].includes(Number(flags.masterySecondDie)) ? Number(flags.masterySecondDie) : 6;
  return { enabled, mode, first, second, active, firstDie, secondDie };
}
export function labelMastery(key, die) {
  if (!key) return 'Not selected';
  const label = game.i18n.localize(`EWE.Property.${key}`);
  return key === 'lacerate' ? `${label} (d${die})` : label;
}
