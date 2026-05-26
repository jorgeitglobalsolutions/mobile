/**
 * Renames assets/exercises folders and .gif files to English.
 * Run: node scripts/renameExerciseAssets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const exercisesRoot = path.join(root, 'assets', 'exercises');

/** Spanish basename (without .gif) -> English basename */
const FILE_EN = {
  'Abdomen en banco': 'Ab crunch on bench',
  'Bicicleta abdominal': 'Bicycle crunch',
  'Crunch abdominal': 'Ab crunch',
  'Crunch en máquina': 'Machine crunch',
  'Crunch en polea alta': 'High cable crunch',
  'Crunch oblicuo': 'Oblique crunch',
  'Elevación de piernas en el suelo': 'Floor leg raise',
  'Plancha abdominal': 'Plank',

  'Banco romano': 'Roman chair hyperextension',
  'Jalón al pecho con agarre amplio': 'Wide grip lat pulldown',
  'Jalón al pecho con agarre cerrado en triángulo': 'Close grip triangle lat pulldown',
  'Jalón unilateral en polea': 'Single arm cable pulldown',
  'Pulldown inclinado con cuerda': 'Incline rope pulldown',
  'Remo bajo en polea con agarre amplio supino': 'Underhand wide grip cable row',
  'Remo bajo en polea con agarre cerrado': 'Close grip cable row',
  'Remo con barra inclinado': 'Incline barbell row',
  'Remo con mancuernas': 'Dumbbell row',
  'Remo en máquina convergente': 'Converging machine row',
  'Remo en T con agarre amplio': 'Wide grip T-bar row',
  'Remo inclinado en polea': 'Incline cable row',
  'Remo invertido en mesa': 'Inverted bench row',
  'Remo sentado en polea': 'Seated cable row',
  'Remo tipo serrucho': 'Meadows row',

  'Curl alterno con supinación': 'Alternating supinating curl',
  'Curl alterno sentado con agarre neutro': 'Seated neutral grip alternating curl',
  'Curl con barra EZ': 'EZ bar curl',
  'Curl concentrado': 'Concentration curl',
  'Curl de bíceps con mancuernas': 'Dumbbell bicep curl',
  'Curl en polea con barra EZ': 'EZ bar cable curl',
  'Curl inverso con barra EZ': 'Reverse EZ bar curl',
  'Curl Scott con barra EZ': 'EZ bar preacher curl',

  'Aperturas en Pec Deck': 'Pec deck fly',
  'Aperturas en polea para pecho superior': 'High cable chest fly',
  'Flexiones con manos elevadas': 'Hands elevated push-up',
  'Flexiones con toque de hombros': 'Push-up with shoulder tap',
  'Flexiones de pecho mas abiertas': 'Wide chest push-up',
  'Flexiones diamante rodillas apoyadas': 'Knee diamond push-up',
  'Flexiones diamante': 'Diamond push-up',
  'Flexiones en pica': 'Pike push-up',
  'Press de pecho con agarre amplio': 'Wide grip chest press',
  'Press de pecho con mancuernas': 'Dumbbell chest press',
  'Press de pecho en máquina convergente': 'Converging chest press machine',
  'Press de pecho en máquina Smith': 'Smith machine chest press',
  'Press de pecho en Smith con agarre cerrado': 'Close grip Smith chest press',
  'Press de pecho unilateral en polea': 'Single arm cable chest press',
  'Press inclinado con barra': 'Incline barbell press',
  'Press inclinado con mancuernas': 'Incline dumbbell press',
  'Pullover con mancuerna': 'Dumbbell pullover',

  'Abducción de cadera con banda elástica': 'Banded hip abduction',
  'Abducción de cadera en polea': 'Cable hip abduction',
  'Buenos días con barra': 'Barbell good morning',
  'Curl femoral sentado': 'Seated leg curl',
  'Curl femoral tumbado': 'Lying leg curl',
  'Curl femoral unilateral en máquina': 'Single leg curl machine',
  'Elevación de rodillas con mancuernas': 'Dumbbell knee raise',
  'Extensión de piernas unilateral': 'Single leg extension',
  'Hip Thrust con barra': 'Barbell hip thrust',
  'Hip Thrust en máquina Smith': 'Smith machine hip thrust',
  'Leg Press Horizontal': 'Horizontal leg press',
  'Leg Press': 'Leg press',
  'Máquina de abducción de cadera': 'Hip abduction machine',
  'Máquina de aducción de cadera': 'Hip adduction machine',
  'Patada de glúteo en banco con banda elástica (2)': 'Banded glute kickback on bench',
  'Patada de glúteo en polea baja': 'Low cable glute kickback',
  'Peso muerto con barra': 'Barbell deadlift',
  'Peso muerto rumano con mancuernas': 'Dumbbell Romanian deadlift',
  'Puente de glúteos con mancuernas': 'Dumbbell glute bridge',
  'Sentadilla búlgara con mancuernas': 'Dumbbell Bulgarian split squat',
  'Sentadilla en máquina Hack': 'Hack squat machine',
  'Sentadilla en máquina Smith': 'Smith machine squat',
  'Sentadilla sumo con mancuerna': 'Dumbbell sumo squat',
  'Step-Up con elevación de rodilla': 'Step-up with knee raise',
  'Wall Sit': 'Wall sit',
  'Zancadas con mancuernas': 'Dumbbell lunges',

  'Aperturas inversas en polea': 'Reverse cable fly',
  'Elevaciones frontales con mancuernas': 'Dumbbell front raise',
  'Elevaciones laterales con mancuernas': 'Dumbbell lateral raise',
  'Elevaciones laterales sentado': 'Seated lateral raise',
  'Elevación lateral unilateral en polea': 'Single arm cable lateral raise',
  'Press de hombros en máquina Smith': 'Smith machine shoulder press',
  'Press de hombros sentado con mancuernas': 'Seated dumbbell shoulder press',
  'Press militar con barra': 'Barbell overhead press',
  'Press militar con mancuernas': 'Dumbbell overhead press',
  'Pájaros inversos en máquina': 'Machine reverse fly',

  'Extensión de tríceps acostado con mancuernas': 'Lying dumbbell triceps extension',
  'Extensión de tríceps por encima de la cabeza en polea unilateral':
    'Single arm overhead cable triceps extension',
  'Fondos en banco': 'Bench dips',
  'Jalón de tríceps con agarre cerrado en triángulo': 'Triangle grip triceps pushdown',
  'Jalón de tríceps con barra recta': 'Straight bar triceps pushdown',
  'Jalón de tríceps con cuerda': 'Rope triceps pushdown',
};

