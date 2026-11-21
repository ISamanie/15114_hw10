import assert from 'node:assert/strict';
import { test } from 'node:test';

import { exerciseDraftKey, recoverExerciseDraft } from '../src/data/exercise-draft.ts';
import { initialData } from '../src/data/exercises.ts';
import { DamagedWorkoutSnapshot, loadWorkoutState, recentKey, saveRecentExercises, workoutKey } from '../src/data/workout-persistence.ts';
import { bestSet, buildWorkout, cutoffDate, exerciseHistory, formatWeightInput, getWorkout, parseDraftSet, progressSeries,
  putWorkout, removeWorkout } from '../src/data/workouts.ts';

const benchId = 'barbell-bench-press';

function workout(id, unit, blocks, day = '2026-10-10') {
  const startedAt = `${day}T16:00:00.000Z`;
  const completedAt = `${day}T16:15:00.000Z`;
  return buildWorkout({ id, unit, date: day, startedAt, completedAt, durationSeconds: 900 },
    blocks.map((rows, index) => ({ id: `${id}-block-${index}`, exerciseId: benchId,
      sets: rows.map(([weight, reps, done = true], setIndex) => ({ id: `${id}-${index}-${setIndex}`, weight, reps, done })),
    })), initialData().exercises);
}

function memoryStorage(entries = []) {
  const values = new Map(entries);
  const writes = [];
  return { values, writes, getItem: async (key) => values.get(key) ?? null, setItem: async (key, value) => {
    writes.push(key);
    values.set(key, value);
  } };
}

test('equivalent mixed-unit weights use reps as the PR tie-breaker', () => {
  const pounds = workout('imperial', 'lb', [[['5', '4']]]);
  const kilos = workout('metric', 'kg', [[['2.26796185', '12']]]);
  const lighter = workout('lighter', 'kg', [[['2.26796184', '15']]]);
  const data = [pounds, kilos, lighter].reduce(putWorkout, initialData());
  const history = exerciseHistory(data, benchId);
  assert.equal(bestSet(history.map(({ best }) => best)).id, kilos.sets[0].id);
  assert.equal(bestSet([{ weight: 0, reps: 10 }, { weight: 0, reps: 12 }]).reps, 12);
});

test('small decimal weights can be saved again after editing in either unit', () => {
  for (const unit of ['kg', 'lb']) {
    const original = workout(`small-${unit}`, unit, [[['0.0000001', '3']]]);
    const input = formatWeightInput(original.sets[0].weight, unit);
    assert.equal(input, '0.0000001');
    assert.deepEqual(parseDraftSet({ weight: input, reps: '3' }, 'free_weight', unit),
      { weight: original.sets[0].weight, reps: 3 });
    const edited = workout(original.session.id, unit, [[[input, '4']]]);
    assert.equal(edited.sets[0].weight, original.sets[0].weight);
  }
});

test('history keeps each logged block while progress and totals group by session', () => {
  const first = workout('first', 'kg', [[['25', '5'], ['200', '1', false]], [['30', '5']]], '2026-09-30');
  const second = workout('second', 'kg', [[['20', '4']]], '2026-10-10');
  const data = putWorkout(putWorkout(initialData(), first), second);
  const history = exerciseHistory(data, benchId);
  const blocks = exerciseHistory(data, benchId, 'block').reverse();
  assert.equal(first.session.totalSets, 2);
  assert.equal(first.session.totalVolume, 275);
  assert.deepEqual(blocks.map(({ id, volume }) => [id, volume]),
    [['second-block-0', 80], ['first-block-1', 150], ['first-block-0', 125]]);
  assert.deepEqual(history.map(({ volume }) => volume), [275, 80]);
  assert.deepEqual(progressSeries(history, 'best', 'kg', true, '2026-10-01').map(({ value }) => value), [30]);
  assert.deepEqual(progressSeries(history, 'volume', 'kg', true, '2026-10-01').map(({ value }) => value), [80]);
  assert.equal(cutoffDate(1, new Date(2026, 2, 31)), '2026-02-28');
});

test('editing and deleting sessions replace their linked records', () => {
  const original = workout('replace', 'kg', [[['80', '5']], [['100', '3']]]);
  const data = putWorkout(initialData(), original);
  const revised = workout('replace', 'kg', [[['75', '4']]]);
  const updated = putWorkout(data, revised);
  assert.equal(updated.sessions.length, 1);
  assert.equal(updated.workoutExercises.length, 1);
  assert.equal(getWorkout(updated, revised.session).sets.length, 1);
  assert.equal(exerciseHistory(updated, benchId)[0].volume, 300);
  const deleted = removeWorkout(updated, revised.session.id);
  assert.equal(deleted.sessions.length, 0);
  assert.equal(deleted.workoutExercises.length, 0);
  assert.equal(deleted.sets.length, 0);
});

