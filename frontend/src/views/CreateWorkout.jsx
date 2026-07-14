import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { ArrowLeft, Save, Plus, Trash2, Search, Dumbbell, ChevronRight, X, AlertTriangle } from 'lucide-react';

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
};

function NumberStepper({ value, min = 0, onChange }) {
  const update = (next) => onChange(Math.max(min, next));
  return <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <button type="button" onClick={() => update((Number(value) || 0) - 1)} style={{ width: '26px', height: '34px', border: 'none', borderRadius: '8px', background: 'rgba(255,255,255,.08)', color: 'var(--color-primary)', cursor: 'pointer' }}>−</button>
    <input type="number" min={min} className="form-control compact-stepper-input" style={{ minHeight: '34px', padding: '5px', fontSize: '14px', textAlign: 'center' }} value={value} onChange={e => onChange(Math.max(min, parseInt(e.target.value) || min))} />
    <button type="button" onClick={() => update((Number(value) || 0) + 1)} style={{ width: '26px', height: '34px', border: 'none', borderRadius: '8px', background: 'rgba(255,255,255,.08)', color: 'var(--color-primary)', cursor: 'pointer' }}>+</button>
  </div>;
}

export default function CreateWorkout({ workoutId, onBack, onSaveSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState([{ id: generateUuid(), name: 'Giorno 1', exercises: [] }]);
  const [activeDayId, setActiveDayId] = useState(null);
  
  // Database library data
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Selector state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom exercise form state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  useEffect(() => {
    fetchExerciseLibrary();
    if (workoutId) loadWorkout();
  }, []);

  const loadWorkout = async () => {
    try {
      const plan = await api.getWorkoutDetails(workoutId);
      setName(plan.name || '');
      setDescription(plan.description || '');
      setDays(plan.days || []);
      setActiveDayId(plan.days?.[0]?.id || null);
    } catch (err) {
      setError('Impossibile caricare la scheda.');
    }
  };

  const activeDay = days.find(day => day.id === (activeDayId || days[0]?.id)) || days[0];
  const selectedExercises = activeDay?.exercises || [];
  const updateActiveDay = (updater) => {
    const dayId = activeDay.id;
    setDays(current => current.map(day => day.id === dayId ? updater(day) : day));
  };

  const addDay = () => {
    const newDay = { id: generateUuid(), name: `Giorno ${days.length + 1}`, exercises: [] };
    setDays(current => [...current, newDay]);
    setActiveDayId(newDay.id);
  };

  const removeDay = (dayId) => {
    if (days.length === 1) return;
    const remaining = days.filter(day => day.id !== dayId);
    setDays(remaining);
    if (activeDayId === dayId) setActiveDayId(remaining[0].id);
  };

  const fetchExerciseLibrary = async () => {
    setLoading(true);
    try {
      const catsData = await api.getCategories();
      const exData = await api.getExercises();
      setCategories(catsData.categories || []);
      setExercises(exData.exercises || []);
      if (catsData.categories && catsData.categories.length > 0) {
        setSelectedCategoryTab(catsData.categories[0].id);
        setCustomCategory(catsData.categories[0].id);
      }
    } catch (err) {
      console.error('Error fetching exercise library:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExerciseToPlan = (exercise) => {
    // Add exercise with default sets and reps
    const newEntry = {
      exercise_id: exercise.id,
      name: exercise.name,
      sets: 3,
      reps: '10',
      rest_time: 60
    };
    updateActiveDay(day => ({ ...day, exercises: [...day.exercises, newEntry] }));
    setShowAddModal(false);
    setSearchQuery('');
  };

  const handleRemoveExercise = (index) => {
    updateActiveDay(day => ({ ...day, exercises: day.exercises.filter((_, i) => i !== index) }));
  };

  const handleUpdateExerciseParam = (index, param, value) => {
    updateActiveDay(day => ({ ...day, exercises: day.exercises.map((exercise, i) => i === index ? { ...exercise, [param]: value } : exercise) }));
  };

  const handleCreateCustomExercise = async (e) => {
    e.preventDefault();
    if (!customName || !customCategory) return;

    try {
      const result = await api.createCustomExercise(customName, customCategory, customDesc);
      const newEx = result.exercise;
      
      // Update local state list of exercises
      setExercises([...exercises, newEx]);
      
      // Add immediately to the workout plan
      handleAddExerciseToPlan(newEx);
      
      // Reset custom form
      setCustomName('');
      setCustomDesc('');
      setShowCustomForm(false);
    } catch (err) {
      alert(err.message || 'Errore nella creazione dell\'esercizio.');
    }
  };

  const handleSaveWorkout = async () => {
    if (!name) {
      setError('Inserisci il nome della scheda.');
      return;
    }
    if (days.some(day => !day.name.trim()) || days.some(day => day.exercises.length === 0)) {
      setError('Ogni giorno deve avere un nome e almeno un esercizio.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (workoutId) await api.updateWorkout(workoutId, name, description, days);
      else await api.createWorkout(name, description, days);
      onSaveSuccess();
    } catch (err) {
      setError(err.message || 'Errore nel salvataggio della scheda.');
    } finally {
      setSaving(false);
    }
  };

  // Filter exercises based on search and category
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = ex.category_id === selectedCategoryTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '800' }}>{workoutId ? 'Modifica Scheda' : 'Nuova Scheda'}</h1>
        </div>

        <button 
          onClick={handleSaveWorkout}
          className="btn-primary"
          disabled={saving}
          style={{ width: 'auto', padding: '8px 16px', borderRadius: '12px', fontSize: '14px' }}
        >
          <Save size={16} />
          {saving ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>

      {/* Main Form content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px 20px' }}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--accent-red)',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Plan Details */}
        <div className="glass-panel" style={{ marginBottom: '24px' }}>
          <div className="form-group">
            <label>NOME SCHEDA</label>
            <input
              type="text"
              className="form-control"
              placeholder="es. Scheda A - Spinta, Forza"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label>DESCRIZIONE (OPZIONALE)</label>
            <input
              type="text"
              className="form-control"
              placeholder="es. Lunedì - Focus Petto e Spalle"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-secondary)' }}>Giorni della scheda</h3>
            <button onClick={addDay} className="btn-secondary" style={{ width: 'auto', padding: '8px 12px', fontSize: '12px' }}><Plus size={14} /> Aggiungi giorno</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {days.map((day, index) => (
              <button key={day.id} onClick={() => setActiveDayId(day.id)} style={{ flex: '0 0 auto', border: `1px solid ${activeDay.id === day.id ? 'var(--accent-orange)' : 'var(--border-color)'}`, background: activeDay.id === day.id ? 'rgba(255,122,0,.14)' : 'rgba(255,255,255,.03)', color: activeDay.id === day.id ? 'var(--accent-orange)' : 'var(--color-secondary)', borderRadius: '12px', padding: '10px 12px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                {day.name || `Giorno ${index + 1}`} · {day.exercises.length}
              </button>
            ))}
          </div>
          <div className="glass-panel" style={{ padding: '14px', marginTop: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-muted)', marginBottom: '6px' }}>NOME DEL GIORNO</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input className="form-control" value={activeDay.name} placeholder="es. Giorno A — Spinta" onChange={e => updateActiveDay(day => ({ ...day, name: e.target.value }))} />
              {days.length > 1 && <button onClick={() => removeDay(activeDay.id)} title="Elimina giorno" style={{ border: 'none', background: 'rgba(239,68,68,.1)', color: 'var(--accent-red)', borderRadius: '10px', padding: '12px', cursor: 'pointer' }}><Trash2 size={17} /></button>}
            </div>
          </div>
        </div>

        {/* Selected Exercises List */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-secondary)' }}>Esercizi — {activeDay.name || 'Giorno'}</h3>
            <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>{selectedExercises.length} selezionati</span>
          </div>

          {selectedExercises.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 16px',
              background: 'rgba(255, 255, 255, 0.01)',
              borderRadius: '16px',
              border: '1px dashed var(--border-color)'
            }}>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', marginBottom: '16px' }}>Nessun esercizio ancora aggiunto.</p>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '10px 16px', borderRadius: '10px', width: 'auto', margin: '0 auto' }}
              >
                <Plus size={14} /> Aggiungi esercizio
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedExercises.map((entry, index) => (
                <div key={index} className="glass-panel" style={{ padding: '16px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingRight: '24px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{entry.name}</h4>
                    <button
                      onClick={() => handleRemoveExercise(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-red)',
                        position: 'absolute',
                        right: '16px',
                        top: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  {/* Workout Parameters settings */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>SERIE</label>
                      <NumberStepper min={1} value={entry.sets} onChange={value => handleUpdateExerciseParam(index, 'sets', value)} />
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <label style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>RIPETIZIONI</label>
                      <NumberStepper min={1} value={parseInt(entry.reps) || 1} onChange={value => handleUpdateExerciseParam(index, 'reps', String(value))} />
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <label style={{ fontSize: '10px', color: 'var(--color-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>RECUPERO (S)</label>
                      <NumberStepper value={entry.rest_time} onChange={value => handleUpdateExerciseParam(index, 'rest_time', value)} />
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={() => setShowAddModal(true)} 
                className="btn-secondary"
                style={{ fontSize: '14px', display: 'flex', gap: '8px', padding: '12px' }}
              >
                <Plus size={16} /> Aggiungi altro esercizio
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slide-up Exercise Selector Drawer / Modal */}
      {showAddModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(3, 7, 18, 0.95)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Seleziona Esercizio</h3>
            <button 
              onClick={() => { setShowAddModal(false); setShowCustomForm(false); }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Search */}
          {!showCustomForm && (
            <div style={{ padding: '16px 20px 8px 20px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Cerca esercizio per nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Inline Custom Form Toggle */}
          <div style={{ padding: '10px 20px' }}>
            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              style={{
                background: showCustomForm ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 122, 0, 0.1)',
                border: showCustomForm ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255, 122, 0, 0.2)',
                color: showCustomForm ? 'var(--accent-red)' : 'var(--accent-orange)',
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'var(--font-family-title)',
                fontSize: '13px'
              }}
            >
              {showCustomForm ? 'Annulla esercizio personalizzato' : '+ Crea esercizio personalizzato'}
            </button>
          </div>

          {showCustomForm ? (
            /* Custom Exercise Form */
            <form onSubmit={handleCreateCustomExercise} style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Nuovo Esercizio Custom</h4>
              <div className="form-group">
                <label>NOME ESERCIZIO</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="es. Piegamenti a Diamante"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>CATEGORIA</label>
                <select
                  className="form-control"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>DESCRIZIONE (OPZIONALE)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="es. Focus parte interna dei tricipiti"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary">
                Crea ed Aggiungi
              </button>
            </form>
          ) : (
            /* Main List & Tabs */
            <>
              {/* Categories horizontally scrollable tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '8px 20px',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryTab(cat.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      background: selectedCategoryTab === cat.id ? 'var(--accent-orange)' : 'rgba(255,255,255,0.03)',
                      color: selectedCategoryTab === cat.id ? '#fff' : 'var(--color-secondary)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Exercises List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                {filteredExercises.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)', fontSize: '13px' }}>
                    Nessun esercizio trovato in questa categoria.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredExercises.map(ex => (
                      <div 
                        key={ex.id}
                        onClick={() => handleAddExerciseToPlan(ex)}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>{ex.name}</span>
                          {ex.description && <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{ex.description}</span>}
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--color-muted)' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
