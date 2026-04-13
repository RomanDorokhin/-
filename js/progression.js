// === ПРОГРЕССИЯ РАУНДОВ ===

let enemyUnitPowerMult = 1.0;
let enemyCountBonus = 0;
let isSoftRound = false;

function applyDifficultyScaling() {
  // Каждый 3-й раунд — мягкий (бонус игроку)
  isSoftRound = (roundNum % 3 === 0);
  const softMult = isSoftRound ? 0.6 : 1.0;

  // Враг сильнее
  enemyUnitPowerMult = 1.0 + (roundNum - 1) * 0.12 * softMult;
  enemyCountBonus = Math.floor((roundNum - 1) * 0.8 * softMult);

  // Меньше времени на экономику (минимум 40 сек)
  econTimer = Math.max(40000, ECON_DURATION - (roundNum - 1) * 4000);

  // Ракеты опаснее
  ROCKET_DAMAGE = 50 + (roundNum - 1) * 8;

  // Бонус игроку в мягкий раунд
  if (isSoftRound && P) {
    P.res += 80;
    addFx(CW / 2, CH / 2, '🎁 БОНУСНЫЙ РАУНД +80', '#FFD700', 2500);
  }
}