const FOLDER_EN = {
  'abdominal exercises': 'core exercises',
  'back exercises': 'back exercises',
  'biceps exercises': 'biceps exercises',
  'Chest Exercises': 'chest exercises',
  'leg exercises': 'leg exercises',
  'shoulder exercises': 'shoulder exercises',
  'triceps exercises': 'triceps exercises',
};

function normalizeKey(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const fileEnByNorm = new Map();
for (const [es, en] of Object.entries(FILE_EN)) {
  fileEnByNorm.set(normalizeKey(es), en);
}

function englishFileBase(spanishBase) {
  const direct = FILE_EN[spanishBase];
  if (direct) return direct;
  const norm = normalizeKey(spanishBase);
  const hit = fileEnByNorm.get(norm);
  if (hit) return hit;
  return null;
}

function renameSafe(from, to) {
  if (from === to) return false;
  if (!fs.existsSync(from)) {
    console.warn('SKIP missing:', from);
    return false;
  }
  if (fs.existsSync(to)) {
    console.warn('SKIP exists:', to);
    return false;
  }
  fs.renameSync(from, to);
  return true;
}

function walkDirs(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      acc.push(full);
      walkDirs(full, acc);
    }
  }
  return acc;
}

function main() {
  if (!fs.existsSync(exercisesRoot)) {
    console.error('Not found:', exercisesRoot);
    process.exit(1);
  }

  let fileRenames = 0;
  let folderRenames = 0;
  const misses = [];

  // Rename files (deepest folders first)
  const dirs = walkDirs(exercisesRoot).sort((a, b) => b.length - a.length);
  for (const dir of [exercisesRoot, ...dirs]) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!ent.isFile() || !ent.name.toLowerCase().endsWith('.gif')) continue;
      const base = ent.name.slice(0, -4);
      const en = englishFileBase(base);
      if (!en) {
        misses.push(path.join(dir, ent.name));
        continue;
      }
      const from = path.join(dir, ent.name);
      const to = path.join(dir, `${en}.gif`);
      if (renameSafe(from, to)) fileRenames++;
    }
  }

  // Rename folders (deepest first)
  const allDirs = walkDirs(exercisesRoot).sort((a, b) => b.length - a.length);
  for (const dir of allDirs) {
    const parent = path.dirname(dir);
    const name = path.basename(dir);
    const en = FOLDER_EN[name] ?? name;
    if (en === name) continue;
    const to = path.join(parent, en);
    if (renameSafe(dir, to)) folderRenames++;
  }

  console.log(`Files renamed: ${fileRenames}`);
  console.log(`Folders renamed: ${folderRenames}`);
  if (misses.length) {
    console.log('Unmapped files:');
    misses.forEach((m) => console.log(' -', m));
    process.exit(1);
  }
}

main();