test('legacy recents migrate and future visits do not write workout history', async () => {
  const log = workout('existing', 'lb', [[['50', '5']]]);
  const data = putWorkout(initialData(), log);
  const raw = JSON.stringify({ ...data, recentExerciseIds: [benchId, 'missing', benchId] });
  const storage = memoryStorage([[workoutKey, raw]]);
  assert.deepEqual(await loadWorkoutState(storage), { data, recents: [benchId] });
  assert.deepEqual(storage.writes, [recentKey]);
  await saveRecentExercises(storage, ['push-ups', benchId]);
  assert.deepEqual((await loadWorkoutState(storage)).recents, ['push-ups', benchId]);
  assert.equal(storage.values.get(workoutKey), raw);
  assert.deepEqual(storage.writes, [recentKey, recentKey]);
});

test('recovery backs up the original, keeps valid records, and recalculates totals', async () => {
  const log = workout('damaged', 'kg', [[['80', '5'], ['70', '7']]]);
  const data = putWorkout(initialData(), log);
  const custom = { ...data.exercises[0], id: 'custom-exercise', name: 'Custom Press', isCustom: true, imageUri: 'photo:custom.jpg' };
  data.exercises = [...data.exercises, custom, { id: 'bad-exercise', name: null }];
  data.workoutExercises.push({ id: 'orphan', exerciseId: 'bad-exercise', sessionId: log.session.id, orderIndex: 1 });
  data.sets[1] = { ...data.sets[1], reps: 'invalid' };
  data.sets.push({ ...data.sets[0], id: 'orphan-set', workoutExerciseId: 'orphan' });
  const raw = JSON.stringify(data);
  const storage = memoryStorage([[workoutKey, raw]]);
  await assert.rejects(loadWorkoutState(storage), DamagedWorkoutSnapshot);
  assert.deepEqual(storage.writes, []);
  const recovered = await loadWorkoutState(storage, true);
  assert.ok(storage.writes[0].startsWith(`${workoutKey}:backup:`));
  assert.equal(storage.values.get(storage.writes[0]), raw);
  assert.ok(recovered.data.exercises.some(({ imageUri }) => imageUri === 'photo:custom.jpg'));
  assert.equal(recovered.data.workoutExercises.length, 1);
  assert.equal(recovered.data.sets.length, 1);
  assert.equal(recovered.data.sessions[0].totalVolume, 400);
  assert.equal(recovered.data.sessions[0].totalSets, 1);
  assert.deepEqual(await loadWorkoutState(storage), recovered);
});

test('unparseable data can be recovered and a failed backup leaves the original intact', async () => {
  const raw = '{invalid JSON';
  const storage = memoryStorage([[workoutKey, raw]]);
  await assert.rejects(loadWorkoutState(storage), DamagedWorkoutSnapshot);
  const readOnly = { ...storage, setItem: async () => { throw new Error('Backup failed'); } };
  await assert.rejects(loadWorkoutState(readOnly, true), /Backup failed/);
  assert.equal(storage.values.get(workoutKey), raw);
  const result = await loadWorkoutState(storage, true);
  assert.equal(result.data.exercises.length, initialData().exercises.length);
  assert.equal(storage.values.get(storage.writes[0]), raw);
});

test('Android picker recovery restores form text and keeps the consumed photo available', async () => {
  const draft = { id: 'draft-id', name: 'Custom Press', equipment: 'machine', muscle: 'Chest',
    description: 'Press forward', icon: 'machine', photo: { uri: 'file:///previous.jpg' } };
  const storage = memoryStorage([[exerciseDraftKey, JSON.stringify(draft)]]);
  const restored = await recoverExerciseDraft(storage, async () => ({ canceled: false,
    assets: [{ uri: 'file:///recovered.jpg', fileName: 'recovered.jpg' }] }));
  assert.equal(restored.name, draft.name);
  assert.equal(restored.description, draft.description);
  assert.equal(restored.photo.uri, 'file:///recovered.jpg');
  assert.equal((await recoverExerciseDraft(storage, async () => null)).photo.uri, 'file:///recovered.jpg');
  const failed = await recoverExerciseDraft(storage, async () => ({ code: 'error', message: 'failed' }));
  assert.equal(failed.photo.uri, 'file:///recovered.jpg');
  assert.match(failed.photoError, /Couldn’t recover/);
  assert.equal(await recoverExerciseDraft(memoryStorage(), async () => assert.fail('No checkpoint exists')), null);
});
